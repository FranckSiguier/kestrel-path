import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: ({ context }) => {
    // Redirect based on authentication state
    if (context.userId) {
      throw redirect({ to: '/dashboard' })
    } else {
      throw redirect({ to: '/sign-in' })
    }
  },
})
