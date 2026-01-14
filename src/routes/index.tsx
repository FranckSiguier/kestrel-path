import { IconLogout } from "@tabler/icons-react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { authMiddleware } from "@/middleware/auth";
export const Route = createFileRoute("/")({
  component: App,
  server: { middleware: [authMiddleware] },
});

function App() {
  const router = useRouter();

  const handleSignOut = async () => {
    await authClient.signOut();
    router.navigate({ to: "/sign-in" });
  };

  return (
    <div>
      <h1>Hello World</h1>
      <Button type="button" variant="outline" onClick={handleSignOut}>
        <IconLogout size={16} className="mr-2" />
        Sign Out
      </Button>
    </div>
  );
}
