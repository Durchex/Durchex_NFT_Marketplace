import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const PINATA_API_KEY = process.env.VITE_PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.VITE_PINATA_SECRET_KEY;
const PINATA_JWT = process.env.VITE_PINATA_JWT;

async function checkPinataRateLimit() {
  console.log('🔍 Checking Pinata Rate Limit Status...\n');

  // Check if credentials are configured
  if (!PINATA_JWT && (!PINATA_API_KEY || !PINATA_SECRET_KEY)) {
    console.log('❌ No Pinata credentials found!');
    console.log('Current configuration:');
    console.log(`   API Key: ${PINATA_API_KEY || 'Not set'}`);
    console.log(`   Secret Key: ${PINATA_SECRET_KEY || 'Not set'}`);
    console.log(`   JWT: ${PINATA_JWT || 'Not set'}\n`);

    console.log('📝 To set up Pinata:');
    console.log('1. Go to https://app.pinata.cloud/');
    console.log('2. Create a free account');
    console.log('3. Go to API Keys section');
    console.log('4. Create a new API key with pinFileToIPFS permission');
    console.log('5. Update your .env file with real credentials\n');
    return;
  }

  try {
    // Test API call to check rate limits
    const headers = PINATA_JWT
      ? { Authorization: `Bearer ${PINATA_JWT}` }
      : {
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_SECRET_KEY,
        };

    console.log('📡 Testing Pinata API connection...');

    // Make a simple test request (this will show rate limit headers)
    const response = await axios.get('https://api.pinata.cloud/data/testAuthentication', {
      headers,
      timeout: 10000,
    });

    console.log('✅ API Authentication: SUCCESS');
    console.log('📊 Response Status:', response.status);

    // Check rate limit headers
    const rateLimitHeaders = {
      'X-Rate-Limit-Limit': response.headers['x-rate-limit-limit'],
      'X-Rate-Limit-Remaining': response.headers['x-rate-limit-remaining'],
      'X-Rate-Limit-Reset': response.headers['x-rate-limit-reset'],
      'Retry-After': response.headers['retry-after'],
    };

    console.log('\n📈 Rate Limit Status:');
    console.log(`   Limit: ${rateLimitHeaders['X-Rate-Limit-Limit'] || 'Unknown'}`);
    console.log(`   Remaining: ${rateLimitHeaders['X-Rate-Limit-Remaining'] || 'Unknown'}`);

    if (rateLimitHeaders['X-Rate-Limit-Remaining'] !== undefined) {
      const remaining = parseInt(rateLimitHeaders['X-Rate-Limit-Remaining']);
      const limit = parseInt(rateLimitHeaders['X-Rate-Limit-Limit'] || 100);

      if (remaining === 0) {
        console.log('❌ RATE LIMIT EXCEEDED!');
        console.log('   You have used all available requests.');
        if (rateLimitHeaders['Retry-After']) {
          const resetTime = new Date(parseInt(rateLimitHeaders['Retry-After']) * 1000);
          console.log(`   Resets at: ${resetTime.toLocaleString()}`);
        }
      } else if (remaining < limit * 0.1) {
        console.log('⚠️  LOW ON REQUESTS!');
        console.log(`   Only ${remaining} requests remaining (${Math.round(remaining/limit*100)}% left)`);
      } else {
        console.log('✅ Rate limit OK');
        console.log(`   ${remaining} requests remaining (${Math.round(remaining/limit*100)}% left)`);
      }
    }

    if (rateLimitHeaders['X-Rate-Limit-Reset']) {
      const resetTime = new Date(parseInt(rateLimitHeaders['X-Rate-Limit-Reset']) * 1000);
      console.log(`   Resets at: ${resetTime.toLocaleString()}`);
    }

  } catch (error) {
    console.log('❌ API Test Failed:');

    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Message: ${error.response.data?.message || 'Unknown error'}`);

      // Check for rate limit exceeded
      if (error.response.status === 429) {
        console.log('🚫 RATE LIMIT EXCEEDED!');
        console.log('   You have exceeded your Pinata rate limit.');

        const retryAfter = error.response.headers['retry-after'];
        if (retryAfter) {
          const resetTime = new Date(Date.now() + parseInt(retryAfter) * 1000);
          console.log(`   Try again after: ${resetTime.toLocaleString()}`);
        }
      } else if (error.response.status === 401) {
        console.log('🔐 Authentication Failed!');
        console.log('   Your API credentials are invalid.');
        console.log('   Please check your Pinata API key and secret.');
      }
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      console.log('🌐 Network Error!');
      console.log('   Cannot connect to Pinata API.');
      console.log('   Check your internet connection.');
    } else {
      console.log(`   Error: ${error.message}`);
    }

    // Show rate limit headers if available
    if (error.response?.headers) {
      const headers = error.response.headers;
      console.log('\n📊 Rate Limit Info (if available):');
      console.log(`   Limit: ${headers['x-rate-limit-limit'] || 'N/A'}`);
      console.log(`   Remaining: ${headers['x-rate-limit-remaining'] || 'N/A'}`);
      console.log(`   Reset: ${headers['x-rate-limit-reset'] ? new Date(parseInt(headers['x-rate-limit-reset']) * 1000).toLocaleString() : 'N/A'}`);
    }
  }
}

// Run the check
checkPinataRateLimit().catch(console.error);