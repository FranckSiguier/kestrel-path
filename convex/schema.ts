import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export const tables = {
  users: defineTable({
    authId: v.string(),
    name: v.string(),
    email: v.string(),
    image: v.optional(v.string()),
  }).index('by_email', ['email']),
}

const schema = defineSchema(tables)

export default schema
