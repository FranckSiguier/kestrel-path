import { headers } from "next/headers";

export default async function Home() {
  const requestHeaders = await headers();
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const baseUrl = host ? `${protocol}://${host}` : "http://localhost:3001";

  const response = await fetch(`${baseUrl}/api/status`, { cache: "no-store" });
  const status = await response.text();

  return (
    <div className="container mx-auto max-w-3xl px-4 py-2">
      <div className="grid gap-6">
        <section className="rounded-lg border p-4">
          <h2 className="mb-2 font-medium">API Status {status === "OK" ? "✅" : "❌"}</h2>
        </section>
      </div>
    </div>
  );
}
