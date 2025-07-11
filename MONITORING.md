# Jean-Claude Production Monitoring Guide

## Overview
This guide provides instructions for monitoring the health and performance of the Jean-Claude chatbot deployed on Cloudflare Workers.

## Monitoring Tools

### 1. Health Check Script
```bash
# Check production
node scripts/monitor-production.js

# Check development
node scripts/monitor-production.js --dev
```

This script validates:
- Main page accessibility
- Asset serving
- Chat API functionality
- CORS headers
- Security headers

### 2. Rate Limit Testing
```bash
# Test production rate limits
node scripts/test-rate-limit.js

# Test development rate limits
node scripts/test-rate-limit.js --dev
```

This script tests:
- Burst capacity (10 requests)
- Sustained rate (60 requests/minute)
- Rate limit header responses

### 3. Cloudflare Dashboard Monitoring

Access the Cloudflare dashboard to monitor:

1. **Workers Analytics**
   - Request volume
   - Error rates
   - CPU time per request
   - Duration percentiles (p50, p90, p99)

2. **Real-time Logs**
   ```bash
   # Tail production logs
   wrangler tail --env production
   
   # Tail development logs
   wrangler tail --env development
   ```

3. **Key Metrics to Monitor**
   - **Success Rate**: Should be >99%
   - **Average Duration**: Should be <100ms for static assets, <500ms for API
   - **CPU Time**: Should be <10ms average
   - **Error Types**: Watch for 429 (rate limit) and 500 (server error)

## Performance Benchmarks

### Expected Performance
- **Static Assets**: <50ms response time
- **Chat API**: <500ms initial response
- **Rate Limiting**: 60 requests/minute per IP
- **Burst Capacity**: 10 requests
- **Memory Usage**: <128MB per request

### Alert Thresholds
Set up alerts for:
- Error rate >1%
- Average duration >1000ms
- CPU time >50ms
- Memory limit exceptions

## Security Monitoring

### Things to Watch For
1. **Unusual Traffic Patterns**
   - Sudden spikes in requests
   - Requests from unexpected regions
   - Repeated 429 responses from same IPs

2. **API Key Security**
   - No API keys in response headers
   - No API keys in error messages
   - Secure storage in Cloudflare secrets

3. **CORS Violations**
   - Requests from unauthorized origins
   - Missing CORS headers

## Incident Response

### If Performance Degrades
1. Check real-time logs: `wrangler tail --env production`
2. Review error patterns in dashboard
3. Check for rate limit violations
4. Verify Mistral API availability

### If Security Issue Detected
1. Immediately rotate API keys
2. Review access logs
3. Update CORS allowed origins if needed
4. Deploy security patch

### Rollback Procedure
```bash
# List recent deployments
wrangler deployments list --env production

# Rollback to previous version
wrangler rollback --env production --message "Rolling back due to [issue]"
```

## Regular Maintenance

### Daily Checks
- Review error rates in dashboard
- Check for any 500 errors
- Monitor request volume trends

### Weekly Tasks
- Run full health check script
- Review performance metrics
- Check for unusual traffic patterns
- Verify rate limiting effectiveness

### Monthly Tasks
- Review and optimize worker bundle size
- Audit security headers
- Update dependencies if needed
- Review cost/usage metrics

## Useful Commands

```bash
# Check worker status
wrangler deployments list --env production

# View current configuration
cat wrangler.jsonc

# Check bundle size
du -h dist/_worker.js

# Test locally before deploying
npm run dev:worker
```