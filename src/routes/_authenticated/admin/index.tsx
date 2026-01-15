import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminLayout,
  beforeLoad: ({ context }) => {
    const isAdmin = context.session?.user?.role === "admin";

    if (!isAdmin) {
      throw redirect({ to: "/" });
    }
  },
});

function AdminLayout() {
  return <Outlet />;
}
