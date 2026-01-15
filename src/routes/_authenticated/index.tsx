import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/")({
  component: HomePage,
});

function HomePage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Welcome to Kestrel Path</h1>
    </div>
  );
}
