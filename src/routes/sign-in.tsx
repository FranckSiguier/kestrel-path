import { createFileRoute, redirect } from "@tanstack/react-router";
import { SignIn } from "@/components/SignIn";

export const Route = createFileRoute("/sign-in")({
  beforeLoad: async ({ context: { session } }) => {
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
  return <SignIn />;
}
