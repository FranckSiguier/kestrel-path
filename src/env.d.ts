/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Client-side environment variables
  readonly VITE_CONVEX_URL: string
  readonly VITE_CONVEX_SITE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Server-side environment variables
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      readonly CONVEX_DEPLOYMENT: string
      readonly NODE_ENV: 'development' | 'production' | 'test'
    }
  }
}

export {}
