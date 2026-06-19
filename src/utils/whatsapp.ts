export interface CountryDialInfo {
  code: string;      // ISO 2-letter code
  name: string;      // Country name in Spanish
  dialCode: string;  // International prefix (e.g. +593)
  flag: string;      // Flag emoji
}

// Comprehensive list of country dialing codes (~150 countries)
export const COUNTRY_CODES: CountryDialInfo[] = [
  // Latin America & Caribbean (Primary focus)
  { code: 'EC', name: 'Ecuador', dialCode: '+593', flag: '🇪🇨' },
  { code: 'CO', name: 'Colombia', dialCode: '+57', flag: '🇨🇴' },
  { code: 'PE', name: 'Perú', dialCode: '+51', flag: '🇵🇪' },
  { code: 'VE', name: 'Venezuela', dialCode: '+58', flag: '🇻🇪' },
  { code: 'MX', name: 'México', dialCode: '+52', flag: '🇲🇽' },
  { code: 'AR', name: 'Argentina', dialCode: '+54', flag: '🇦🇷' },
  { code: 'CL', name: 'Chile', dialCode: '+56', flag: '🇨🇱' },
  { code: 'BO', name: 'Bolivia', dialCode: '+591', flag: '🇧🇴' },
  { code: 'BR', name: 'Brasil', dialCode: '+55', flag: '🇧🇷' },
  { code: 'CR', name: 'Costa Rica', dialCode: '+506', flag: '🇨🇷' },
  { code: 'CU', name: 'Cuba', dialCode: '+53', flag: '🇨🇺' },
  { code: 'DO', name: 'República Dominicana', dialCode: '+1809', flag: '🇩🇴' },
  { code: 'SV', name: 'El Salvador', dialCode: '+503', flag: '🇸🇻' },
  { code: 'GT', name: 'Guatemala', dialCode: '+502', flag: '🇬🇹' },
  { code: 'HN', name: 'Honduras', dialCode: '+504', flag: '🇭🇳' },
  { code: 'NI', name: 'Nicaragua', dialCode: '+505', flag: '🇳🇮' },
  { code: 'PA', name: 'Panamá', dialCode: '+507', flag: '🇵🇦' },
  { code: 'PY', name: 'Paraguay', dialCode: '+595', flag: '🇵🇾' },
  { code: 'UY', name: 'Uruguay', dialCode: '+598', flag: '🇺🇾' },
  { code: 'PR', name: 'Puerto Rico', dialCode: '+1', flag: '🇵🇷' },

  // North America
  { code: 'US', name: 'Estados Unidos', dialCode: '+1', flag: '🇺🇸' },
  { code: 'CA', name: 'Canadá', dialCode: '+1', flag: '🇨🇦' },

  // Europe
  { code: 'ES', name: 'España', dialCode: '+34', flag: '🇪🇸' },
  { code: 'IT', name: 'Italia', dialCode: '+39', flag: '🇮🇹' },
  { code: 'FR', name: 'Francia', dialCode: '+33', flag: '🇫🇷' },
  { code: 'DE', name: 'Alemania', dialCode: '+49', flag: '🇩🇪' },
  { code: 'GB', name: 'Reino Unido', dialCode: '+44', flag: '🇬🇧' },
  { code: 'PT', name: 'Portugal', dialCode: '+351', flag: '🇵🇹' },
  { code: 'NL', name: 'Países Bajos', dialCode: '+31', flag: '🇳🇱' },
  { code: 'CH', name: 'Suiza', dialCode: '+41', flag: '🇨🇭' },
  { code: 'BE', name: 'Bélgica', dialCode: '+32', flag: '🇧🇪' },
  { code: 'SE', name: 'Suecia', dialCode: '+46', flag: '🇸🇪' },
  { code: 'NO', name: 'Noruega', dialCode: '+47', flag: '🇳🇴' },
  { code: 'FI', name: 'Finlandia', dialCode: '+358', flag: '🇫🇮' },
  { code: 'DK', name: 'Dinamarca', dialCode: '+45', flag: '🇩🇰' },
  { code: 'AT', name: 'Austria', dialCode: '+43', flag: '🇦🇹' },
  { code: 'IE', name: 'Irlanda', dialCode: '+353', flag: '🇮🇪' },
  { code: 'GR', name: 'Grecia', dialCode: '+30', flag: '🇬🇷' },
  { code: 'RU', name: 'Rusia', dialCode: '+7', flag: '🇷🇺' },
  { code: 'PL', name: 'Polonia', dialCode: '+48', flag: '🇵🇱' },
  { code: 'UA', name: 'Ucrania', dialCode: '+380', flag: '🇺🇦' },
  { code: 'RO', name: 'Rumania', dialCode: '+40', flag: '🇷🇴' },
  { code: 'CZ', name: 'Chequia', dialCode: '+420', flag: '🇨🇿' },
  { code: 'HU', name: 'Hungría', dialCode: '+36', flag: '🇭🇺' },
  { code: 'BG', name: 'Bulgaria', dialCode: '+359', flag: '🇧🇬' },
  { code: 'HR', name: 'Croacia', dialCode: '+385', flag: '🇭🇷' },
  { code: 'SK', name: 'Eslovaquia', dialCode: '+421', flag: '🇸🇰' },
  { code: 'LT', name: 'Lituania', dialCode: '+370', flag: '🇱🇹' },
  { code: 'LV', name: 'Letonia', dialCode: '+371', flag: '🇱🇻' },
  { code: 'EE', name: 'Estonia', dialCode: '+372', flag: '🇪🇪' },
  { code: 'SI', name: 'Eslovenia', dialCode: '+386', flag: '🇸🇮' },
  { code: 'LU', name: 'Luxemburgo', dialCode: '+352', flag: '🇱🇺' },
  { code: 'MT', name: 'Malta', dialCode: '+356', flag: '🇲🇹' },
  { code: 'CY', name: 'Chipre', dialCode: '+357', flag: '🇨🇾' },
  { code: 'IS', name: 'Islandia', dialCode: '+354', flag: '🇮🇸' },
  { code: 'TR', name: 'Turquía', dialCode: '+90', flag: '🇹🇷' },

  // Asia
  { code: 'CN', name: 'China', dialCode: '+86', flag: '🇨🇳' },
  { code: 'JP', name: 'Japón', dialCode: '+81', flag: '🇯🇵' },
  { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳' },
  { code: 'KR', name: 'Corea del Sur', dialCode: '+82', flag: '🇰🇷' },
  { code: 'SG', name: 'Singapur', dialCode: '+65', flag: '🇸🇬' },
  { code: 'HK', name: 'Hong Kong', dialCode: '+852', flag: '🇭🇰' },
  { code: 'TW', name: 'Taiwán', dialCode: '+886', flag: '🇹🇼' },
  { code: 'IL', name: 'Israel', dialCode: '+972', flag: '🇮🇱' },
  { code: 'SA', name: 'Arabia Saudita', dialCode: '+966', flag: '🇸🇦' },
  { code: 'AE', name: 'Emiratos Árabes Unidos', dialCode: '+971', flag: '🇦🇪' },
  { code: 'QA', name: 'Catar', dialCode: '+974', flag: '🇶🇦' },
  { code: 'KW', name: 'Kuwait', dialCode: '+965', flag: '🇰🇼' },
  { code: 'OM', name: 'Omán', dialCode: '+968', flag: '🇴🇲' },
  { code: 'ID', name: 'Indonesia', dialCode: '+62', flag: '🇮🇩' },
  { code: 'MY', name: 'Malasia', dialCode: '+60', flag: '🇲🇾' },
  { code: 'PH', name: 'Filipinas', dialCode: '+63', flag: '🇵🇭' },
  { code: 'TH', name: 'Tailandia', dialCode: '+66', flag: '🇹🇭' },
  { code: 'VN', name: 'Vietnam', dialCode: '+84', flag: '🇻🇳' },
  { code: 'PK', name: 'Pakistán', dialCode: '+92', flag: '🇵🇰' },
  { code: 'BD', name: 'Bangladés', dialCode: '+880', flag: '🇧🇩' },
  { code: 'LK', name: 'Sri Lanka', dialCode: '+94', flag: '🇱🇰' },
  { code: 'NP', name: 'Nepal', dialCode: '+977', flag: '🇳🇵' },
  { code: 'KZ', name: 'Kazajistán', dialCode: '+7', flag: '🇰🇿' },
  { code: 'UZ', name: 'Uzbekistán', dialCode: '+998', flag: '🇺🇿' },
  { code: 'JO', name: 'Jordania', dialCode: '+962', flag: '🇯🇴' },
  { code: 'LB', name: 'Líbano', dialCode: '+961', flag: '🇱🇧' },

  // Africa
  { code: 'ZA', name: 'Sudáfrica', dialCode: '+27', flag: '🇿🇦' },
  { code: 'EG', name: 'Egipto', dialCode: '+20', flag: '🇪🇬' },
  { code: 'NG', name: 'Nigeria', dialCode: '+234', flag: '🇳🇬' },
  { code: 'KE', name: 'Kenia', dialCode: '+254', flag: '🇰🇪' },
  { code: 'MA', name: 'Marruecos', dialCode: '+212', flag: '🇲🇦' },
  { code: 'DZ', name: 'Argelia', dialCode: '+213', flag: '🇩🇿' },
  { code: 'TN', name: 'Túnez', dialCode: '+216', flag: '🇹🇳' },
  { code: 'GH', name: 'Ghana', dialCode: '+233', flag: '🇬🇭' },
  { code: 'CI', name: 'Costa de Marfil', dialCode: '+225', flag: '🇨🇮' },
  { code: 'SN', name: 'Senegal', dialCode: '+221', flag: '🇸🇳' },
  { code: 'CM', name: 'Camerún', dialCode: '+237', flag: '🇨🇲' },
  { code: 'UG', name: 'Uganda', dialCode: '+256', flag: '🇺🇬' },
  { code: 'TZ', name: 'Tanzania', dialCode: '+255', flag: '🇹🇿' },
  { code: 'ET', name: 'Etiopía', dialCode: '+251', flag: '🇪🇹' },
  { code: 'AO', name: 'Angola', dialCode: '+244', flag: '🇦🇴' },
  { code: 'MZ', name: 'Mozambique', dialCode: '+258', flag: '🇲🇿' },
  { code: 'ZW', name: 'Zimbabue', dialCode: '+263', flag: '🇿🇼' },

  // Oceania
  { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺' },
  { code: 'NZ', name: 'Nueva Zelanda', dialCode: '+64', flag: '🇳🇿' },
  { code: 'FJ', name: 'Fiyi', dialCode: '+679', flag: '🇫🇯' },
  { code: 'PG', name: 'Papúa Nueva Guinea', dialCode: '+675', flag: '🇵🇬' },

  // Other Common Countries
  { code: 'JM', name: 'Jamaica', dialCode: '+1876', flag: '🇯🇲' },
  { code: 'BS', name: 'Bahamas', dialCode: '+1242', flag: '🇧🇸' },
  { code: 'TT', name: 'Trinidad y Tobago', dialCode: '+1868', flag: '🇹🇹' },
  { code: 'HT', name: 'Haití', dialCode: '+509', flag: '🇭🇹' },
  { code: 'BZ', name: 'Belice', dialCode: '+501', flag: '🇧🇿' },
  { code: 'GY', name: 'Guyana', dialCode: '+592', flag: '🇬🇾' },
  { code: 'SR', name: 'Surinam', dialCode: '+597', flag: '🇸🇷' }
];

// Helper to format WhatsApp API links consistently and safely
export function formatWhatsAppLink(
  phone: string | null | undefined,
  phoneCountryCode: string | null | undefined,
  messageText?: string
): string {
  if (!phone) return '';

  // Clean the phone number of non-digits
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Clean the country code of non-digits (default to Ecuador +593 if missing)
  const cleanCode = (phoneCountryCode || '+593').replace(/\D/g, '');

  let formattedNumber = cleanPhone;

  // Rule: If phone number starts with '0', strip it before prefixing country code
  // This is mandatory for Ecuador mobile numbers (e.g. 0991131248 -> 991131248)
  if (cleanPhone.startsWith('0')) {
    formattedNumber = cleanPhone.substring(1);
  }

  // Prepend country code if it isn't already prepended
  const finalPhone = cleanPhone.startsWith(cleanCode) ? cleanPhone : `${cleanCode}${formattedNumber}`;

  const queryParams = messageText ? `?phone=${finalPhone}&text=${encodeURIComponent(messageText)}` : `?phone=${finalPhone}`;
  return `https://api.whatsapp.com/send${queryParams}`;
}
