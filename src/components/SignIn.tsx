import { IconLoader2 } from "@tabler/icons-react";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { Container } from "./Container";

export const SignIn = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signInLoading, setSignInLoading] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleSignIn = async () => {
    const { data, error } = await authClient.signIn.email(
      {
        email,
        password,
      },
      {
        onRequest: () => {
          setSignInLoading(true);
        },
        onSuccess: async () => {
          setSignInLoading(false);
          await navigate({ to: "/" });
        },
        onError: (ctx) => {
          toast.error(ctx.error.message);
          setSignInLoading(false);
        },
      },
    );

    console.log({ data, error });
  };

  const handleResetPassword = async () => {
    if (!email) {
      toast.error("Please enter your email");
      return;
    }

    setForgotLoading(true);
    try {
      // Send reset password email
      await authClient.requestPasswordReset({
        email,
      });
      toast.success(
        "If you have an account with us, a reset password link has been sent to your email",
      );
    } catch {
      toast.error("Failed to send reset password link. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  // const handleGoogleSignIn = async () => {
  //   await authClient.signIn.social(
  //     {
  //       provider: "google",
  //     },
  //     {
  //       onRequest: () => {
  //         setOtpLoading(true);
  //       },
  //       onSuccess: () => {
  //         setOtpLoading(false);
  //       },
  //       onError: (ctx) => {
  //         setOtpLoading(false);
  //         alert(ctx.error.message);
  //       },
  //     },
  //   );
  // };

  return (
    <Container>
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Sign In</CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSignIn();
            }}
            className="grid gap-4"
          >
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                onChange={(e) => {
                  setEmail(e.target.value);
                }}
                value={email}
              />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Button
                  variant="link"
                  size="sm"
                  type="button"
                  onClick={handleResetPassword}
                  className="cursor-pointer"
                  disabled={forgotLoading}
                >
                  {forgotLoading ? (
                    <IconLoader2 size={14} className="animate-spin mr-1" />
                  ) : null}
                  Forgot your password?
                </Button>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="password"
                autoComplete="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Button type="submit" className="w-full" disabled={signInLoading}>
                Sign in with Password
              </Button>
            </div>

            {/* <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-neutral-800" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-card px-2 text-neutral-500">
                  or continue with
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full gap-2"
              disabled={otpLoading}
              onClick={handleGoogleSignIn}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="0.98em"
                height="1em"
                viewBox="0 0 256 262"
              >
                <path
                  fill="#4285F4"
                  d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622l38.755 30.023l2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
                />
                <path
                  fill="#34A853"
                  d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055c-34.523 0-63.824-22.773-74.269-54.25l-1.531.13l-40.298 31.187l-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
                />
                <path
                  fill="#FBBC05"
                  d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82c0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602z"
                />
                <path
                  fill="#EB4335"
                  d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0C79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
                />
              </svg>
              Sign in with Google
            </Button> */}
          </form>
        </CardContent>
      </Card>
    </Container>
  );
};
