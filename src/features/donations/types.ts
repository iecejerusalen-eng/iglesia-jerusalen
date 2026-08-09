export interface DonationPageConfig {
  eyebrow: string;
  title: string;
  description: string;
  verse: string;
  verse_reference: string;
  beneficiary: string;
  account_type: string;
  whatsapp_label: string;
  preset_amounts: number[];
  transfer_enabled: boolean;
  volunteer_enabled: boolean;
  transparency_title: string;
  transparency_text: string;
  transfer_instructions: string[];
}

export interface DonationPublicSettings {
  phone: string;
  email: string;
  bank_name: string;
  bank_account: string;
  ruc: string;
  donation_page_config: DonationPageConfig;
}

export const DEFAULT_DONATION_PAGE_CONFIG: DonationPageConfig = {
  eyebrow: 'Mayordomía cristiana',
  title: 'Cada aporte impulsa una obra que transforma vidas',
  description: 'Tus diezmos, ofrendas y donaciones sostienen la proclamación del evangelio, el cuidado pastoral y el servicio a nuestra comunidad.',
  verse: 'Cada uno dé como propuso en su corazón: no con tristeza, ni por necesidad, porque Dios ama al dador alegre.',
  verse_reference: '2 Corintios 9:7',
  beneficiary: 'Iglesia del Evangelio Cuadrangular del Ecuador',
  account_type: 'Cuenta corriente',
  whatsapp_label: 'Secretaría de la iglesia',
  preset_amounts: [10, 25, 50, 100],
  transfer_enabled: true,
  volunteer_enabled: true,
  transparency_title: 'Administración responsable',
  transparency_text: 'Cada aporte se registra para su revisión y conciliación por el equipo administrativo autorizado.',
  transfer_instructions: [
    'Registra el aporte con tus datos.',
    'Realiza la transferencia a la cuenta indicada.',
    'Envía el comprobante por WhatsApp usando el número de referencia.',
  ],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

export function parseDonationPageConfig(value: unknown): DonationPageConfig {
  if (!isRecord(value)) return DEFAULT_DONATION_PAGE_CONFIG;
  const amounts = Array.isArray(value.preset_amounts)
    ? value.preset_amounts.filter((amount): amount is number => typeof amount === 'number' && Number.isFinite(amount) && amount > 0).slice(0, 6)
    : [];
  const instructions = Array.isArray(value.transfer_instructions)
    ? value.transfer_instructions.filter((instruction): instruction is string => typeof instruction === 'string' && Boolean(instruction.trim())).map((instruction) => instruction.trim()).slice(0, 6)
    : [];

  return {
    eyebrow: stringValue(value.eyebrow, DEFAULT_DONATION_PAGE_CONFIG.eyebrow),
    title: stringValue(value.title, DEFAULT_DONATION_PAGE_CONFIG.title),
    description: stringValue(value.description, DEFAULT_DONATION_PAGE_CONFIG.description),
    verse: stringValue(value.verse, DEFAULT_DONATION_PAGE_CONFIG.verse),
    verse_reference: stringValue(value.verse_reference, DEFAULT_DONATION_PAGE_CONFIG.verse_reference),
    beneficiary: stringValue(value.beneficiary, DEFAULT_DONATION_PAGE_CONFIG.beneficiary),
    account_type: stringValue(value.account_type, DEFAULT_DONATION_PAGE_CONFIG.account_type),
    whatsapp_label: stringValue(value.whatsapp_label, DEFAULT_DONATION_PAGE_CONFIG.whatsapp_label),
    preset_amounts: amounts.length > 0 ? amounts : DEFAULT_DONATION_PAGE_CONFIG.preset_amounts,
    transfer_enabled: typeof value.transfer_enabled === 'boolean' ? value.transfer_enabled : DEFAULT_DONATION_PAGE_CONFIG.transfer_enabled,
    volunteer_enabled: typeof value.volunteer_enabled === 'boolean' ? value.volunteer_enabled : DEFAULT_DONATION_PAGE_CONFIG.volunteer_enabled,
    transparency_title: stringValue(value.transparency_title, DEFAULT_DONATION_PAGE_CONFIG.transparency_title),
    transparency_text: stringValue(value.transparency_text, DEFAULT_DONATION_PAGE_CONFIG.transparency_text),
    transfer_instructions: instructions.length > 0 ? instructions : DEFAULT_DONATION_PAGE_CONFIG.transfer_instructions,
  };
}
