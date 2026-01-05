import { createFileRoute, redirect } from '@tanstack/react-router'
import SignUp from '~/components/SignUp'

export const Route = createFileRoute('/sign-up')({
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
  return <SignUp />
}
