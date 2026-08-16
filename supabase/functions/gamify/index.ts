import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';

interface GamifyPayload {
  action?: unknown;
  badgeName?: unknown;
  planId?: unknown;
}

interface ReadingPlanRelation {
  total_chapters?: unknown;
}

interface UnlockedBadgeRow {
  badges?: { name?: string } | null;
}

const getErrorMessage = (error: unknown): string => error instanceof Error ? error.message : String(error);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      throw new Error('Missing environment variables: SUPABASE_URL, SUPABASE_ANON_KEY, or SUPABASE_SERVICE_ROLE_KEY.');
    }

    // Initialize Supabase Client using the request's Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUserClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    // Verify JWT
    const {
      data: { user },
      error: authError,
    } = await supabaseUserClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized user token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse Request Body
    const body = await req.json() as GamifyPayload;
    const action = typeof body.action === 'string' ? body.action : undefined;
    const payload = body;

    // Initialize Admin Client (service_role) to execute writes bypassing RLS constraints
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    if (action === 'complete_sunday_school') {
      const badgeName = typeof payload.badgeName === 'string' ? payload.badgeName : 'Campeón Dominical';

      // 1. Fetch Badge ID by Name
      const { data: badge, error: badgeError } = await supabaseAdmin
        .from('badges')
        .select('id, name')
        .eq('name', badgeName)
        .single();

      if (badgeError || !badge) {
        return new Response(
          JSON.stringify({ error: `Badge '${badgeName}' not found in database.` }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 2. Check if user already unlocked this badge
      const { data: existingBadge, error: existingError } = await supabaseAdmin
        .from('user_badges')
        .select('id')
        .eq('user_id', user.id)
        .eq('badge_id', badge.id)
        .maybeSingle();

      if (existingError) {
        throw existingError;
      }

      if (existingBadge) {
        return new Response(
          JSON.stringify({ message: 'Badge already unlocked', newlyUnlocked: false, badgeName: badge.name }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 3. Unlock badge for user
      const { error: insertError } = await supabaseAdmin
        .from('user_badges')
        .insert({
          user_id: user.id,
          badge_id: badge.id,
        });

      if (insertError) {
        if (insertError.code === '23505') {
          return new Response(
            JSON.stringify({ message: 'Badge already unlocked', newlyUnlocked: false, badgeName: badge.name }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        throw insertError;
      }

      return new Response(
        JSON.stringify({ message: 'Badge unlocked successfully!', newlyUnlocked: true, badgeName: badge.name }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } 
    
    if (action === 'check_reading_milestones') {
      const planId = typeof payload.planId === 'string' ? payload.planId : undefined;
      if (!planId) {
        return new Response(
          JSON.stringify({ error: 'Missing planId in request payload' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 1. Fetch User Progress and Plan Total Chapters
      const { data: progress, error: progressError } = await supabaseAdmin
        .from('user_reading_progress')
        .select('completed_chapters, plan_id, reading_plans(total_chapters)')
        .eq('user_id', user.id)
        .eq('plan_id', planId)
        .single();

      if (progressError || !progress) {
        return new Response(
          JSON.stringify({ error: 'Reading progress not found for this user and plan.' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const completed = progress.completed_chapters;
      const readingPlan = progress.reading_plans as ReadingPlanRelation | null;
      const total = readingPlan?.total_chapters;

      if (typeof completed !== 'number' || typeof total !== 'number') {
        throw new Error('Invalid chapter metadata in reading plan.');
      }

      // Define milestones
      const milestones = [
        { name: 'Primeros Pasos', minChapters: 1 },
        { name: 'Explorador Bíblico', minRatio: 0.5 },
        { name: 'Erudito de la Palabra', minRatio: 1.0 }
      ];

      // 2. Fetch already unlocked badges
      const { data: unlockedBadges, error: unlockedError } = await supabaseAdmin
        .from('user_badges')
        .select('badge_id, badges(name)')
        .eq('user_id', user.id);

      if (unlockedError) throw unlockedError;

      const unlockedNames = unlockedBadges 
        ? (unlockedBadges as UnlockedBadgeRow[]).map((ub) => ub.badges?.name).filter((name): name is string => Boolean(name))
        : [];

      const newlyUnlocked: string[] = [];

      // 3. Evaluate each milestone
      for (const milestone of milestones) {
        if (unlockedNames.includes(milestone.name)) continue;

        let meetsCriteria = false;
        if (milestone.minChapters !== undefined && completed >= milestone.minChapters) {
          meetsCriteria = true;
        } else if (milestone.minRatio !== undefined && completed >= Math.ceil(total * milestone.minRatio)) {
          meetsCriteria = true;
        }

        if (meetsCriteria) {
          // Fetch badge ID
          const { data: badge, error: badgeFindError } = await supabaseAdmin
            .from('badges')
            .select('id')
            .eq('name', milestone.name)
            .single();

          if (!badgeFindError && badge) {
            // Unlock badge using Admin Client
            const { error: unlockError } = await supabaseAdmin
              .from('user_badges')
              .insert({
                user_id: user.id,
                badge_id: badge.id
              });

            if (!unlockError) {
              newlyUnlocked.push(milestone.name);
            }
          }
        }
      }

      return new Response(
        JSON.stringify({ 
          message: 'Reading progress evaluated.', 
          newlyUnlocked,
          completed,
          total
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: `Unknown action: ${action}` }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    return new Response(
      JSON.stringify({ error: getErrorMessage(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
