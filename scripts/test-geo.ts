// Simple TypeScript test for geo-targeting
import { isCountryTargeted, normalizeCountry } from '../shared/countryUtils';

console.log('🧪 Testing Geo-Targeting Utilities\n');

// Test country normalization
const testCases = [
  { user: 'United States', targets: ['US'], expected: true },
  { user: 'US', targets: ['United States'], expected: true },
  { user: 'Germany', targets: ['DE', 'US'], expected: true },
  { user: 'France', targets: ['US', 'GB'], expected: false },
  { user: 'canada', targets: ['Canada'], expected: true },
];

let passed = 0;
testCases.forEach((test, i) => {
  const result = isCountryTargeted(test.user, test.targets);
  const success = result === test.expected;
  console.log(`Test ${i+1}: ${success ? '✅' : '❌'} User: ${test.user}, Targets: [${test.targets.join(',')}] -> ${result}`);
  if (success) passed++;
});

console.log(`\n✅ Passed: ${passed}/${testCases.length} tests`);

// Test normalization
console.log('\n🔍 Country Normalization:');
['United States', 'US', 'Germany', 'DE'].forEach(country => {
  const norm = normalizeCountry(country);
  console.log(`"${country}" -> Name: ${norm.name}, Code: ${norm.code}`);
});