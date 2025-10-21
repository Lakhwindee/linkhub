import { storage } from './storage';

// Default tax configurations for major countries
const defaultTaxConfigurations = [
  {
    country: 'GB',
    countryName: 'United Kingdom',
    taxRate: '20.00',
    taxType: 'withholding',
    taxName: 'Income Tax',
    notes: 'Standard UK income tax on creator earnings'
  },
  {
    country: 'IN',
    countryName: 'India',
    taxRate: '10.00',
    taxType: 'withholding',
    taxName: 'TDS (Tax Deducted at Source)',
    notes: 'Tax deducted at source for freelance income'
  },
  {
    country: 'US',
    countryName: 'United States',
    taxRate: '24.00',
    taxType: 'withholding',
    taxName: 'Federal Withholding Tax',
    notes: 'Federal tax for non-employee compensation'
  },
  {
    country: 'CA',
    countryName: 'Canada',
    taxRate: '15.00',
    taxType: 'withholding',
    taxName: 'GST/HST',
    notes: 'Canadian goods and services tax'
  },
  {
    country: 'AU',
    countryName: 'Australia',
    taxRate: '10.00',
    taxType: 'withholding',
    taxName: 'GST',
    notes: 'Australian goods and services tax'
  },
  {
    country: 'FR',
    countryName: 'France',
    taxRate: '20.00',
    taxType: 'withholding',
    taxName: 'TVA',
    notes: 'French value-added tax'
  },
  {
    country: 'DE',
    countryName: 'Germany',
    taxRate: '19.00',
    taxType: 'withholding',
    taxName: 'MwSt',
    notes: 'German value-added tax'
  },
];

async function seedTaxConfigurations() {
  console.log('🌍 Seeding tax configurations for worldwide support...');
  
  try {
    for (const config of defaultTaxConfigurations) {
      const existing = await storage.getTaxConfiguration(config.country);
      
      if (!existing) {
        await storage.createTaxConfiguration(config);
        console.log(`✅ Added tax configuration for ${config.countryName} (${config.taxRate}%)`);
      } else {
        console.log(`⏭️  Tax configuration already exists for ${config.countryName}`);
      }
    }
    
    console.log('✅ Tax configuration seeding complete!');
    console.log('\nCountries configured:');
    defaultTaxConfigurations.forEach(c => {
      console.log(`  - ${c.countryName}: ${c.taxRate}% ${c.taxName}`);
    });
  } catch (error) {
    console.error('❌ Error seeding tax configurations:', error);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedTaxConfigurations().then(() => process.exit(0)).catch(() => process.exit(1));
}

export { seedTaxConfigurations };
