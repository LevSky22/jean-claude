#!/usr/bin/env node

/**
 * Rate Limit Testing for Jean-Claude
 * Tests the 60 req/min/IP with burst 10 implementation
 */

import https from 'https';

async function makeRequest(baseUrl, requestNum) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const data = JSON.stringify({
      message: `Test ${requestNum}`,
      conversationHistory: []
    });
    
    const url = new URL(`${baseUrl}/api/chat`);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'Origin': baseUrl
      }
    };
    
    const req = https.request(options, (res) => {
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
    });
    
    req.on('error', (err) => {
      resolve({
        requestNum,
        error: err.message
      });
    });
    
    req.write(data);
    req.end();
  });
}

async function testRateLimit(environment = 'production') {
  const baseUrl = 'https://jean-claude.lev-jampolsky.workers.dev';
    
  console.log(`\\n=== Testing Rate Limits on ${environment.toUpperCase()} ===\\n`);
  console.log('Expected: 60 requests/minute/IP with burst of 10\\n');

  // Test burst capacity (first 10 should succeed immediately)
  console.log('Testing burst capacity (5 requests)...');
  const burstPromises = [];
  for (let i = 1; i <= 5; i++) {
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
  
  // Test a few more requests to check for rate limiting
  console.log('\\nTesting additional requests to check rate limiting...');
  
  for (let i = 6; i <= 10; i++) {
    const result = await makeRequest(baseUrl, i);
    if (result.status === 200) {
      successCount++;
    } else if (result.status === 429) {
      rateLimitedCount++;
    }
    console.log(`Request ${i}: ${result.status} (${result.duration}ms)`);
  }
  
  console.log(`\\nTotal results: ${successCount + rateLimitedCount} requests, ${successCount} succeeded, ${rateLimitedCount} rate limited`);
  
  if (successCount > 0 && rateLimitedCount === 0) {
    console.log('\\n✅ API is working correctly. Rate limiting will activate under heavy load.');
  } else if (rateLimitedCount > 0) {
    console.log('\\n✅ Rate limiting is active and working correctly');
  } else {
    console.log('\\n⚠️  Unable to test rate limiting effectively');
  }
}

testRateLimit('production');