// Country normalization utilities for geo-targeting
// Handles both country names and ISO 2-letter codes

// Standard country name to ISO 2-letter code mapping
// Based on YouTube API country codes and common geo-targeting standards
export const COUNTRY_NAME_TO_CODE: Record<string, string> = {
  // Major countries - most common in YouTube analytics
  "United States": "US",
  "United Kingdom": "GB", 
  "Canada": "CA",
  "Australia": "AU",
  "Germany": "DE",
  "France": "FR",
  "Japan": "JP",
  "South Korea": "KR",
  "Italy": "IT",
  "Spain": "ES",
  "Brazil": "BR",
  "Mexico": "MX",
  "India": "IN",
  "China": "CN",
  "Russia": "RU",
  "Netherlands": "NL",
  "Sweden": "SE",
  "Norway": "NO",
  "Denmark": "DK",
  "Finland": "FI",
  "Poland": "PL",
  "Belgium": "BE",
  "Switzerland": "CH",
  "Austria": "AT",
  "Ireland": "IE",
  "New Zealand": "NZ",
  "Singapore": "SG",
  "Hong Kong": "HK",
  "Taiwan": "TW",
  "Malaysia": "MY",
  "Thailand": "TH",
  "Philippines": "PH",
  "Indonesia": "ID",
  "Vietnam": "VN",
  "South Africa": "ZA",
  "Nigeria": "NG",
  "Egypt": "EG",
  "Kenya": "KE",
  "Morocco": "MA",
  "Argentina": "AR",
  "Chile": "CL",
  "Colombia": "CO",
  "Peru": "PE",
  "Venezuela": "VE",
  "Israel": "IL",
  "Turkey": "TR",
  "Saudi Arabia": "SA",
  "United Arab Emirates": "AE",
  "Qatar": "QA",
  "Kuwait": "KW",
  "Jordan": "JO",
  "Lebanon": "LB",
  "Czech Republic": "CZ",
  "Hungary": "HU",
  "Romania": "RO",
  "Bulgaria": "BG",
  "Croatia": "HR",
  "Serbia": "RS",
  "Slovakia": "SK",
  "Slovenia": "SI",
  "Estonia": "EE",
  "Latvia": "LV",
  "Lithuania": "LT",
  "Greece": "GR",
  "Portugal": "PT",
  "Luxembourg": "LU",
  "Iceland": "IS",
  "Ukraine": "UA",
  "Belarus": "BY",
  "Moldova": "MD",
  "Georgia": "GE",
  "Armenia": "AM",
  "Azerbaijan": "AZ",
  "Kazakhstan": "KZ",
  "Uzbekistan": "UZ",
  "Kyrgyzstan": "KG",
  "Tajikistan": "TJ",
  "Turkmenistan": "TM",
  "Mongolia": "MN",
  "North Korea": "KP",
  "Pakistan": "PK",
  "Bangladesh": "BD",
  "Sri Lanka": "LK",
  "Nepal": "NP",
  "Bhutan": "BT",
  "Maldives": "MV",
  "Afghanistan": "AF",
  "Iran": "IR",
  "Iraq": "IQ",
  "Syria": "SY",
  "Yemen": "YE",
  "Oman": "OM",
  "Bahrain": "BH",
  "Cyprus": "CY",
  "Malta": "MT",
  "Algeria": "DZ",
  "Tunisia": "TN",
  "Libya": "LY",
  "Sudan": "SD",
  "Ethiopia": "ET",
  "Somalia": "SO",
  "Djibouti": "DJ",
  "Eritrea": "ER",
  "Uganda": "UG",
  "Tanzania": "TZ",
  "Rwanda": "RW",
  "Burundi": "BI",
  "Democratic Republic of the Congo": "CD",
  "Republic of the Congo": "CG",
  "Central African Republic": "CF",
  "Chad": "TD",
  "Cameroon": "CM",
  "Equatorial Guinea": "GQ",
  "Gabon": "GA",
  "São Tomé and Príncipe": "ST",
  "Ghana": "GH",
  "Ivory Coast": "CI",
  "Burkina Faso": "BF",
  "Mali": "ML",
  "Niger": "NE",
  "Senegal": "SN",
  "Gambia": "GM",
  "Guinea-Bissau": "GW",
  "Guinea": "GN",
  "Sierra Leone": "SL",
  "Liberia": "LR",
  "Mauritania": "MR",
  "Cape Verde": "CV",
  "Togo": "TG",
  "Benin": "BJ",
  "Zambia": "ZM",
  "Zimbabwe": "ZW",
  "Malawi": "MW",
  "Mozambique": "MZ",
  "Madagascar": "MG",
  "Mauritius": "MU",
  "Seychelles": "SC",
  "Comoros": "KM",
  "Botswana": "BW",
  "Namibia": "NA",
  "Lesotho": "LS",
  "Eswatini": "SZ",
  "Angola": "AO",
  "Uruguay": "UY",
  "Paraguay": "PY",
  "Bolivia": "BO",
  "Ecuador": "EC",
  "Guyana": "GY",
  "Suriname": "SR",
  "French Guiana": "GF",
  // Caribbean
  "Jamaica": "JM",
  "Cuba": "CU",
  "Haiti": "HT",
  "Dominican Republic": "DO",
  "Puerto Rico": "PR",
  "Trinidad and Tobago": "TT",
  "Barbados": "BB",
  "Bahamas": "BS",
  "Belize": "BZ",
  "Costa Rica": "CR",
  "Panama": "PA",
  "Nicaragua": "NI",
  "Honduras": "HN",
  "El Salvador": "SV",
  "Guatemala": "GT",
  // Pacific
  "Fiji": "FJ",
  "Papua New Guinea": "PG",
  "Solomon Islands": "SB",
  "Vanuatu": "VU",
  "New Caledonia": "NC",
  "French Polynesia": "PF",
  "Samoa": "WS",
  "Tonga": "TO",
  "Kiribati": "KI",
  "Tuvalu": "TV",
  "Nauru": "NR",
  "Palau": "PW",
  "Marshall Islands": "MH",
  "Micronesia": "FM",
  // Europe continued
  "Albania": "AL",
  "Bosnia and Herzegovina": "BA",
  "Montenegro": "ME",
  "North Macedonia": "MK",
  "Kosovo": "XK",
  "Andorra": "AD",
  "Monaco": "MC",
  "San Marino": "SM",
  "Vatican City": "VA",
  "Liechtenstein": "LI",
};

