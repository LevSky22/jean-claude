#!/usr/bin/env node

/**
 * Production Health Monitor for Jean-Claude
 * Checks various aspects of the deployed application
 */

import https from 'https';

const PRODUCTION_URL = 'https://jean-claude-prod.workers.dev';
const DEVELOPMENT_URL = 'https://jean-claude-dev.workers.dev';

async function checkEndpoint(url, path = '') {
  return new Promise((resolve) => {
    const fullUrl = `${url}${path}`;
    console.log(`Checking ${fullUrl}...`);
    
    https.get(fullUrl, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          url: fullUrl,
          status: res.statusCode,
          headers: res.headers,
          contentLength: data.length
        });
      });
    }).on('error', (err) => {
      resolve({
        url: fullUrl,
        error: err.message
      });
    });
  });
}

async function testChatAPI(baseUrl) {
  return new Promise((resolve) => {
    const data = JSON.stringify({
      message: 'Hello, this is a test message',
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
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        resolve({
          url: `${baseUrl}/api/chat`,
          status: res.statusCode,
          headers: res.headers,
          hasStreamingHeader: res.headers['content-type']?.includes('text/event-stream'),
          responsePreview: responseData.substring(0, 100)
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        url: `${baseUrl}/api/chat`,
        error: err.message
      });
    });

    req.write(data);
    req.end();
  });
}

async function runHealthCheck(environment = 'production') {
  const baseUrl = environment === 'production' ? PRODUCTION_URL : DEVELOPMENT_URL;
  
  console.log(`\\n=== Jean-Claude ${environment.toUpperCase()} Health Check ===\\n`);

  // Check main page
  const mainPage = await checkEndpoint(baseUrl);
  console.log('Main Page:', {
    status: mainPage.status,
    contentLength: mainPage.contentLength,
    cacheControl: mainPage.headers?.['cache-control']
  });

  // Check assets
  const assets = await checkEndpoint(baseUrl, '/assets/');
  console.log('\\nAssets Directory:', {
    status: assets.status || 'N/A'
  });

  // Test Chat API
  console.log('\\nTesting Chat API...');
  const chatTest = await testChatAPI(baseUrl);
  console.log('Chat API:', {
    status: chatTest.status,
    hasStreamingHeader: chatTest.hasStreamingHeader,
    responsePreview: chatTest.responsePreview,
    error: chatTest.error
  });

  // Check CORS headers
  console.log('\\nCORS Headers:', {
    'access-control-allow-origin': mainPage.headers?.['access-control-allow-origin'] || 'Not set',
    'access-control-allow-methods': mainPage.headers?.['access-control-allow-methods'] || 'Not set'
  });

  // Check security headers
  console.log('\\nSecurity Headers:', {
    'x-content-type-options': mainPage.headers?.['x-content-type-options'] || 'Not set',
    'x-frame-options': mainPage.headers?.['x-frame-options'] || 'Not set',
    'cache-control': mainPage.headers?.['cache-control'] || 'Not set'
  });

  console.log('\\n=== Health Check Complete ===\\n');
  
  if (mainPage.error || chatTest.error) {
    console.error('⚠️  Errors detected during health check');
    process.exit(1);
  } else if (mainPage.status === 200) {
    console.log('✅ Application appears to be healthy');
  } else {
    console.log('⚠️  Application may not be deployed yet');
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const environment = args.includes('--dev') ? 'development' : 'production';

runHealthCheck(environment);