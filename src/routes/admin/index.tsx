import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/")({
  component: RouteComponent,
  beforeLoad: () => {
    return {
      isAdmin: true,
    };
  },
});

function RouteComponent() {
  return <Outlet />;
}
