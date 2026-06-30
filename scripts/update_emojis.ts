import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or Service Role Key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const questionsToUpdate = [
  {
    search: "piedras",
    replace: "🪨 piedras",
    fields: ['option_a', 'option_b', 'option_c', 'option_d', 'explanation']
  },
  {
    search: "David",
    replace: "👑 David",
    fields: ['option_a', 'option_b', 'option_c', 'option_d']
  },
  {
    search: "agua",
    replace: "💧 agua",
    fields: ['option_a', 'option_b', 'option_c', 'option_d']
  },
  {
    search: "cruz",
    replace: "✝️ cruz",
    fields: ['option_a', 'option_b', 'option_c', 'option_d']
  },
  {
    search: "Pez",
    replace: "🐟 Pez",
    fields: ['option_a', 'option_b', 'option_c', 'option_d']
  },
  {
    search: "León",
    replace: "🦁 León",
    fields: ['option_a', 'option_b', 'option_c', 'option_d']
  },
  {
    search: "manzana",
    replace: "🍎 manzana",
    fields: ['option_a', 'option_b', 'option_c', 'option_d']
  },
  {
    search: "paloma",
    replace: "🕊️ paloma",
    fields: ['option_a', 'option_b', 'option_c', 'option_d']
  },
  {
    search: "Moisés",
    replace: "📜 Moisés",
    fields: ['option_a', 'option_b', 'option_c', 'option_d']
  },
  {
    search: "Pedro",
    replace: "🎣 Pedro",
    fields: ['option_a', 'option_b', 'option_c', 'option_d']
  },
  {
    search: "Juan",
    replace: "🦅 Juan",
    fields: ['option_a', 'option_b', 'option_c', 'option_d']
  },
  {
    search: "Jesús",
    replace: "✨ Jesús",
    fields: ['option_a', 'option_b', 'option_c', 'option_d']
  }
];

async function updateQuestions() {
  const { data: questions, error } = await supabase
    .from('game_biblionario_questions')
    .select('*');

  if (error) {
    console.error('Error fetching questions:', error);
    return;
  }

  let updatedCount = 0;

  for (const question of questions) {
    let updated = false;
    let newQuestion = { ...question };

    for (const rule of questionsToUpdate) {
      for (const field of rule.fields) {
        if (newQuestion[field] && newQuestion[field].includes(rule.search) && !newQuestion[field].includes(rule.replace)) {
          // Utilizar regex para reemplazar coincidencia exacta de palabra, case insensitive
          const regex = new RegExp(`\\b${rule.search}\\b`, 'gi');
          if (regex.test(newQuestion[field])) {
             newQuestion[field] = newQuestion[field].replace(regex, rule.replace);
             updated = true;
          }
        }
      }
    }

    if (updated) {
      const { error: updateError } = await supabase
        .from('game_biblionario_questions')
        .update({
          option_a: newQuestion.option_a,
          option_b: newQuestion.option_b,
          option_c: newQuestion.option_c,
          option_d: newQuestion.option_d,
          explanation: newQuestion.explanation
        })
        .eq('id', question.id);

      if (updateError) {
        console.error(`Error updating question ${question.id}:`, updateError);
      } else {
        console.log(`Updated question: ${question.question}`);
        updatedCount++;
      }
    }
  }

  console.log(`Finished updating ${updatedCount} questions.`);
}

updateQuestions();
