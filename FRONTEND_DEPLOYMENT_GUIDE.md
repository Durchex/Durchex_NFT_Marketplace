# Frontend Deployment Guide

## Overview

This guide covers deploying the Durchex NFT Marketplace frontend to Vercel or Netlify with optimized builds, CDN configuration, and performance monitoring.

## Prerequisites

- Node.js 18+ and npm
- GitHub repository access
- Vercel or Netlify account
- Environment variables configured
- Lighthouse CI configuration

## Local Development

### Quick Start

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm run test

# Linting
npm run lint
```

### Environment Variables

```env
# API Configuration
REACT_APP_API_URL=http://localhost:5000
REACT_APP_ENVIRONMENT=development

# Blockchain
REACT_APP_ETHEREUM_RPC_URL=http://localhost:8545
REACT_APP_CHAIN_ID=31337
REACT_APP_CONTRACT_ADDRESSES={"lazyMint":"0x...","auction":"0x..."}

# IPFS
REACT_APP_IPFS_GATEWAY=http://localhost:8080

# External Services
REACT_APP_SENTRY_DSN=https://xxx@sentry.io/xxx
REACT_APP_GA_ID=G-XXXXXXXXXX
```

## Build Optimization

### Bundle Analysis

```bash
# Generate bundle report
npm run build:report

# Analyze bundle size
npx webpack-bundle-analyzer dist/stats.json
```

### Code Splitting Strategy

- **Vendors**: React, UI libraries (~800KB)
- **Blockchain**: Ethers, Wagmi (~300KB)
- **Pages**: Lazy-loaded routes (~50-100KB each)
- **Common**: Shared utilities (~150KB)

### Performance Targets

- **First Contentful Paint (FCP)**: < 2.5s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **Time to Interactive (TTI)**: < 5s
- **Bundle Size**: < 2MB gzipped

## Deployment to Vercel

### 1. Connect GitHub Repository

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy project
vercel --prod
```

### 2. Configure Environment Variables

In Vercel Dashboard:

1. Go to Settings → Environment Variables
2. Add production variables:
   - `REACT_APP_API_URL`: https://api.durchex.com
   - `REACT_APP_ENVIRONMENT`: production
   - `REACT_APP_ETHEREUM_RPC_URL`: https://eth-mainnet.alchemyapi.io/v2/YOUR_KEY
   - `REACT_APP_CHAIN_ID`: 1
   - `REACT_APP_CONTRACT_ADDRESSES`: Production contract addresses
   - `REACT_APP_SENTRY_DSN`: Production Sentry DSN
   - `REACT_APP_GA_ID`: Production GA ID

### 3. Configure Domains

```bash
# Add custom domain
vercel domains add durchex.com

# Configure DNS (depending on registrar)
# Add Vercel nameservers or CNAME records
```

### 4. Enable Analytics

In Vercel Dashboard:
1. Go to Analytics
2. Enable Web Analytics
3. View performance metrics and insights

### 5. Configure Preview Deployments

```bash
# Each PR automatically gets a preview deployment
# Configure in vercel.json for special handling
```

### Vercel Deployment Checklist

- [ ] GitHub repository connected
- [ ] Environment variables configured for each environment
- [ ] Custom domain connected
- [ ] SSL certificate auto-provisioned
- [ ] Web Analytics enabled
- [ ] Performance monitoring configured
- [ ] Automatic deployments on git push enabled
- [ ] Rollback plan documented

## Deployment to Netlify

### 1. Connect GitHub Repository

1. Log in to Netlify
2. Click "New site from Git"
3. Select GitHub repository
4. Configure build settings

### 2. Configure Build Settings

- **Build Command**: `npm run build`
- **Publish Directory**: `dist`
- **Node Version**: 18.17.0

### 3. Add Environment Variables

In Netlify Dashboard → Site Settings → Build & Deploy → Environment:

```
REACT_APP_API_URL=https://api.durchex.com
REACT_APP_ENVIRONMENT=production
REACT_APP_ETHEREUM_RPC_URL=https://eth-mainnet.alchemyapi.io/v2/YOUR_KEY
REACT_APP_CHAIN_ID=1
REACT_APP_CONTRACT_ADDRESSES=...
REACT_APP_SENTRY_DSN=...
REACT_APP_GA_ID=...
```

### 4. Configure Redirects

Netlify automatically uses `netlify.toml`:

```toml
# SPA routing
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

# API proxy
[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

### 5. Setup Functions (Serverless)

```bash
# Create functions directory
mkdir -p netlify/functions

