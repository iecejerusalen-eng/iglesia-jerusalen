import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../config/supabase';
import type { DashboardAccess, DashboardMember, DashboardData, WeeklyAlert } from '../types';
import { MONTHS, BIBLE_VERSES } from '../constants';

const getWeeklyAlerts = (membersList: DashboardMember[]): WeeklyAlert[] => {
  const today = new Date();
  const list: WeeklyAlert[] = [];

  membersList.forEach(m => {
    if (m.birth_date) {
      const birth = new Date(m.birth_date);
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
      const conv = new Date(m.conversion_date);
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

const processChartData = (membersList: DashboardMember[]) => {
  const today = new Date();
  const ages: number[] = [];
  const areaCounts: { [key: string]: number } = {};
  const talentCounts: { [key: string]: number } = {};
  const talentCategoryCounts: { [key: string]: number } = {};
  const baptismYearCounts: { [key: string]: number } = {};

  membersList.forEach(m => {
    // 1. Age calculation
    if (m.birth_date) {
      const birth = new Date(m.birth_date);
      let age = today.getFullYear() - birth.getFullYear();
      const birthdayOccurred = today.getMonth() > birth.getMonth()
        || (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());
      if (!birthdayOccurred) age -= 1;
      ages.push(age);
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
      const year = new Date(m.baptism_date).getFullYear().toString();
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
  const areasData = Object.entries(areaCounts).map(([name, value]) => ({ name, miembros: value }));
  const talentsData = Object.entries(talentCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, value]) => ({ name, value }));
  const talentCategoriesData = Object.entries(talentCategoryCounts).map(([name, value]) => ({ name, value }));
  
  const baptismsData = Object.entries(baptismYearCounts)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([year, count]) => ({ year, cantidad: count }));

  return { ageData, areasData, talentsData, talentCategoriesData, baptismsData };
};

export const useDashboardStats = (access: DashboardAccess) => {
  return useQuery<DashboardData>({
    queryKey: ['dashboard-stats', access],
    queryFn: async () => {
      const [donationsRes, membersRes, inventoryRes, petitionsRes] = await Promise.all([
        access.finances ? supabase.from('donations').select('amount') : Promise.resolve(null),
        access.members
          ? supabase.from('members').select(`
              id, first_name, last_name, birth_date, conversion_date, baptism_date, is_leader,
              member_service_areas(catalog_roles(name)),
              member_talents(catalog_roles(name))
            `)
          : Promise.resolve(null),
        access.inventory ? supabase.from('inventory_items').select('price, quantity') : Promise.resolve(null),
        access.petitions ? supabase.from('petitions').select('status') : Promise.resolve(null),
      ]);

      for (const result of [donationsRes, membersRes, inventoryRes, petitionsRes]) {
        if (result?.error) throw result.error;
      }

      const donations = donationsRes?.data || [];
      const totalAmount = donations.reduce((sum, d) => sum + (d.amount || 0), 0);
      const members: DashboardMember[] = (membersRes?.data || []).map((member) => ({
        id: member.id,
        first_name: member.first_name,
        last_name: member.last_name,
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
      const leadersCount = members.filter(m => m.is_leader).length;

      const inventory = inventoryRes?.data || [];
      const inventoryCount = inventory.reduce((sum, item) => sum + (item.quantity || 0), 0);
      const inventoryValue = inventory.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);

      const petitions = petitionsRes?.data || [];
      const petitionsCount = petitions.length;
      const pendingPetitions = petitions.filter(p => p.status === 'pendiente').length;

      const stats = {
        usersCount: 0,
        sermonsCount: 0,
        totalDonationsAmount: totalAmount,
        membersCount: members.length,
        leadersCount,
        inventoryCount,
        inventoryValue,
        petitionsCount,
        pendingPetitions,
        ministriesCount: 0,
      };

      const alerts = getWeeklyAlerts(members);
      const charts = processChartData(members);

      return {
        stats,
        alerts,
        ...charts
      };
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};
