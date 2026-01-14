import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import ResetPassword from "@/components/ResetPassword";

export const Route = createFileRoute("/reset-password")({
  validateSearch: z.object({
    token: z.string(),
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { token } = Route.useSearch();
  return <ResetPassword token={token} />;
}
