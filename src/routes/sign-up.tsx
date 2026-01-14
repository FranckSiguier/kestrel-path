import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import SignUp from "@/components/SignUp";

export const Route = createFileRoute("/sign-up")({
  validateSearch: z.object({
    token: z.string().optional(),
    email: z.string().optional(),
    orgId: z.string().optional(),
  }),
  beforeLoad: async ({ context: { session } }) => {
    // Redirect to dashboard if user is already authenticated
    if (session) {
      throw redirect({
        to: "/",
      });
    }
    return { session };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { token, email, orgId } = Route.useSearch();
  return <SignUp token={token} initialEmail={email} orgId={orgId} />;
}
