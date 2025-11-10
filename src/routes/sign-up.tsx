import { createFileRoute } from '@tanstack/react-router'
import { SignUp } from '~/components/SignUp'

export const Route = createFileRoute('/sign-up')({
  component: RouteComponent,
})

function RouteComponent() {
  return <SignUp />
}
