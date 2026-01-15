import { adminClient, organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { toast } from "sonner";

const baseURL = import.meta.env.BETTER_AUTH_URL;

export const authClient = createAuthClient({
  baseURL,
  plugins: [adminClient(), organizationClient()],
  fetchOptions: {
    onError: async (context) => {
      const { response } = context;
      if (response.status === 429) {
        const retryAfter = response.headers.get("X-Retry-After");
        toast.error("Too many requests", {
          description: retryAfter
            ? `Please wait ${retryAfter} seconds before trying again.`
            : "Please slow down and try again later.",
        });
      }
    },
  },
});
