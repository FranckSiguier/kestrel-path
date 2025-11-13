import { v } from 'convex/values'
import { query } from './_generated/server'

export const getTranscripts = query({
  args: {
    userId: v.string(),
  },
  returns: v.array(
    v.object({
      _id: v.id('transcripts'),
      userId: v.string(),
      content: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query('transcripts')
      .withIndex('by_userId', (q) => q.eq('userId', args.userId))
      .collect()
  },
})
