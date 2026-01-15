import {
  IconChevronDown,
  IconHome,
  IconLogout,
  IconMail,
  IconPlus,
} from "@tabler/icons-react";
import { useRouter } from "@tanstack/react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export function AppSidebar({ isAdmin }: { isAdmin: boolean }) {
  const router = useRouter();
  const handleSignOut = async () => {
    await authClient.signOut();
    router.navigate({ to: "/sign-in" });
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger className="ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent active:text-sidebar-accent-foreground flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-hidden focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0">
                Select Workspace
                <IconChevronDown className="ml-auto" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[--radix-popper-anchor-width]">
                <DropdownMenuItem>
                  <span>Acme Inc</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <span>Acme Corp.</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenuButton onClick={() => router.navigate({ to: "/" })}>
              <IconHome size={16} />
              Home
            </SidebarMenuButton>
          </SidebarGroupContent>
        </SidebarGroup>
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            {/* <SidebarGroupAction>
              <IconPlus /> <span className="sr-only">Add Project</span>
            </SidebarGroupAction> */}

            <SidebarGroupContent>
              <SidebarMenuButton
                onClick={() => router.navigate({ to: "/admin/organization" })}
              >
                <IconPlus size={16} />
                Create Organization
              </SidebarMenuButton>
              <SidebarMenuButton
                onClick={() => router.navigate({ to: "/admin/emails" })}
              >
                <IconMail size={16} />
                Email Templates
              </SidebarMenuButton>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenuButton onClick={handleSignOut}>
          <IconLogout size={16} />
          Sign Out
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}

export function WorkspaceDropdown() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-hidden focus-visible:ring-2">
        Select Workspace
      </DropdownMenuTrigger>
    </DropdownMenu>
  );
}
