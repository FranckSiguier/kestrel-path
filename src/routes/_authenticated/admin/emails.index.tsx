import { render } from "@react-email/components";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import InviteEmail from "@/lib/email/templates/inviteEmail";
import ResetPasswordEmail from "@/lib/email/templates/resetPasswordEmail";
import VerifyEmail from "@/lib/email/templates/verifyEmail";

export const Route = createFileRoute("/_authenticated/admin/emails/")({
  component: RouteComponent,
});

const EMAIL_TEMPLATES = {
  verify: {
    label: "Verify Email",
    element: <VerifyEmail url="https://example.com/verify?token=abc123" />,
  },
  reset: {
    label: "Reset Password",
    element: (
      <ResetPasswordEmail url="https://example.com/reset?token=xyz789" />
    ),
  },
  invite: {
    label: "Organization Invite",
    element: (
      <InviteEmail
        url="https://example.com/invite?token=inv456"
        organizationName="Podium"
      />
    ),
  },
} as const;

type TemplateKey = keyof typeof EMAIL_TEMPLATES;

function RouteComponent() {
  const [selected, setSelected] = useState<TemplateKey>("verify");
  const [html, setHtml] = useState<string>("");

  useEffect(() => {
    const renderEmail = async () => {
      const rendered = await render(EMAIL_TEMPLATES[selected].element);
      setHtml(rendered);
    };
    renderEmail();
  }, [selected]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold">Email Templates</h1>
        <Select
          value={selected}
          onValueChange={(v) => setSelected(v as TemplateKey)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(EMAIL_TEMPLATES).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <iframe
        title="Email Preview"
        srcDoc={html}
        className="w-full h-[600px] bg-white rounded"
      />
    </div>
  );
}
