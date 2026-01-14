import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/reset-password/message")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      <h1>Check your email for a link to reset your password</h1>
      <p>
        If you don't see the email, check your spam folder or request a new
        link.
      </p>
    </div>
  );
}
