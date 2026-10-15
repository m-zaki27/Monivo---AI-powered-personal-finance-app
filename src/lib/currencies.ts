export interface Currency {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  /** Searchable country / region names */
  region: string;
  /** 0 hides the keypad's decimal key (e.g. yen). */
  decimals: 0 | 2;
}

const currencies: Currency[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸', region: 'United States', decimals: 2 },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', region: 'Eurozone Germany France Spain Italy', decimals: 2 },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧', region: 'United Kingdom', decimals: 2 },
  { code: 'CAD', name: 'Canadian Dollar', symbol: '$', flag: '🇨🇦', region: 'Canada', decimals: 2 },
  { code: 'AUD', name: 'Australian Dollar', symbol: '$', flag: '🇦🇺', region: 'Australia', decimals: 2 },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: '$', flag: '🇳🇿', region: 'New Zealand', decimals: 2 },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr', flag: '🇨🇭', region: 'Switzerland', decimals: 2 },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵', region: 'Japan', decimals: 0 },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳', region: 'China', decimals: 2 },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: '$', flag: '🇭🇰', region: 'Hong Kong', decimals: 2 },
  { code: 'SGD', name: 'Singapore Dollar', symbol: '$', flag: '🇸🇬', region: 'Singapore', decimals: 2 },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', flag: '🇰🇷', region: 'South Korea', decimals: 0 },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳', region: 'India', decimals: 2 },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: 'Rs', flag: '🇵🇰', region: 'Pakistan', decimals: 2 },
  { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳', flag: '🇧🇩', region: 'Bangladesh', decimals: 2 },
  { code: 'AED', name: 'UAE Dirham', symbol: 'AED', flag: '🇦🇪', region: 'United Arab Emirates Dubai', decimals: 2 },
  { code: 'SAR', name: 'Saudi Riyal', symbol: 'SAR', flag: '🇸🇦', region: 'Saudi Arabia', decimals: 2 },
  { code: 'QAR', name: 'Qatari Riyal', symbol: 'QAR', flag: '🇶🇦', region: 'Qatar', decimals: 2 },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', flag: '🇹🇷', region: 'Turkey Türkiye', decimals: 2 },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', flag: '🇸🇪', region: 'Sweden', decimals: 2 },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', flag: '🇳🇴', region: 'Norway', decimals: 2 },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr', flag: '🇩🇰', region: 'Denmark', decimals: 2 },
  { code: 'PLN', name: 'Polish Złoty', symbol: 'zł', flag: '🇵🇱', region: 'Poland', decimals: 2 },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$', flag: '🇲🇽', region: 'Mexico', decimals: 2 },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', flag: '🇧🇷', region: 'Brazil', decimals: 2 },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', flag: '🇿🇦', region: 'South Africa', decimals: 2 },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', flag: '🇳🇬', region: 'Nigeria', decimals: 2 },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', flag: '🇰🇪', region: 'Kenya', decimals: 2 },
  { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£', flag: '🇪🇬', region: 'Egypt', decimals: 2 },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', flag: '🇲🇾', region: 'Malaysia', decimals: 2 },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', flag: '🇮🇩', region: 'Indonesia', decimals: 2 },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱', flag: '🇵🇭', region: 'Philippines', decimals: 2 },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', flag: '🇹🇭', region: 'Thailand', decimals: 2 },
];

export const findCurrency = (code: string | undefined) => currencies.find((c) => c.code === code) ?? currencies[0]!;

export function searchCurrencies(query: string): Currency[] {
  const q = query.trim().toLowerCase();
  if (!q) return currencies;
  return currencies.filter((c) => `${c.code} ${c.name} ${c.region}`.toLowerCase().includes(q));
}
