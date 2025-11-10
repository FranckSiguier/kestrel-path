import { createFileRoute } from '@tanstack/react-router'
import { SignIn } from '~/components/SignIn'

export const Route = createFileRoute('/sign-in')({
  component: RouteComponent,
})

function RouteComponent() {
  return <SignIn />
}
