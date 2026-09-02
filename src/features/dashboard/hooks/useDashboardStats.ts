import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../config/supabase';
import type { DashboardAccess, DashboardMember, DashboardData, TalentDirectoryEntry, WeeklyAlert } from '../types';
import { MONTHS, BIBLE_VERSES } from '../constants';

const parseCalendarDate = (value: string) => new Date(`${value.slice(0, 10)}T12:00:00`);

const dashboardSummaryRpcEnabled = import.meta.env.VITE_DASHBOARD_SUMMARY_RPC === 'true';

type DashboardSummaryMetrics = {
  total_donations_amount: number | string;
  members_count: number;
  leaders_count: number;
  inventory_count: number;
  inventory_value: number | string;
  petitions_count: number;
  pending_petitions: number;
};

const getWeeklyAlerts = (membersList: DashboardMember[]): WeeklyAlert[] => {
  const today = new Date();
  const list: WeeklyAlert[] = [];

  membersList.forEach(m => {
    if (m.birth_date) {
      const birth = parseCalendarDate(m.birth_date);
      const bDayThisYear = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
      
      const diffTime = bDayThisYear.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays >= -1 && diffDays <= 7) {
        list.push({
          id: `${m.id}-bday`,
          name: `${m.first_name} ${m.last_name}`,
          type: 'birthday',
          dateLabel: `${birth.getDate()} de ${MONTHS[birth.getMonth()]}`,
          verse: BIBLE_VERSES[m.id.length % BIBLE_VERSES.length]
        });
      }
    }

    if (m.conversion_date) {
      const conv = parseCalendarDate(m.conversion_date);
      const cDayThisYear = new Date(today.getFullYear(), conv.getMonth(), conv.getDate());
      
      const diffTime = cDayThisYear.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays >= -1 && diffDays <= 7) {
        const years = today.getFullYear() - conv.getFullYear();
        list.push({
          id: `${m.id}-faith`,
          name: `${m.first_name} ${m.last_name}`,
          type: 'faith',
          dateLabel: `${conv.getDate()} de ${MONTHS[conv.getMonth()]}`,
          years: years > 0 ? `${years} años de fe` : 'Aniversario',
          verse: BIBLE_VERSES[(m.id.length + 1) % BIBLE_VERSES.length]
        });
      }
    }
  });

  return list;
};

export const processChartData = (membersList: DashboardMember[]) => {
  const today = new Date();
  const ages: number[] = [];
  const areaCounts: { [key: string]: number } = {};
  const talentCounts: { [key: string]: number } = {};
  const talentCategoryCounts: { [key: string]: number } = {};
  const baptismYearCounts: { [key: string]: number } = {};

  membersList.forEach(m => {
    // 1. Age calculation
    if (m.birth_date) {
      const birth = parseCalendarDate(m.birth_date);
      let age = today.getFullYear() - birth.getFullYear();
      const birthdayOccurred = today.getMonth() > birth.getMonth()
        || (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());
      if (!birthdayOccurred) age -= 1;
      if (age >= 0 && age <= 120) ages.push(age);
    }

    // 2. Service areas tally
    if (m.member_service_areas) {
      m.member_service_areas.forEach((sa) => {
        if (sa.catalog_roles) {
          const name = sa.catalog_roles.name;
          areaCounts[name] = (areaCounts[name] || 0) + 1;
        }
      });
    }

    // 3. Talents tally
    if (m.member_talents) {
      m.member_talents.forEach((t) => {
        if (t.catalog_roles) {
          const name = t.catalog_roles.name;
          const displayName = name.replace(/^\[.*?\]\s*/, '');
          talentCounts[displayName] = (talentCounts[displayName] || 0) + 1;

          const match = name.match(/^\[(.*?)\]\s*(.*)$/);
          const category = match ? match[1] : 'Otros';
          talentCategoryCounts[category] = (talentCategoryCounts[category] || 0) + 1;
        }
      });
    }

    // 4. Baptism progression
    if (m.baptism_date) {
      const year = parseCalendarDate(m.baptism_date).getFullYear().toString();
      baptismYearCounts[year] = (baptismYearCounts[year] || 0) + 1;
    }
  });

  const groups = { '0-18': 0, '19-30': 0, '31-50': 0, '51-70': 0, '70+': 0 };
  ages.forEach(age => {
    if (age <= 18) groups['0-18']++;
    else if (age <= 30) groups['19-30']++;
    else if (age <= 50) groups['31-50']++;
    else if (age <= 70) groups['51-70']++;
    else groups['70+']++;
  });

  const ageData = Object.entries(groups).map(([range, count]) => ({ range, cantidad: count }));
  const areasData = Object.entries(areaCounts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'es'))
    .map(([name, value]) => ({ name, miembros: value }));
  const talentsData = Object.entries(talentCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, value]) => ({ name, value }));
  const talentCategoriesData = Object.entries(talentCategoryCounts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'es'))
    .map(([name, value]) => ({ name, value }));
  
  const baptismsData = Object.entries(baptismYearCounts)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([year, count]) => ({ year, cantidad: count }));

  return { ageData, areasData, talentsData, talentCategoriesData, baptismsData };
};

