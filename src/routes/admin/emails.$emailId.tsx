import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/emails/$emailId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { emailId } = Route.useParams();
  return <div>Email {emailId}</div>;
}
