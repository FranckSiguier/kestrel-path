import { auth } from "@kestrel-path/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import AIWorkspace from "./workspace";

export default async function AIPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  return <AIWorkspace />;
}