export const buildTalentDirectory = (members: DashboardMember[]): TalentDirectoryEntry[] => members.flatMap((member) => {
  const seenTalents = new Set<string>();
  return (member.member_talents ?? []).flatMap((entry) => {
    const rawName = entry.catalog_roles?.name?.trim();
    if (!rawName) return [];
    const match = rawName.match(/^\[(.*?)\]\s*(.*)$/);
    const talentName = (match?.[2] || rawName).trim();
    const category = (match?.[1] || 'Otros').trim();
    const dedupeKey = `${talentName.toLocaleLowerCase('es')}::${category.toLocaleLowerCase('es')}`;
    if (seenTalents.has(dedupeKey)) return [];
    seenTalents.add(dedupeKey);
    return [{
      memberId: member.id,
      memberName: `${member.first_name} ${member.last_name}`.trim(),
      photoUrl: member.photo_url ?? null,
      talentName,
      category,
    }];
  });
}).sort((a, b) => a.talentName.localeCompare(b.talentName, 'es'));

export const useDashboardStats = (access: DashboardAccess, includeDetails = false) => {
  return useQuery<DashboardData>({
    queryKey: ['dashboard-stats', access, includeDetails],
    queryFn: async () => {
      const canUseSummaryRpc = dashboardSummaryRpcEnabled
        && !includeDetails
        && access.finances
        && access.members
        && access.inventory
        && access.petitions;

      let summaryRpcData: DashboardSummaryMetrics | null = null;

      if (canUseSummaryRpc) {
        const rpcResult = await supabase.rpc('get_dashboard_summary_metrics' as never);
        if (!rpcResult.error && rpcResult.data) {
          const row = Array.isArray(rpcResult.data) ? rpcResult.data[0] : rpcResult.data;
          summaryRpcData = row as DashboardSummaryMetrics;
        }
      }

      const [donationsRes, membersSummaryRes, membersDetailsRes, inventoryRes, petitionsRes] = await Promise.all([
        access.finances && !summaryRpcData ? supabase.from('donations').select('amount') : Promise.resolve(null),
        access.members && !includeDetails && !summaryRpcData
          ? supabase.from('members').select('id, is_leader')
          : Promise.resolve(null),
        access.members && includeDetails
          ? supabase.from('members').select(`
              id, first_name, last_name, photo_url, birth_date, conversion_date, baptism_date, is_leader,
              member_service_areas(catalog_roles(name)),
              member_talents(catalog_roles(name))
            `)
          : Promise.resolve(null),
        access.inventory && !summaryRpcData ? supabase.from('inventory_items').select('price, quantity') : Promise.resolve(null),
        access.petitions && !summaryRpcData ? supabase.from('petitions').select('status') : Promise.resolve(null),
      ]);

      for (const result of [donationsRes, membersSummaryRes, membersDetailsRes, inventoryRes, petitionsRes]) {
        if (result?.error) throw result.error;
      }

      const donations = donationsRes?.data || [];
      const totalAmount = summaryRpcData
        ? Number(summaryRpcData.total_donations_amount || 0)
        : donations.reduce((sum, d) => sum + (d.amount || 0), 0);
      const memberSummary = membersSummaryRes?.data || membersDetailsRes?.data || [];
      const members: DashboardMember[] = (membersDetailsRes?.data || []).map((member) => ({
        id: member.id,
        first_name: member.first_name,
        last_name: member.last_name,
        photo_url: member.photo_url,
        birth_date: member.birth_date,
        conversion_date: member.conversion_date,
        baptism_date: member.baptism_date,
        is_leader: member.is_leader,
        member_service_areas: member.member_service_areas?.map((entry) => ({
          catalog_roles: Array.isArray(entry.catalog_roles) ? entry.catalog_roles[0] ?? null : entry.catalog_roles,
        })),
        member_talents: member.member_talents?.map((entry) => ({
          catalog_roles: Array.isArray(entry.catalog_roles) ? entry.catalog_roles[0] ?? null : entry.catalog_roles,
        })),
      }));
      const leadersCount = summaryRpcData
        ? Number(summaryRpcData.leaders_count || 0)
        : memberSummary.filter(member => member.is_leader).length;
      const talentDirectory = includeDetails ? buildTalentDirectory(members) : [];

      const inventory = inventoryRes?.data || [];
      const inventoryCount = summaryRpcData
        ? Number(summaryRpcData.inventory_count || 0)
        : inventory.reduce((sum, item) => sum + (item.quantity || 0), 0);
      const inventoryValue = summaryRpcData
        ? Number(summaryRpcData.inventory_value || 0)
        : inventory.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);

      const petitions = petitionsRes?.data || [];
      const petitionsCount = summaryRpcData ? Number(summaryRpcData.petitions_count || 0) : petitions.length;
      const pendingPetitions = summaryRpcData
        ? Number(summaryRpcData.pending_petitions || 0)
        : petitions.filter(p => p.status === 'pendiente').length;

      const stats = {
        usersCount: 0,
        sermonsCount: 0,
        totalDonationsAmount: totalAmount,
        membersCount: summaryRpcData ? Number(summaryRpcData.members_count || 0) : memberSummary.length,
        leadersCount,
        inventoryCount,
        inventoryValue,
        petitionsCount,
        pendingPetitions,
        ministriesCount: 0,
      };

      const alerts = includeDetails ? getWeeklyAlerts(members) : [];
      const charts = includeDetails
        ? processChartData(members)
        : { ageData: [], areasData: [], talentsData: [], talentCategoriesData: [], baptismsData: [] };

      return {
        stats,
        alerts,
        talentDirectory,
        ...charts
      };
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};
