/**
 * Currency configuration for multi-currency support
 * Based on Stripe's supported currencies
 */

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  zeroDecimal: boolean;
}

export interface CurrencyGroup {
  name: string;
  currencies: Currency[];
}

// Zero-decimal currencies (no cents/pence - amounts are in whole units)
export const ZERO_DECIMAL_CURRENCIES = [
  "BIF", "CLP", "DJF", "GNF", "JPY", "KMF", "KRW", "MGA",
  "PYG", "RWF", "UGX", "VND", "VUV", "XAF", "XOF", "XPF"
];

// All supported currencies grouped by region
export const CURRENCY_GROUPS: CurrencyGroup[] = [
  {
    name: "Americas",
    currencies: [
      { code: "USD", name: "US Dollar", symbol: "$", zeroDecimal: false },
      { code: "CAD", name: "Canadian Dollar", symbol: "CA$", zeroDecimal: false },
      { code: "MXN", name: "Mexican Peso", symbol: "MX$", zeroDecimal: false },
      { code: "BRL", name: "Brazilian Real", symbol: "R$", zeroDecimal: false },
      { code: "ARS", name: "Argentine Peso", symbol: "ARS$", zeroDecimal: false },
      { code: "CLP", name: "Chilean Peso", symbol: "CLP$", zeroDecimal: true },
      { code: "COP", name: "Colombian Peso", symbol: "COL$", zeroDecimal: false },
      { code: "PEN", name: "Peruvian Sol", symbol: "S/", zeroDecimal: false },
      { code: "UYU", name: "Uruguayan Peso", symbol: "$U", zeroDecimal: false },
    ],
  },
  {
    name: "Europe",
    currencies: [
      { code: "EUR", name: "Euro", symbol: "€", zeroDecimal: false },
      { code: "GBP", name: "British Pound", symbol: "£", zeroDecimal: false },
      { code: "CHF", name: "Swiss Franc", symbol: "CHF", zeroDecimal: false },
      { code: "SEK", name: "Swedish Krona", symbol: "kr", zeroDecimal: false },
      { code: "NOK", name: "Norwegian Krone", symbol: "kr", zeroDecimal: false },
      { code: "DKK", name: "Danish Krone", symbol: "kr", zeroDecimal: false },
      { code: "PLN", name: "Polish Zloty", symbol: "zł", zeroDecimal: false },
      { code: "CZK", name: "Czech Koruna", symbol: "Kč", zeroDecimal: false },
      { code: "HUF", name: "Hungarian Forint", symbol: "Ft", zeroDecimal: false },
      { code: "RON", name: "Romanian Leu", symbol: "lei", zeroDecimal: false },
      { code: "BGN", name: "Bulgarian Lev", symbol: "лв", zeroDecimal: false },
      { code: "HRK", name: "Croatian Kuna", symbol: "kn", zeroDecimal: false },
      { code: "ISK", name: "Icelandic Krona", symbol: "kr", zeroDecimal: false },
      { code: "RUB", name: "Russian Ruble", symbol: "₽", zeroDecimal: false },
      { code: "TRY", name: "Turkish Lira", symbol: "₺", zeroDecimal: false },
      { code: "UAH", name: "Ukrainian Hryvnia", symbol: "₴", zeroDecimal: false },
    ],
  },
  {
    name: "Asia Pacific",
    currencies: [
      { code: "JPY", name: "Japanese Yen", symbol: "¥", zeroDecimal: true },
      { code: "AUD", name: "Australian Dollar", symbol: "A$", zeroDecimal: false },
      { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$", zeroDecimal: false },
      { code: "SGD", name: "Singapore Dollar", symbol: "S$", zeroDecimal: false },
      { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$", zeroDecimal: false },
      { code: "TWD", name: "Taiwan Dollar", symbol: "NT$", zeroDecimal: false },
      { code: "KRW", name: "South Korean Won", symbol: "₩", zeroDecimal: true },
      { code: "CNY", name: "Chinese Yuan", symbol: "¥", zeroDecimal: false },
      { code: "INR", name: "Indian Rupee", symbol: "₹", zeroDecimal: false },
      { code: "MYR", name: "Malaysian Ringgit", symbol: "RM", zeroDecimal: false },
      { code: "PHP", name: "Philippine Peso", symbol: "₱", zeroDecimal: false },
      { code: "THB", name: "Thai Baht", symbol: "฿", zeroDecimal: false },
      { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp", zeroDecimal: false },
      { code: "VND", name: "Vietnamese Dong", symbol: "₫", zeroDecimal: true },
      { code: "PKR", name: "Pakistani Rupee", symbol: "₨", zeroDecimal: false },
      { code: "BDT", name: "Bangladeshi Taka", symbol: "৳", zeroDecimal: false },
      { code: "LKR", name: "Sri Lankan Rupee", symbol: "Rs", zeroDecimal: false },
    ],
  },
  {
    name: "Middle East & Africa",
    currencies: [
      { code: "AED", name: "UAE Dirham", symbol: "د.إ", zeroDecimal: false },
      { code: "SAR", name: "Saudi Riyal", symbol: "﷼", zeroDecimal: false },
      { code: "QAR", name: "Qatari Riyal", symbol: "ر.ق", zeroDecimal: false },
      { code: "KWD", name: "Kuwaiti Dinar", symbol: "د.ك", zeroDecimal: false },
      { code: "BHD", name: "Bahraini Dinar", symbol: "ب.د", zeroDecimal: false },
      { code: "OMR", name: "Omani Rial", symbol: "ر.ع.", zeroDecimal: false },
      { code: "ILS", name: "Israeli Shekel", symbol: "₪", zeroDecimal: false },
      { code: "EGP", name: "Egyptian Pound", symbol: "E£", zeroDecimal: false },
      { code: "ZAR", name: "South African Rand", symbol: "R", zeroDecimal: false },
      { code: "NGN", name: "Nigerian Naira", symbol: "₦", zeroDecimal: false },
      { code: "KES", name: "Kenyan Shilling", symbol: "KSh", zeroDecimal: false },
      { code: "GHS", name: "Ghanaian Cedi", symbol: "₵", zeroDecimal: false },
      { code: "MAD", name: "Moroccan Dirham", symbol: "د.م.", zeroDecimal: false },
      { code: "TND", name: "Tunisian Dinar", symbol: "د.ت", zeroDecimal: false },
    ],
  },
];

// Flat list of all currencies for easy lookup
export const ALL_CURRENCIES: Currency[] = CURRENCY_GROUPS.flatMap(g => g.currencies);

// Get currency by code
export function getCurrency(code: string): Currency | undefined {
  return ALL_CURRENCIES.find(c => c.code.toUpperCase() === code.toUpperCase());
}

// Check if currency is zero-decimal
export function isZeroDecimal(code: string): boolean {
  return ZERO_DECIMAL_CURRENCIES.includes(code.toUpperCase());
}

// Get the divisor for converting from smallest unit to display value
export function getCurrencyDivisor(code: string): number {
  return isZeroDecimal(code) ? 1 : 100;
}

// Format price with proper currency handling
export function formatPrice(amountInSmallestUnit: number, currencyCode?: string): string {
  const code = currencyCode || process.env.NEXT_PUBLIC_STORE_CURRENCY || "USD";
  const divisor = getCurrencyDivisor(code);

  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: code,
    // For zero-decimal currencies, don't show decimal places
    minimumFractionDigits: isZeroDecimal(code) ? 0 : 2,
    maximumFractionDigits: isZeroDecimal(code) ? 0 : 2,
  }).format(amountInSmallestUnit / divisor);
}

// Convert display amount to smallest unit (cents/yen/etc)
export function toSmallestUnit(displayAmount: number, currencyCode: string): number {
  const multiplier = isZeroDecimal(currencyCode) ? 1 : 100;
  return Math.round(displayAmount * multiplier);
}

// Convert smallest unit to display amount
export function fromSmallestUnit(smallestUnit: number, currencyCode: string): number {
  const divisor = getCurrencyDivisor(currencyCode);
  return smallestUnit / divisor;
}

// Get store currency from environment
export function getStoreCurrency(): string {
  return process.env.NEXT_PUBLIC_STORE_CURRENCY || "USD";
}