// Reverse mapping for code to name lookup
export const COUNTRY_CODE_TO_NAME: Record<string, string> = Object.fromEntries(
  Object.entries(COUNTRY_NAME_TO_CODE).map(([name, code]) => [code, name])
);

/**
 * Normalizes country input to a standard format for comparison
 * Handles both country names and ISO codes
 * Returns both normalized name and code for flexible matching
 */
export function normalizeCountry(input: string): {
  name: string | null;
  code: string | null;
  normalized: string;
} {
  if (!input) {
    return { name: null, code: null, normalized: '' };
  }

  // Clean input - trim and normalize case
  const cleaned = input.trim();
  const normalized = cleaned.toLowerCase();

  // Check if input is already a 2-letter ISO code
  if (cleaned.length === 2) {
    const upperCode = cleaned.toUpperCase();
    const name = COUNTRY_CODE_TO_NAME[upperCode];
    return {
      name: name || null,
      code: upperCode,
      normalized: normalized
    };
  }

  // Check if input is a country name
  const code = COUNTRY_NAME_TO_CODE[cleaned];
  return {
    name: cleaned,
    code: code || null,
    normalized: normalized
  };
}

/**
 * Checks if a user's country matches any of the targeted countries
 * Handles both country names and codes, with normalization
 */
export function isCountryTargeted(
  userCountry: string | null | undefined,
  targetedCountries: string[]
): boolean {
  if (!userCountry || !targetedCountries || targetedCountries.length === 0) {
    return false;
  }

  const userNormalized = normalizeCountry(userCountry);
  
  // Check against each targeted country
  for (const targetCountry of targetedCountries) {
    const targetNormalized = normalizeCountry(targetCountry);
    
    // Match by normalized strings (handles case/whitespace)
    if (userNormalized.normalized === targetNormalized.normalized) {
      return true;
    }
    
    // Match by code if both have codes
    if (userNormalized.code && targetNormalized.code) {
      if (userNormalized.code === targetNormalized.code) {
        return true;
      }
    }
    
    // Match by name if both have names  
    if (userNormalized.name && targetNormalized.name) {
      if (userNormalized.name.toLowerCase() === targetNormalized.name.toLowerCase()) {
        return true;
      }
    }
    
    // Cross-format matching: user has name, target has code
    if (userNormalized.name && targetNormalized.code) {
      const userCode = COUNTRY_NAME_TO_CODE[userNormalized.name];
      if (userCode === targetNormalized.code) {
        return true;
      }
    }
    
    // Cross-format matching: user has code, target has name  
    if (userNormalized.code && targetNormalized.name) {
      const userName = COUNTRY_CODE_TO_NAME[userNormalized.code];
      if (userName && userName.toLowerCase() === targetNormalized.name.toLowerCase()) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Gets demo user country with fallback logic
 * Checks user data, session data, and provides reasonable fallback
 */
export function getDemoUserCountry(user: any, req: any): string | null {
  // Check user data first
  if (user?.country) {
    return user.country;
  }
  
  // Check session data 
  if (req?.session?.user?.country) {
    return req.session.user.country;
  }
  
  // Check if demo user has predefined country based on ID
  if (user?.id) {
    const demoCountries: Record<string, string> = {
      'demo-admin_001': 'United Kingdom',
      'demo-user_001': 'United States', 
      'demo-creator_001': 'Canada',
      'demo-free_001': 'Australia',
      'demo-publisher_001': 'Germany'
    };
    
    const demoCountry = demoCountries[user.id];
    if (demoCountry) {
      return demoCountry;
    }
  }
  
  // Default fallback for demo users - show global campaigns only
  return null;
}

/**
 * Debug helper to log geo-targeting decisions
 */
export function logGeoTargeting(
  adTitle: string,
  adCountries: string[],
  userCountry: string | null,
  isMatched: boolean
): void {
  if (adCountries.length === 0) {
    console.log(`🌎 Ad "${adTitle}" is GLOBAL - showing to all users`);
  } else if (!userCountry) {
    console.log(`⚠️ Ad "${adTitle}" is targeted but user has no country - hiding`);
  } else {
    console.log(`🎯 Ad "${adTitle}" targets [${adCountries.join(', ')}] - User country: ${userCountry} - Match: ${isMatched}`);
  }
}