import { render } from "@react-email/components";
import { Resend } from "resend";
import ResetPasswordEmail from "./templates/resetPasswordEmail";
import VerifyEmail from "./templates/verifyEmail";

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (to: string, subject: string, html: string) => {
  await resend.emails.send({
    from: "Kestrel Path <noreply@updates.kestrelpath.com.au>",
    to,
    subject,
    html,
  });
};

export const sendEmailVerification = async (to: string, url: string) => {
  await sendEmail(
    to,
    "Verify your email address",
    await render(<VerifyEmail url={url} />),
  );
};

export const sendResetPassword = async (to: string, url: string) => {
  await sendEmail(
    to,
    "Reset your password",
    await render(<ResetPasswordEmail url={url} />),
  );
};
