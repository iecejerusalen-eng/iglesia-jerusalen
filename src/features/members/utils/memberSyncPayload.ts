import type { MemberForm } from './schema';

export function createMemberSyncPayload(
  data: MemberForm,
  id: string,
  areas: string[],
  talents: string[],
  gifts: string[],
) {
  const { emails, additional_phones, ...member } = data;
  return {
    ...member,
    id,
    is_leader: data.is_leader || false,
    emails: emails ?? [],
    additional_phones: (additional_phones ?? []).map((phone) => ({
      phone: phone.phone.trim(),
      phone_country_code: phone.phone_country_code || '+593',
    })),
    service_areas: areas.map((roleId) => ({ catalog_roles: { id: roleId } })),
    talents: talents.map((roleId) => ({ catalog_roles: { id: roleId } })),
    spiritual_gifts: gifts.map((roleId) => ({ catalog_roles: { id: roleId } })),
  };
}
