import { createServerFn } from '@tanstack/react-start'
import { fetchMutation } from '~/lib/auth-server'
import { api } from '../../convex/_generated/api'
import { z } from 'zod'

export const updatePassword = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      currentPassword: z.string(),
      newPassword: z.string(),
    }),
  )
  .handler(async ({ data: { currentPassword, newPassword } }) => {
    await fetchMutation(api.users.updateUserPassword, {
      currentPassword,
      newPassword,
    })
  })
