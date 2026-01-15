import { IconMenu2 } from "@tabler/icons-react";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppSidebar } from "@/components/Sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { authMiddleware } from "@/middleware/auth";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
  server: { middleware: [authMiddleware] },
  beforeLoad: ({ context }) => {
    const isAdmin = context.session?.user?.role === "admin";
    return { isAdmin };
  },
});

function AuthenticatedLayout() {
  const { isAdmin } = Route.useRouteContext();
  return (
    <SidebarProvider>
      <AppSidebar isAdmin={isAdmin} />
      <main className="flex-1">
        <SidebarTrigger className="md:hidden" />
        <Outlet />
      </main>
    </SidebarProvider>
  );
}
