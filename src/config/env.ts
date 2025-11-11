// src/config/env.ts
import { z } from 'zod'

const envSchema = z.object({
  CONVEX_DEPLOYMENT: z.string(),
  NODE_ENV: z.enum(['development', 'production', 'test']),
  SITE_URL: z.string(),
  AUTH_RESEND_KEY: z.string(),
  OPENAI_API_KEY: z.string(),
})

const clientEnvSchema = z.object({
  VITE_CONVEX_URL: z.string(),
  VITE_CONVEX_SITE_URL: z.string(),
})

// Validate server environment
export const serverEnv = envSchema.parse(process.env)

// Validate client environment
export const clientEnv = clientEnvSchema.parse(import.meta.env)
