const axios = require('axios');

const BASE = 'http://localhost:5000';

async function checkAPI() {
  try {
    console.log('\n=== CHECKING API RESPONSE FOR 2024 ===\n');
    
    const res = await axios.get(`${BASE}/api/consumption`, {
      params: { 
        from: '2024-01-01', 
        to: '2024-01-31' 
      }
    });
    
    console.log('API Response (summary):');
    console.log(JSON.stringify(res.data.summary, null, 2));
    
    console.log('\n\nAPI Response (perCar):');
    console.log(JSON.stringify(res.data.perCar, null, 2));
    
    console.log('\n\nAPI Response (trend - first 5 entries):');
    console.log('Labels:', res.data.trend.labels.slice(0, 5));
    console.log('Electricity:', res.data.trend.electricity.slice(0, 5));
    console.log('Air:', res.data.trend.air ? res.data.trend.air.slice(0, 5) : 'NOT IN RESPONSE!');
    console.log('Production:', res.data.trend.production ? res.data.trend.production.slice(0, 5) : 'NOT IN RESPONSE!');
    
    console.log('\n\nAPI Response (locations - first 3):');
    console.log(JSON.stringify(res.data.locations.slice(0, 3), null, 2));
    
    process.exit(0);
  } catch (err) {
    console.error('API Error:', err.message);
    process.exit(1);
  }
}

checkAPI();
