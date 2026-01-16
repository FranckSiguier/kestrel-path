import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, organization } from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { db } from "@/db";
import { account, rateLimit, session, user, verification } from "@/db/schema";
import { sendResetPassword } from "./email/email";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: {
      user,
      session,
      account,
      verification,
      rateLimit,
    },
  }),
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      await sendResetPassword(user.email, url);
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },
  rateLimit: {
    store: "database",
    maxRequests: 100,
    window: 60, // 1 minute
    customRules: {
      "/home/test": {
        window: 10,
        max: 3,
      },
    },
  },
  // Probably not needed because we will be using invites only
  // emailVerification: {
  //   sendVerificationEmail: async ({ user, url }) => {
  //     await sendEmailVerification(user.email, url);
  //   },
  // },
  plugins: [
    admin(),
    tanstackStartCookies(),
    organization({
      allowUserToCreateOrganization: ({ user }) => {
        return user.role === "admin";
      },
    }),
  ],
});
