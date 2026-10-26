import { describe, expect, it } from 'vitest';
import { createMemberSyncPayload } from './memberSyncPayload';
import type { MemberForm } from './schema';

const member = {
  first_name: 'Ana',
  last_name: 'Pérez',
  photo_url: '',
  birth_date: '',
  conversion_date: '',
  baptism_date: '',
  phone: '0990000000',
  phone_country_code: '+593',
  dni: '',
  address: '',
  maps_link: '',
  is_leader: false,
  leadership_role: '',
  tithes_sum: 0,
  emails: [{ email: 'ana@example.com' }],
  additional_phones: [{ phone: ' 0981111111 ', phone_country_code: '+593' }],
  has_disability: true,
  disability_types: ['visual'],
} as MemberForm;

describe('createMemberSyncPayload', () => {
  it('encola perfil y relaciones del miembro en el formato que procesa la sincronización agregada', () => {
    expect(createMemberSyncPayload(member, 'member-1', ['area-1'], ['talent-1'], ['gift-1'])).toMatchObject({
      id: 'member-1',
      first_name: 'Ana',
      emails: [{ email: 'ana@example.com' }],
      additional_phones: [{ phone: '0981111111', phone_country_code: '+593' }],
      service_areas: [{ catalog_roles: { id: 'area-1' } }],
      talents: [{ catalog_roles: { id: 'talent-1' } }],
      spiritual_gifts: [{ catalog_roles: { id: 'gift-1' } }],
      has_disability: true,
      disability_types: ['visual'],
    });
  });

  it('incluye relaciones vacías para que editar y quitar datos anteriores también se sincronice', () => {
    const payload = createMemberSyncPayload({ ...member, emails: [], additional_phones: [] } as MemberForm, 'member-1', [], [], []);
    expect(payload.emails).toEqual([]);
    expect(payload.additional_phones).toEqual([]);
    expect(payload.service_areas).toEqual([]);
    expect(payload.talents).toEqual([]);
    expect(payload.spiritual_gifts).toEqual([]);
  });
});
