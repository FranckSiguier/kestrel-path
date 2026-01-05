import { createFileRoute, redirect } from '@tanstack/react-router'
import { SignIn } from '~/components/SignIn'

export const Route = createFileRoute('/sign-in')({
  beforeLoad: async ({ context, search }) => {
    // Redirect to home if user is already authenticated
    if (context.userId) {
      throw redirect({
        to: (search as any).redirect || '/',
      })
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  return <SignIn />
}
