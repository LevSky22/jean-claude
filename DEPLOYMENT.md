# Deployment

## Automatic Deployment via Cloudflare GitHub Integration

This project is configured for **automatic deployment** using Cloudflare's GitHub Integration.

### How it works:
- **Push to main branch** → Cloudflare automatically builds and deploys
- **No manual commands needed** - just normal git workflow
- **Live URL**: https://jean-claude.lev-jampolsky.workers.dev

### First-time setup:
1. **Set API Key**: Add `MISTRAL_API_KEY` in Cloudflare dashboard (Workers & Pages > jean-claude > Settings > Environment Variables)
2. **Verify GitHub connection** in Cloudflare dashboard

### To deploy changes:
```bash
git add .
git commit -m "Your changes"
git push origin main
```

That's it! Cloudflare handles the rest automatically.

## Local Development

```bash
# Frontend development with hot reload
npm run dev

# Test with Worker functionality locally
npm run dev:worker
```

## Manual Deployment (if needed)

If you ever need to deploy manually:
```bash
npm run deploy
```

## Build Commands

The project uses these build commands (configured in wrangler.jsonc):
```bash
npm run build:worker    # Full build with assets
npm run build          # Frontend build only
```