import fetch from 'node-fetch';

const SERVER_URL = 'http://localhost:3000';

// Test data
const testChart = {
  type: 'line',
  data: [
    { time: 2018, value: 91.9 },
    { time: 2019, value: 99.1 },
    { time: 2020, value: 85.2 },
    { time: 2021, value: 95.7 },
    { time: 2022, value: 102.3 }
  ]
};

async function testServer() {
  try {
    // Test health endpoint
    console.log('🔍 Testing health endpoint...');
    const healthResponse = await fetch(`${SERVER_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('Health check:', JSON.stringify(healthData, null, 2));
    
    // Test chart generation
    console.log('\n📊 Testing chart generation...');
    const chartResponse = await fetch(`${SERVER_URL}/api/gpt-vis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testChart)
    });
    
    const chartData = await chartResponse.json();
    console.log('Chart generation result:', JSON.stringify(chartData, null, 2));
    
    if (chartData.success) {
      console.log(`\n✅ Chart generated successfully!`);
      console.log(`📍 Image URL: ${chartData.resultObj}`);
      console.log(`💾 Storage: ${chartData.storage}`);
      
      if (chartData.localPath) {
        console.log(`📁 Local path: ${chartData.localPath}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run test
console.log('🚀 Starting server test...');
testServer();