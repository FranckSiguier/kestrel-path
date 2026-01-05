import {
  type AuthFunctions,
  createClient,
  type GenericCtx,
} from '@convex-dev/better-auth'
import { convex } from '@convex-dev/better-auth/plugins'
import { requireActionCtx } from '@convex-dev/better-auth/utils'
import { betterAuth } from 'better-auth'
import {
  admin,
  anonymous,
  emailOTP,
  twoFactor,
  organization,
} from 'better-auth/plugins'
import { components, internal } from './_generated/api'
import { type DataModel } from './_generated/dataModel'
import { query } from './_generated/server'
import betterAuthSchema from './betterAuth/schema'
import {
  sendEmailVerification,
  sendOTPVerification,
  sendResetPassword,
} from './email'

// This implementation is upgraded to 0.8 Local Install with no
// database migration required. It continues the pattern of writing
// userId to the Better Auth users table and maintaining a separate
// users table for application data.

const siteUrl = process.env.SITE_URL

const authFunctions: AuthFunctions = internal.auth

export const authComponent = createClient<DataModel, typeof betterAuthSchema>(
  components.betterAuth as any,
  {
    authFunctions,
    triggers: {
      user: {
        onCreate: async (ctx, authUser) => {
          await ctx.db.insert('users', {
            authId: authUser._id,
            name: authUser.name,
            email: authUser.email,
            image: authUser.image ?? undefined,
          })
        },
        onUpdate: async (ctx, newUser, oldUser) => {
          const user = await ctx.db
            .query('users')
            .filter((q) => q.eq(q.field('authId'), oldUser._id))
            .first()
          if (user) {
            await ctx.db.patch(user._id, {
              name: newUser.name,
              email: newUser.email,
              image: newUser.image ?? undefined,
            })
          }
        },
        onDelete: async (ctx, authUser) => {
          const user = await ctx.db
            .query('users')
            .filter((q) => q.eq(q.field('authId'), authUser._id))
            .first()
          if (user) {
            await ctx.db.delete(user._id)
          }
        },
      },
    },
  },
)

export const { onCreate, onUpdate, onDelete } = authComponent.triggersApi()

export const createAuth = (
  ctx: GenericCtx<DataModel>,
  { optionsOnly } = { optionsOnly: false },
) =>
  betterAuth({
    baseURL: siteUrl,
    logger: {
      disabled: optionsOnly,
    },
    database: authComponent.adapter(ctx),
    account: {
      accountLinking: {
        enabled: true,
      },
    },
    emailVerification: {
      sendVerificationEmail: async ({ user, url }) => {
        await sendEmailVerification(requireActionCtx(ctx), {
          to: user.email,
          url,
        })
      },
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      sendResetPassword: async ({ user, url }) => {
        await sendResetPassword(requireActionCtx(ctx), {
          to: user.email,
          url,
        })
      },
    },
    user: {
      deleteUser: {
        enabled: true,
      },
    },
    plugins: [
      emailOTP({
        async sendVerificationOTP({ email, otp }) {
          await sendOTPVerification(requireActionCtx(ctx), {
            to: email,
            code: otp,
          })
        },
      }),
      twoFactor(),
      organization(),
      anonymous(),
      admin(),
      convex(),
    ],
  })

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity || !identity.email) {
      return identity
    }

    // Get the full user data from the users table, which includes the image
    // Query by email since it's unique and reliable
    const user = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', identity.email!))
      .first()

    if (!user) {
      return identity
    }

    // Return the identity with the image from the users table
    return {
      ...identity,
      image: user.image ?? identity.image,
    }
  },
})
