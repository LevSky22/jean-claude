# Jean-Claude Chatbot 🇫🇷

A sophisticated French AI chatbot with authentic Parisian personality, built with React and deployed on Cloudflare Workers.

## ✨ Features

- **🎭 Authentic Parisian Personality**: Jean-Claude embodies sophisticated French culture with theatrical flair
- **💬 Real-time Chat**: Streaming responses powered by Mistral AI
- **🔒 Privacy-First**: All conversations stored locally in your browser
- **♿ Accessibility**: WCAG 2.2 AA compliant with full keyboard navigation
- **📱 Responsive Design**: Works seamlessly on desktop and mobile
- **🗂️ Multi-Session Management**: Organize conversations with a sidebar
- **📤 Export & Delete**: Download chats as Markdown or clear all data
- **🛡️ Security**: Rate limiting and origin validation built-in

## 🏗️ Architecture

- **Frontend**: React SPA with TypeScript and Tailwind CSS
- **Backend**: Cloudflare Workers (unified static + serverless)
- **AI**: Mistral AI API for chat responses
- **Storage**: IndexedDB for local conversation persistence
- **Deployment**: Cloudflare Workers global network

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Cloudflare account
- Mistral AI API key

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd jean-claude

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your MISTRAL_API_KEY
```

### Development
```bash
# Start development server
npm run dev

# Build for production
npm run build:worker

# Test locally with Workers
npm run dev:worker
```

### Deployment
```bash
# Login to Cloudflare
wrangler login

# Set production API key
wrangler secret put MISTRAL_API_KEY --env production

# Deploy to production
npm run deploy
```

## 📁 Project Structure

```
jean-claude/
├── src/
│   ├── components/          # React components
│   ├── hooks/              # Custom React hooks
│   ├── services/           # API services
│   ├── utils/              # Utility functions
│   └── worker.ts           # Cloudflare Worker script
├── dist/                   # Build output
├── wrangler.jsonc          # Workers configuration
├── deploy-worker.sh        # Deployment script
└── WORKERS-DEPLOYMENT-FINAL.md  # Deployment guide
```

## 🎭 Jean-Claude Personality

Jean-Claude is a sophisticated Parisian AI with:
- **Cultural Sophistication**: References to French literature, cinema, and philosophy
- **Authentic Expressions**: Real Parisian French slang and expressions
- **Theatrical Flair**: Dramatic responses with intellectual depth
- **Helpful Nature**: Provides accurate information with characteristic charm

## 🔧 Configuration

### Environment Variables
- `MISTRAL_API_KEY`: Your Mistral AI API key (required)

### Cloudflare Workers Settings
- **Rate Limiting**: 60 requests per minute per IP
- **Origin Validation**: Blocks unauthorized cross-origin requests
- **Security Headers**: CORS, CSP, and security headers applied

## 🛡️ Security Features

- **🔐 API Key Protection**: Never exposed to client-side
- **🚦 Rate Limiting**: Prevents abuse with IP-based limits
- **🌐 Origin Validation**: Blocks unauthorized domains
- **🔒 Local Storage**: No server-side conversation logging
- **📝 Privacy Footer**: Clear data handling disclosure

## ♿ Accessibility

- **WCAG 2.2 AA Compliant**: Full accessibility support
- **⌨️ Keyboard Navigation**: Complete keyboard-only usage
- **🔊 Screen Reader Support**: ARIA labels and live regions
- **🎨 High Contrast**: Meets color contrast requirements
- **🏷️ Semantic HTML**: Proper heading hierarchy and landmarks

## 📊 Performance

- **⚡ Fast Loading**: Optimized bundle size (~405KB)
- **🚀 Instant API**: Sub-500ms response times
- **📱 Mobile Optimized**: Responsive design
- **🌍 Global CDN**: Cloudflare's worldwide network

## 🧪 Testing

```bash
# Run type checking
npm run lint

# Test build
npm run build:worker

# Local development testing
npm run dev:worker
```

## 📚 Documentation

- **[Deployment Guide](WORKERS-DEPLOYMENT-FINAL.md)**: Complete deployment instructions
- **[Test Plan](E2E-TEST-PLAN.md)**: End-to-end testing strategy
- **[Task Master](CLAUDE.md)**: Development workflow with Task Master AI

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **Mistral AI**: For the powerful language model
- **Cloudflare**: For the excellent Workers platform
- **React Team**: For the amazing framework
- **All contributors**: Thank you for your support!

---

*Créé avec amour et sophistication parisienne* 🥐☕✨