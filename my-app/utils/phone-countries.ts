export type PhoneCountry = {
  iso2: string;
  name: string;
  dialCode: string;
  flag: string;
};

export const PHONE_COUNTRIES: PhoneCountry[] = [
  { iso2: 'TR', name: 'Turkiye', dialCode: '+90', flag: '🇹🇷' },
  { iso2: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸' },
  { iso2: 'AL', name: 'Albania', dialCode: '+355', flag: '🇦🇱' },
  { iso2: 'AD', name: 'Andorra', dialCode: '+376', flag: '🇦🇩' },
  { iso2: 'AT', name: 'Austria', dialCode: '+43', flag: '🇦🇹' },
  { iso2: 'BY', name: 'Belarus', dialCode: '+375', flag: '🇧🇾' },
  { iso2: 'BE', name: 'Belgium', dialCode: '+32', flag: '🇧🇪' },
  { iso2: 'BA', name: 'Bosnia and Herzegovina', dialCode: '+387', flag: '🇧🇦' },
  { iso2: 'BG', name: 'Bulgaria', dialCode: '+359', flag: '🇧🇬' },
  { iso2: 'HR', name: 'Croatia', dialCode: '+385', flag: '🇭🇷' },
  { iso2: 'CY', name: 'Cyprus', dialCode: '+357', flag: '🇨🇾' },
  { iso2: 'CZ', name: 'Czechia', dialCode: '+420', flag: '🇨🇿' },
  { iso2: 'DK', name: 'Denmark', dialCode: '+45', flag: '🇩🇰' },
  { iso2: 'EE', name: 'Estonia', dialCode: '+372', flag: '🇪🇪' },
  { iso2: 'FI', name: 'Finland', dialCode: '+358', flag: '🇫🇮' },
  { iso2: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷' },
  { iso2: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪' },
  { iso2: 'GR', name: 'Greece', dialCode: '+30', flag: '🇬🇷' },
  { iso2: 'HU', name: 'Hungary', dialCode: '+36', flag: '🇭🇺' },
  { iso2: 'IS', name: 'Iceland', dialCode: '+354', flag: '🇮🇸' },
  { iso2: 'IE', name: 'Ireland', dialCode: '+353', flag: '🇮🇪' },
  { iso2: 'IT', name: 'Italy', dialCode: '+39', flag: '🇮🇹' },
  { iso2: 'XK', name: 'Kosovo', dialCode: '+383', flag: '🇽🇰' },
  { iso2: 'LV', name: 'Latvia', dialCode: '+371', flag: '🇱🇻' },
  { iso2: 'LI', name: 'Liechtenstein', dialCode: '+423', flag: '🇱🇮' },
  { iso2: 'LT', name: 'Lithuania', dialCode: '+370', flag: '🇱🇹' },
  { iso2: 'LU', name: 'Luxembourg', dialCode: '+352', flag: '🇱🇺' },
  { iso2: 'MT', name: 'Malta', dialCode: '+356', flag: '🇲🇹' },
  { iso2: 'MD', name: 'Moldova', dialCode: '+373', flag: '🇲🇩' },
  { iso2: 'MC', name: 'Monaco', dialCode: '+377', flag: '🇲🇨' },
  { iso2: 'ME', name: 'Montenegro', dialCode: '+382', flag: '🇲🇪' },
  { iso2: 'NL', name: 'Netherlands', dialCode: '+31', flag: '🇳🇱' },
  { iso2: 'MK', name: 'North Macedonia', dialCode: '+389', flag: '🇲🇰' },
  { iso2: 'NO', name: 'Norway', dialCode: '+47', flag: '🇳🇴' },
  { iso2: 'PL', name: 'Poland', dialCode: '+48', flag: '🇵🇱' },
  { iso2: 'PT', name: 'Portugal', dialCode: '+351', flag: '🇵🇹' },
  { iso2: 'RO', name: 'Romania', dialCode: '+40', flag: '🇷🇴' },
  { iso2: 'RU', name: 'Russia', dialCode: '+7', flag: '🇷🇺' },
  { iso2: 'SM', name: 'San Marino', dialCode: '+378', flag: '🇸🇲' },
  { iso2: 'RS', name: 'Serbia', dialCode: '+381', flag: '🇷🇸' },
  { iso2: 'SK', name: 'Slovakia', dialCode: '+421', flag: '🇸🇰' },
  { iso2: 'SI', name: 'Slovenia', dialCode: '+386', flag: '🇸🇮' },
  { iso2: 'ES', name: 'Spain', dialCode: '+34', flag: '🇪🇸' },
  { iso2: 'SE', name: 'Sweden', dialCode: '+46', flag: '🇸🇪' },
  { iso2: 'CH', name: 'Switzerland', dialCode: '+41', flag: '🇨🇭' },
  { iso2: 'UA', name: 'Ukraine', dialCode: '+380', flag: '🇺🇦' },
  { iso2: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧' },
  { iso2: 'VA', name: 'Vatican City', dialCode: '+39', flag: '🇻🇦' },
];

export const DEFAULT_PHONE_COUNTRY_ISO2 = 'TR';
