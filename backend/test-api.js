const axios = require('axios');

async function test() {
  try {
    // Test January
    const jan = await axios.get('http://localhost:5000/api/metrics/daily', {
      params: { year: 2025, month: 0, type: 'air' }
    });
    console.log('Jan request (month=0):', jan.data.daily?.length, 'records');
    console.log('Jan dates:', jan.data.daily?.map(d => d.date).slice(0, 3));
    
    // Test February  
    const feb = await axios.get('http://localhost:5000/api/metrics/daily', {
      params: { year: 2025, month: 1, type: 'air' }
    });
    console.log('\nFeb request (month=1):', feb.data.daily?.length, 'records');
    console.log('Feb dates:', feb.data.daily?.map(d => d.date).slice(0, 3));
  } catch (err) {
    console.error('Error:', err.message);
  }
}

test();
