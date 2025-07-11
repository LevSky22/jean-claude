# Jean-Claude Deployment Guide

## Deployment Method: Cloudflare GitHub Integration

Your project is configured to deploy automatically via **Cloudflare's GitHub Integration**. This means:
- ✅ **Automatic deploys** on every push to main branch
- ✅ **No manual deployment needed** - just push your code
- ✅ **Managed by Cloudflare** - build and deploy handled automatically

## Setup Steps (One-time)

### 1. Set Secret in Cloudflare Dashboard
Since you're using GitHub Integration, set the secret in the Cloudflare dashboard:
1. Go to your Cloudflare dashboard
2. Navigate to Workers & Pages > jean-claude
3. Go to Settings > Environment Variables
4. Add `MISTRAL_API_KEY` as a secret

### 2. Verify GitHub Connection
- Check that your GitHub repo is connected in Cloudflare dashboard
- Verify automatic deployments are enabled

## How to Deploy
Simply push to the main branch:
```bash
git add .
git commit -m "Your changes"
git push origin main
```

Cloudflare will automatically:
1. Detect the push
2. Build your project
3. Deploy to: https://jean-claude.lev-jampolsky.workers.dev

### 4. Test Production Functionality
- [ ] Load the application
- [ ] Test chat functionality
- [ ] Verify rate limiting (60 req/min/IP)
- [ ] Check CORS headers
- [ ] Test export functionality
- [ ] Verify IndexedDB storage

### 5. Monitor Production Health
- Check Cloudflare Workers Analytics:
  - Request count
  - Error rate
  - CPU time
  - Duration metrics
- Monitor for:
  - Memory leaks
  - Rate limit violations
  - API key exposure
  - Performance degradation

## Local Development
For local development:
```bash
# Run local development server with hot reload
npm run dev

# Run with wrangler for testing worker functionality
npm run dev:worker
```

## Rollback Procedure
If issues are found:
```bash
# List deployments
wrangler deployments list

# Rollback to previous version
wrangler rollback
```