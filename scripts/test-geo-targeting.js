#!/usr/bin/env node

// Test script to verify geo-targeting functionality
// Tests country normalization and matching with both names and codes

// Import ES modules in Node.js environment
import { isCountryTargeted, normalizeCountry, getDemoUserCountry } from '../shared/countryUtils.js';

console.log('🧪 Testing Geo-Targeting Implementation\n');

// Test 1: Country normalization
console.log('🔬 Test 1: Country Normalization');
console.log('='.repeat(50));

const testCountries = [
  'United States',
  'US', 
  'united states',
  'us',
  'United Kingdom',
  'GB',
  'Germany',
  'DE',
  'Canada',
  'CA'
];

testCountries.forEach(country => {
  const normalized = normalizeCountry(country);
  console.log(`Input: "${country}" -> Name: ${normalized.name}, Code: ${normalized.code}, Normalized: ${normalized.normalized}`);
});

console.log('\n🎯 Test 2: Country Targeting Matches');
console.log('='.repeat(50));

// Test 2: Country targeting scenarios
const testScenarios = [
  {
    description: 'User: "United States", Target: ["US"] - Should match',
    userCountry: 'United States',
    targetCountries: ['US'],
    expectedMatch: true
  },
  {
    description: 'User: "US", Target: ["United States"] - Should match',
    userCountry: 'US', 
    targetCountries: ['United States'],
    expectedMatch: true
  },
  {
    description: 'User: "United Kingdom", Target: ["GB", "US"] - Should match GB',
    userCountry: 'United Kingdom',
    targetCountries: ['GB', 'US'],
    expectedMatch: true
  },
  {
    description: 'User: "France", Target: ["US", "GB"] - Should NOT match',
    userCountry: 'France',
    targetCountries: ['US', 'GB'],
    expectedMatch: false
  },
  {
    description: 'User: "canada", Target: ["Canada"] - Should match (case insensitive)',
    userCountry: 'canada',
    targetCountries: ['Canada'],
    expectedMatch: true
  },
  {
    description: 'User: "Germany", Target: [] - Global campaign, should NOT match',
    userCountry: 'Germany',
    targetCountries: [],
    expectedMatch: false
  },
  {
    description: 'User: null, Target: ["US"] - No user country, should NOT match',
    userCountry: null,
    targetCountries: ['US'],
    expectedMatch: false
  }
];

let passedTests = 0;
let totalTests = testScenarios.length;

testScenarios.forEach((scenario, index) => {
  const result = isCountryTargeted(scenario.userCountry, scenario.targetCountries);
  const passed = result === scenario.expectedMatch;
  
  console.log(`\nTest ${index + 1}: ${passed ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Description: ${scenario.description}`);
  console.log(`Result: ${result}, Expected: ${scenario.expectedMatch}`);
  
  if (passed) passedTests++;
});

console.log('\n📊 Test Results Summary');
console.log('='.repeat(50));
console.log(`Tests Passed: ${passedTests}/${totalTests}`);
console.log(`Success Rate: ${((passedTests/totalTests) * 100).toFixed(1)}%`);

if (passedTests === totalTests) {
  console.log('🎉 All tests passed! Geo-targeting implementation is working correctly.');
} else {
  console.log('⚠️ Some tests failed. Please review the implementation.');
}

// Test 3: Demo user country fallback
console.log('\n🔧 Test 3: Demo User Country Fallback');
console.log('='.repeat(50));

const mockUsers = [
  { id: 'demo-admin_001', country: 'United Kingdom' },
  { id: 'demo-user_001', country: 'United States' },
  { id: 'demo-creator_001', country: null }, // Should use fallback
  { id: 'demo-publisher_001' }, // No country property
  { id: 'demo-free_001', country: 'Australia' }
];

mockUsers.forEach(user => {
  const mockReq = { session: { user: { country: 'Session Country' } } };
  const country = getDemoUserCountry(user, mockReq);
  console.log(`User ${user.id}: ${country || 'No country'}`);
});

console.log('\n✅ Geo-targeting test completed!\n');