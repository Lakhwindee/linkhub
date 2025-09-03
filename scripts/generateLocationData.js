import fs from 'fs';
import geo from 'countrycitystatejson';

console.log('🌍 Generating accurate world location data...');

// Get all countries with complete data
const countries = geo.getCountries();
console.log(`✅ Found ${countries.length} countries`);

// Build country codes (phone codes) array with proper flags  
const countryCodes = [];
const countryList = [];
const statesByCountry = {};
const citiesByState = {};

countries.forEach(country => {
  // Add country code for phone dropdown
  if (country.phone) {
    countryCodes.push({
      code: `+${country.phone}`,
      country: country.name,
      flag: country.emoji || '🏳️'
    });
  }

  // Add country for country dropdown
  countryList.push({
    name: country.name,
    flag: country.emoji || '🏳️'
  });

  // Get states for this country
  const states = geo.getStatesByShort(country.shortName);
  if (states && states.length > 0) {
    console.log(`📍 Processing ${country.name}: ${states.length} states`);
    statesByCountry[country.name] = states; // States are already strings

    // Get cities for each state
    states.forEach(state => {
      const stateKey = `${country.name}-${state}`;
      const cities = geo.getCities(country.shortName, state);
      if (cities && cities.length > 0) {
        citiesByState[stateKey] = cities; // Cities are already strings
        console.log(`  🏙️ ${state}: ${cities.length} cities`);
      }
    });
  } else {
    console.log(`⚠️ No states found for ${country.name}`);
  }
});

// Remove duplicate country codes (some countries share phone codes)
const uniqueCountryCodes = [];
const seenCodes = new Set();
countryCodes.forEach(item => {
  const key = `${item.code}-${item.country}`;
  if (!seenCodes.has(key)) {
    uniqueCountryCodes.push(item);
    seenCodes.add(key);
  }
});

// Generate the complete location data file
const locationDataContent = `// Auto-generated accurate world location data
// Source: countrycitystatejson package (250+ countries, 5000+ states, 150000+ cities)
// Generated on: ${new Date().toISOString()}

// Country codes for phone number dropdown (with flags)
export const countryCodes = ${JSON.stringify(uniqueCountryCodes, null, 2)};

// All world countries (with flags) - for backward compatibility
export const countries = ${JSON.stringify(countryList, null, 2)};
export const worldCountries = ${JSON.stringify(countryList, null, 2)};

// States/Provinces by country
export const statesByCountry = ${JSON.stringify(statesByCountry, null, 2)};

// Cities by state (format: "CountryName-StateName")  
export const citiesByState = ${JSON.stringify(citiesByState, null, 2)};

// Cities by country - for backward compatibility
export const citiesByCountry = ${JSON.stringify(citiesByState, null, 2)};

// Helper function to get cities for a specific country-state combination
export const getCitiesForState = (country: string, state: string): string[] => {
  const key = \`\${country}-\${state}\`;
  return citiesByState[key] || [];
};

// Helper function to get states for a specific country  
export const getStatesForCountry = (country: string): string[] => {
  return statesByCountry[country] || [];
};
`;

// Write the generated data to the location data file
fs.writeFileSync('../client/src/data/locationData.ts', locationDataContent);

console.log('🎉 Successfully generated accurate location data!');
console.log(`📊 Summary:`);
console.log(`   - Countries: ${countries.length}`);
console.log(`   - Country codes: ${uniqueCountryCodes.length}`);
console.log(`   - Countries with states: ${Object.keys(statesByCountry).length}`);
console.log(`   - State-city combinations: ${Object.keys(citiesByState).length}`);

// Sample verification for India
console.log('\n🇮🇳 India verification:');
const indiaStates = statesByCountry['India'] || [];
console.log(`   - States/UTs: ${indiaStates.length}`);
const gujaratCities = citiesByState['India-Gujarat'] || [];
console.log(`   - Gujarat cities: ${gujaratCities.length}`);
const punjabCities = citiesByState['India-Punjab'] || [];
console.log(`   - Punjab cities: ${punjabCities.length}`);

// Verify Ahmedabad is in Gujarat, not Punjab
const ahmedabadInGujarat = gujaratCities.includes('Ahmedabad');
const ahmedabadInPunjab = punjabCities.includes('Ahmedabad');
console.log(`   - Ahmedabad in Gujarat: ${ahmedabadInGujarat ? '✅' : '❌'}`);
console.log(`   - Ahmedabad in Punjab: ${ahmedabadInPunjab ? '❌ WRONG!' : '✅ Correct'}`);

console.log('\n🌍 Location data generation completed successfully!');