# Example function
cat > netlify/functions/auth.js <<EOF
exports.handler = async (event) => {
  // Serverless function code
  return { statusCode: 200, body: JSON.stringify({ message: 'OK' }) };
};
EOF
```

### Netlify Deployment Checklist

- [ ] GitHub repository connected
- [ ] Build settings configured correctly
- [ ] Environment variables set for all environments
- [ ] netlify.toml configured
- [ ] Custom domain connected
- [ ] Automatic deployments enabled
- [ ] Deploy notifications configured
- [ ] Analytics plugin enabled

## CI/CD Pipeline

### GitHub Actions Workflow

The `.github/workflows/deploy-frontend.yml` handles:

1. **Linting & Testing**
   - ESLint validation
   - Jest test suite
   - Type checking
   - Code coverage

2. **Build Optimization**
   - Code splitting
   - Tree shaking
   - Minification
   - Asset optimization

3. **Deployment**
   - Vercel deployment (main branch)
   - Netlify deployment (develop branch)
   - Preview deployments (PRs)

4. **Performance Testing**
   - Lighthouse CI
   - Bundle analysis
   - Performance metrics

### Manual Deployment

```bash
# Deploy to production
git push origin main

# Triggers Vercel deployment automatically

# Deploy to staging
git push origin develop

# Triggers Netlify deployment automatically
```

## Performance Monitoring

### Sentry Integration

```javascript
// Tracks errors and performance
import Sentry from '@sentry/react';

Sentry.init({
  dsn: process.env.REACT_APP_SENTRY_DSN,
  environment: process.env.REACT_APP_ENVIRONMENT,
  tracesSampleRate: 0.1,
});
```

### Google Analytics

```javascript
// Tracks user behavior and metrics
gtag('event', 'page_view', {
  page_path: '/explore',
  page_title: 'NFT Marketplace',
});
```

### Web Vitals

Monitor using web-vitals library:

```javascript
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log); // Cumulative Layout Shift
getFID(console.log); // First Input Delay
getFCP(console.log); // First Contentful Paint
getLCP(console.log); // Largest Contentful Paint
getTTFB(console.log); // Time to First Byte
```

## CDN Configuration

### Static Assets

All assets served through CDN (Vercel/Netlify):

- **CSS/JS**: Cached with version hashing (immutable)
- **Images**: Optimized with next-gen formats (WebP, AVIF)
- **Fonts**: Preloaded and subset for performance

### Cache Headers

```
/static/*
  Cache-Control: public, max-age=31536000, immutable

/api/*
  Cache-Control: no-cache, no-store, must-revalidate

/*.js, /*.css
  Cache-Control: public, max-age=31536000, immutable

index.html
  Cache-Control: no-cache, must-revalidate
```

## Security Configuration

### Headers

All security headers configured in vercel.json/netlify.toml:

- Content-Security-Policy (CSP)
- X-Content-Type-Options
- X-Frame-Options
- Strict-Transport-Security (HSTS)
- Referrer-Policy
- Permissions-Policy

### HTTPS

- Automatic SSL certificate provisioning
- HTTP → HTTPS redirect
- HSTS headers for long-term enforcement

## Rollback Procedure

### Vercel Rollback

```bash
# View deployment history
vercel list

# Rollback to previous deployment
vercel rollback

# Or deploy specific commit
vercel --target production <commit-hash>
```

### Netlify Rollback

1. Go to Deploys page
2. Click on previous successful deployment
3. Click "Publish deploy"

## Troubleshooting

### Build Failures

```bash
# Clear cache and rebuild
vercel env pull
npm ci
npm run build

# Check build logs in dashboard
```

### Performance Issues

```bash
# Generate Lighthouse report
npm run build:lighthouse

# Analyze bundle
npm run build:report

# Check network requests
# Open DevTools → Network tab
```

### Environment Variable Issues

```bash
# Verify variables are loaded
echo $REACT_APP_API_URL

# Check in dashboard
# Vercel/Netlify → Settings → Environment Variables

# Redeploy after changing variables
```

## Production Readiness Checklist

- [ ] Environment variables configured correctly
- [ ] Build succeeds without warnings
- [ ] Bundle size within targets
- [ ] Lighthouse score > 90
- [ ] Web Vitals within targets
- [ ] Error tracking (Sentry) functional
- [ ] Analytics (GA) collecting data
- [ ] Custom domain working
- [ ] SSL certificate active
- [ ] Automatic deployments enabled
- [ ] Monitoring alerts configured
- [ ] Rollback plan documented
- [ ] Team access configured
- [ ] Deployment notifications working

## Support

For additional help:
- [Vercel Docs](https://vercel.com/docs)
- [Netlify Docs](https://docs.netlify.com)
- [Sentry Docs](https://docs.sentry.io)
- [Web Vitals Guide](https://web.dev/vitals)
