export interface Country {
  iso:  string;
  name: string;
  flag: string;
}

export const COUNTRIES: Country[] = [
  { iso: 'US', name: 'United States',  flag: '🇺🇸' },
  { iso: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { iso: 'DE', name: 'Germany',        flag: '🇩🇪' },
  { iso: 'FR', name: 'France',         flag: '🇫🇷' },
  { iso: 'ES', name: 'Spain',          flag: '🇪🇸' },
  { iso: 'IT', name: 'Italy',          flag: '🇮🇹' },
  { iso: 'NL', name: 'Netherlands',    flag: '🇳🇱' },
  { iso: 'CH', name: 'Switzerland',    flag: '🇨🇭' },
  { iso: 'SE', name: 'Sweden',         flag: '🇸🇪' },
  { iso: 'NO', name: 'Norway',         flag: '🇳🇴' },
  { iso: 'DK', name: 'Denmark',        flag: '🇩🇰' },
  { iso: 'FI', name: 'Finland',        flag: '🇫🇮' },
  { iso: 'BE', name: 'Belgium',        flag: '🇧🇪' },
  { iso: 'PT', name: 'Portugal',       flag: '🇵🇹' },
  { iso: 'AU', name: 'Australia',      flag: '🇦🇺' },
  { iso: 'CA', name: 'Canada',         flag: '🇨🇦' },
  { iso: 'JP', name: 'Japan',          flag: '🇯🇵' },
  { iso: 'CN', name: 'China',          flag: '🇨🇳' },
  { iso: 'HK', name: 'Hong Kong',      flag: '🇭🇰' },
  { iso: 'SG', name: 'Singapore',      flag: '🇸🇬' },
  { iso: 'KR', name: 'South Korea',    flag: '🇰🇷' },
  { iso: 'BR', name: 'Brazil',         flag: '🇧🇷' },
  { iso: 'MX', name: 'Mexico',         flag: '🇲🇽' },
];