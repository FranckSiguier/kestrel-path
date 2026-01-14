import { Button } from '~/components/ui/button'
import { IconLogout } from '@tabler/icons-react'

export function SignOutButton({ onClick }: { onClick: () => any }) {
  return (
    <Button variant="ghost" size="sm" onClick={onClick}>
      <IconLogout size={16} className="mr-2" />
      Sign Out
    </Button>
  )
}
