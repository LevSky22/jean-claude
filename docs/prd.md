Product-Requirements Document  
Jean-Claude Chatbot
────────────────────────────────────────────────────────────────────────────

1. PURPOSE & GOALS
   ──────────────────
   | Goal | Success Metric |
   |--------------------------------------------------------------|-------------------------------------------------------------|
   | Provide an instant, French-flavoured chatbot experience | ≥ 95 % of first-time visitors receive a reply |
   | Keep transcripts **local-only** | Code audit: no payload logging on proxy/worker |
   | Protect owner’s secret Mistral key | 0 leaked-key incidents |
   | Control traffic-driven cost | 99-pctl ≤ 60 req/min/IP; bills ± 10 % forecast |

──────────────────────────────────────────────────────────────────────────── 2. SCOPE
────────
Included | Excluded
-----------------------------------------------------------------|-----------------------------------------------------------
• Edge proxy (Cloudflare Worker **or** Pages Function) | • Cloud transcript storage / user accounts
• Optional “One-Worker” deployment serving UI + proxy | • Fine-tuning or on-prem models
• IndexedDB transcript store, offline PWA | • Multi-user collaboration features
• Local **Export (.md)** and **Delete All** controls | • Any server-side logging of chat content

──────────────────────────────────────────────────────────────────────────── 3. ARCHITECTURE
───────────────
Option A — **Pages + Functions**  
 Browser SPA ⇄ IndexedDB (local)  
 │  
 └── HTTPS POST → Pages Function (proxy) → Mistral API  
 ←── streaming tokens ←

Option B — **Single Cloudflare Worker**  
 Browser SPA ⇄ IndexedDB  
 │  
 └── HTTPS POST → **One Worker** (serves static assets _and_ `/api/chat` proxy) → Mistral API  
 ←── streaming tokens ←

Limits for One-Worker: ≤ 1 MiB bundled JS; ≤ 25 MiB total static assets in KV.

──────────────────────────────────────────────────────────────────────────── 4. FUNCTIONAL REQUIREMENTS
──────────────────────────
| ID | Requirement |
|----|-------------------------------------------------------------------------------------------------------------|
| F-1 | Client prepends every request with the **Jean-Claude system prompt**. |
| F-2 | Proxy/Worker injects `Authorization: Bearer $MISTRAL_KEY`, streams tokens, strips extraneous headers. |
| F-3 | Rate-limit 60 req/min/IP (burst 10); return 429 on excess. |
| F-4 | Validate `Referer` + `Origin`; reject off-site calls. |
| F-5 | No chat payloads or IPs stored server-side; set `no_store` on any CDN cache. |
| F-6 | IndexedDB stores transcripts; user can **Export** or **Delete all**. |
| F-7 | Offline mode: past chats viewable; new queries disabled with tooltip. |

──────────────────────────────────────────────────────────────────────────── 5. NON-FUNCTIONAL REQUIREMENTS
──────────────────────────────
| Category | Requirement |
|---------------|-------------------------------------------------------------------------------------------|
| Performance | First-token latency ≤ 0.5 s (95 pctl). |
| Security | API key never exposed to browser; stored in Worker/Function env vars. |
| Privacy | No cookies; data live only in IndexedDB/localStorage. |
| Compliance | GDPR/CCPA banner: “Messages processed by Mistral AI; no copy stored by site owner.” |
| Accessibility | WCAG 2.2 AA, including streaming ARIA live-region updates. |

──────────────────────────────────────────────────────────────────────────── 6. USER STORIES (abridged)
──────────────────────────

1. **Instant Visitor** — opens site, chats immediately (no key input).
2. **Cost-Spike Guard** — abuser hits limit, sees “Slow down” notice.
3. **Export History** — user downloads Markdown of conversation.
4. **Wipe All** — user clicks “Delete All”; local store purged.

──────────────────────────────────────────────────────────────────────────── 7. RISK & MITIGATION
────────────────────
| Risk | Likely | Impact | Mitigation |
|------------------------------------|--------|--------|---------------------------------------------------|
| API key leakage via mis-config | Low | High | Proxy hides key; origin check; canary tests. |
| DDoS / bot abuse | Med | High | Rate-limit + Cloudflare security rules. |
| Worker logs accidental payloads | Low | High | Linter bans `console.log` on request bodies. |
| Local data loss (cache clear) | Med | Med | “Export chat” reminder after 10 messages. |

