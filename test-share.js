// Quick test script to validate the share endpoints
const BASE_URL = 'http://localhost:3000';

async function testShareAPI() {
  console.log('🧪 Testing Share API endpoints...\n');

  // Test 1: Basic API endpoint
  try {
    const response = await fetch(`${BASE_URL}/api/share?castHash=0x123&castFid=456&viewerFid=789`);
    const data = await response.json();
    console.log('✅ API endpoint test:', data);
  } catch (error) {
    console.log('❌ API endpoint test failed:', error.message);
  }

  // Test 2: Share page redirect
  try {
    const response = await fetch(`${BASE_URL}/share?castHash=0x123&castFid=456&viewerFid=789`, {
      redirect: 'manual'
    });
    console.log('✅ Share page redirect test:', response.status, response.headers.get('location'));
  } catch (error) {
    console.log('❌ Share page redirect test failed:', error.message);
  }

  // Test 3: Main page with parameters
  try {
    const response = await fetch(`${BASE_URL}/?castHash=0x123&castFid=456&viewerFid=789`);
    console.log('✅ Main page with params test:', response.status);
  } catch (error) {
    console.log('❌ Main page with params test failed:', error.message);
  }
}

// Run the test after a short delay to let the server start
setTimeout(testShareAPI, 3000);