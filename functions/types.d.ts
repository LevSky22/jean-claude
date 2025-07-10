/**
 * Type definitions for Cloudflare Pages Functions
 */

declare global {
  type PagesFunction<Env = any> = (context: EventContext<Env, any, any>) => Response | Promise<Response>

  interface EventContext<Env = any, P = any, Data = any> {
    request: Request
    env: Env
    params: P
    data: Data
    next: () => Promise<Response>
    waitUntil: (promise: Promise<any>) => void
  }
}

export {};