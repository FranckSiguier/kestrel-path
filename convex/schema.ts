import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export const tables = {
  user: defineTable({
    name: v.string(),
    email: v.string(),
    emailVerified: v.boolean(),
    image: v.optional(v.union(v.null(), v.string())),
    createdAt: v.number(),
    updatedAt: v.number(),
    twoFactorEnabled: v.optional(v.union(v.null(), v.boolean())),
    isAnonymous: v.optional(v.union(v.null(), v.boolean())),
    userId: v.optional(v.union(v.null(), v.string())),
    foo: v.optional(v.union(v.null(), v.string())),
  })
    .index('email_name', ['email', 'name'])
    .index('name', ['name'])
    .index('userId', ['userId']),
  session: defineTable({
    expiresAt: v.number(),
    token: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    ipAddress: v.optional(v.union(v.null(), v.string())),
    userAgent: v.optional(v.union(v.null(), v.string())),
    userId: v.string(),
  })
    .index('by_expiresAt', ['expiresAt'])
    .index('by_expiresAt_userId', ['expiresAt', 'userId'])
    .index('by_token', ['token'])
    .index('by_userId', ['userId']),
  account: defineTable({
    accountId: v.string(),
    providerId: v.string(),
    userId: v.string(),
    accessToken: v.optional(v.union(v.null(), v.string())),
    refreshToken: v.optional(v.union(v.null(), v.string())),
    idToken: v.optional(v.union(v.null(), v.string())),
    accessTokenExpiresAt: v.optional(v.union(v.null(), v.number())),
    refreshTokenExpiresAt: v.optional(v.union(v.null(), v.number())),
    scope: v.optional(v.union(v.null(), v.string())),
    password: v.optional(v.union(v.null(), v.string())),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_accountId', ['accountId'])
    .index('by_accountId_providerId', ['accountId', 'providerId'])
    .index('by_providerId_userId', ['providerId', 'userId'])
    .index('by_userId', ['userId']),
  verification: defineTable({
    identifier: v.string(),
    value: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_expiresAt', ['expiresAt'])
    .index('by_identifier', ['identifier']),
  twoFactor: defineTable({
    secret: v.string(),
    backupCodes: v.string(),
    userId: v.string(),
  }).index('by_userId', ['userId']),
  jwks: defineTable({
    publicKey: v.string(),
    privateKey: v.string(),
    createdAt: v.number(),
  }),

  transcripts: defineTable({
    userId: v.string(),
    orgId: v.string(),
    content: v.string(),
    createdAt: v.number(),
  })
    .index('by_userId', ['userId'])
    .index('by_orgId', ['orgId'])
    .index('by_userId_orgId', ['userId', 'orgId']),

  orgs: defineTable({
    name: v.string(),
    createdAt: v.number(),
  }).index('name', ['name']),
}

const schema = defineSchema(tables)

export default schema