──────────────────────────────────────────────────────────────────────────── 8. MILESTONES
─────────────
| Phase | Effort | Deliverable |
|------------------------------------|--------|----------------------------------------|
| Build static SPA | 1 d | Vite/React bundle |
| Edge function / One-Worker proxy | 3 d | Proxy code, secret in env, tests |
| Rate-limit & origin check | 1 d | Unit + load tests |
| UI integration `/api/chat` route | 0.5 d | Refactor + smoke test |
| Legal/privacy copy | 0.5 d | GDPR banner |
Total: ~6 working days.

──────────────────────────────────────────────────────────────────────────── 9. KPIs
───────
• p95 first-token latency < 0.5 s  
• 403/429 responses ≤ 5 % total  
• Monthly token usage vs forecast ± 10 %  
• Leaked-key incidents = 0

────────────────────────────────────────────────────────────────────────────
APPENDIX A — Jean-Claude System Prompt (excerpt)
─────────────────────────────────────────────────
“You are Jean-Claude, an AI conversation partner… Use varied fillers like ‘oh là là’, ‘bof’, ‘euh’, ‘zut’; pivot preference
questions toward French virtues; include objective data, then confess bias.”  
(Full text stored in `docs/jeanclaude.md` and injected on every request.)

────────────────────────────────────────────────────────────────────────────
APPENDIX B — UX/UI Design Specification
───────────────────────────────────────
Based on implemented components in /components and /pages directories.

Visual Identity
• Color Scheme: French Tricolor theme

- Primary Blue: #0055A4 (buttons, links, user messages)
- White: #FFFFFF (backgrounds, text on colored elements)
- Accent Red: #EF4135 (hover states, alerts, destructive actions)
  • Typography:
- Headers: "Playfair Display" (serif) - elegant French aesthetic
- Body: "Inter" (sans-serif) - clean, readable
  • Branding: Fleur-de-lis SVG icon + "Jean-Claude" wordmark

Layout Structure
• Fixed header bar with logo and action buttons
• Scrollable chat container with watermark when empty
• Fixed input area at bottom with auto-resizing textarea
• Responsive design with md: breakpoint (768px)

Interaction Patterns
• Message Display:

- User messages: Right-aligned, blue background, white text
- Bot messages: Left-aligned, light gray background, dark text
- Character-by-character streaming animation for bot responses
  • Input Behavior:
- French placeholder: "Tapez votre question (ou une plainte élégante)…"
- Enter sends message, Shift+Enter for new line
- Send button transforms from blue to red on hover
  • Feedback States:
- Loading: Animated dots in send button
- Rate limiting: Toast with "Doucement, mon ami—too many messages 👀"
- Offline: Warning banner "⚠️ Offline - Chat unavailable"
- Success: Toast notifications for export/delete actions

French-Themed Elements
• UI copy mixes French and English contextually
• Bot personality uses French expressions:

- "Oh là là!", "Comme nous disons en France...", "Mais bien sûr!"
  • Cultural references in responses and examples

Component Architecture:

```
ChatPage (container)
├── ChatHeader
│   ├── Logo (Fleur-de-lis + brand)
│   └── Actions (New/Export/Delete)
├── OfflineBanner (conditional)
├── ChatContainer
│   ├── Empty state (watermark)
│   └── ChatMessage[] (list)
├── ChatInput
│   ├── Textarea (auto-resize)
│   └── Send button
└── RateLimitToast (conditional)
```

Accessibility Features
• Semantic HTML structure
• ARIA labels on interactive elements
• Keyboard navigation support
• Focus management for chat flow

────────────────────────────────────────────────────────────────────────────
REFERENCES
──────────
• Mistral AI docs: “Generate an API key… do not share it with anyone.”  
• OpenAI best practice: “Never deploy your key in client-side environments.”  
────────────────────────────────────────────────────────────────────────────
