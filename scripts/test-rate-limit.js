#!/usr/bin/env node

/**
 * Rate Limit Testing for Jean-Claude
 * Tests the 60 req/min/IP with burst 10 implementation
 */

const https = require('https');

async function makeRequest(baseUrl, requestNum) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    https.get(`${baseUrl}/api/chat`, {
      headers: {
        'Origin': baseUrl
      }
    }, (res) => {
      const endTime = Date.now();
      resolve({
        requestNum,
        status: res.statusCode,
        duration: endTime - startTime,
        rateLimitHeaders: {
          'x-ratelimit-limit': res.headers['x-ratelimit-limit'],
          'x-ratelimit-remaining': res.headers['x-ratelimit-remaining'],
          'x-ratelimit-reset': res.headers['x-ratelimit-reset']
        }
      });
    }).on('error', (err) => {
      resolve({
        requestNum,
        error: err.message
      });
    });
  });
}

async function testRateLimit(environment = 'production') {
  const baseUrl = environment === 'production' 
    ? 'https://jean-claude-prod.workers.dev'
    : 'https://jean-claude-dev.workers.dev';
    
  console.log(`\\n=== Testing Rate Limits on ${environment.toUpperCase()} ===\\n`);
  console.log('Expected: 60 requests/minute/IP with burst of 10\\n');

  // Test burst capacity (first 10 should succeed immediately)
  console.log('Testing burst capacity (10 requests)...');
  const burstPromises = [];
  for (let i = 1; i <= 12; i++) {
    burstPromises.push(makeRequest(baseUrl, i));
  }
  
  const burstResults = await Promise.all(burstPromises);
  
  let successCount = 0;
  let rateLimitedCount = 0;
  
  burstResults.forEach(result => {
    if (result.status === 200 || result.status === 405) {
      successCount++;
    } else if (result.status === 429) {
      rateLimitedCount++;
    }
    
    console.log(`Request ${result.requestNum}: ${result.status} (${result.duration}ms)`);
  });
  
  console.log(`\\nBurst test results: ${successCount} succeeded, ${rateLimitedCount} rate limited`);
  
  // Test sustained rate
  console.log('\\nTesting sustained rate (60 requests over 1 minute)...');
  console.log('This will take approximately 1 minute...\\n');
  
  const startTime = Date.now();
  let totalRequests = 0;
  let successfulRequests = 0;
  let rateLimitedRequests = 0;
  
  const interval = setInterval(async () => {
    totalRequests++;
    const result = await makeRequest(baseUrl, totalRequests);
    
    if (result.status === 200 || result.status === 405) {
      successfulRequests++;
      process.stdout.write('.');
    } else if (result.status === 429) {
      rateLimitedRequests++;
      process.stdout.write('X');
    } else {
      process.stdout.write('?');
    }
    
    if (totalRequests >= 70 || (Date.now() - startTime) > 65000) {
      clearInterval(interval);
      console.log(`\\n\\nSustained rate test complete:`);
      console.log(`Total requests: ${totalRequests}`);
      console.log(`Successful: ${successfulRequests}`);
      console.log(`Rate limited: ${rateLimitedRequests}`);
      console.log(`Time elapsed: ${Math.round((Date.now() - startTime) / 1000)}s`);
      
      if (successfulRequests <= 60 && rateLimitedRequests > 0) {
        console.log('\\n✅ Rate limiting appears to be working correctly');
      } else {
        console.log('\\n⚠️  Rate limiting may not be configured properly');
      }
    }
  }, 1000);
}

// Parse command line arguments
const args = process.argv.slice(2);
const environment = args.includes('--dev') ? 'development' : 'production';

testRateLimit(environment);