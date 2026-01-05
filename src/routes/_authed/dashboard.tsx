import { convexQuery } from '@convex-dev/react-query'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Toaster } from 'sonner'
import { SignOutButton } from '~/components/client'
import {
  AppContainer,
  AppHeader,
  AppNav,
  UserProfile,
} from '~/components/server'
import { authClient } from '~/lib/auth-client'
import { api } from '../../../convex/_generated/api'

export const Route = createFileRoute('/_authed/dashboard')({
  component: DashboardComponent,
})

function DashboardComponent() {
  return (
    <AppContainer>
      <Header />
      <Toaster />
    </AppContainer>
  )
}

function Header() {
  const { data: currentUser } = useSuspenseQuery(
    convexQuery(api.auth.getCurrentUser, {}),
  )
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await authClient.signOut()
    void navigate({ to: '/sign-in' })
  }

  return (
    <AppHeader>
      <UserProfile user={currentUser} />
      <AppNav>
        <SignOutButton onClick={handleSignOut} />
      </AppNav>
    </AppHeader>
  )
}
