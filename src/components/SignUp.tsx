import { IconLoader2, IconUpload, IconX } from "@tabler/icons-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
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

const canUserSignUp = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      email: z.string(),
      token: z.string(),
      orgId: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    return true;
  });

interface SignUpProps {
  token?: string;
  initialEmail?: string;
  orgId?: string;
}

export default function SignUp({
  token = "",
  initialEmail = "",
  orgId = "",
}: SignUpProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  // const [image, setImage] = useState<File | null>(null);
  // const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = e.target.files?.[0];
  //   if (file) {
  //     setImage(file);
  //     const reader = new FileReader();
  //     reader.onloadend = () => {
  //       setImagePreview(reader.result as string);
  //     };
  //     reader.readAsDataURL(file);
  //   }
  // };

  const handleSignUp = async () => {
    // if (!token || !orgId) {
    //   toast.error(
    //     "Missing invite token or organization. Please use the link from your invite email.",
    //   );
    //   return;
    // }

    setLoading(true);

    const canSignUp = await canUserSignUp({ data: { email, token, orgId } });

    if (!canSignUp) {
      toast.error("Invalid or expired invite token");
      setLoading(false);
      return;
    }

    await authClient.signUp.email(
      {
        email,
        password,
        name: `${firstName} ${lastName}`,
        // image: image ? await convertImageToBase64(image) : undefined,
      },
      {
        onSuccess: async (user) => {
          console.log({ user });
          setLoading(false);
          await navigate({ to: "/sign-in" });
        },
        onError: async (ctx) => {
          setLoading(false);
          toast.error(ctx.error.message);
        },
      },
    );
  };

  return (
    <Container>
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Sign Up</CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Enter your information to create an account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="first-name">First name</Label>
                <Input
                  id="first-name"
                  placeholder="Max"
                  required
                  onChange={(e) => {
                    setFirstName(e.target.value);
                  }}
                  value={firstName}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="last-name">Last name</Label>
                <Input
                  id="last-name"
                  placeholder="Robinson"
                  required
                  onChange={(e) => {
                    setLastName(e.target.value);
                  }}
                  value={lastName}
                />
              </div>
            </div>
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
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="Password"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Confirm Password</Label>
              <Input
                id="password_confirmation"
                type="password"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                autoComplete="new-password"
                placeholder="Confirm Password"
              />
            </div>
            {/* <div className="grid gap-2">
              <Label htmlFor="image">Profile Image (optional)</Label>
              <div className="flex items-center gap-3">
                {imagePreview ? (
                  <div className="relative w-14 h-14 rounded-md overflow-hidden border border-neutral-700">
                    <img
                      src={imagePreview}
                      alt="Profile preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-md border border-dashed border-neutral-600 flex items-center justify-center bg-neutral-800/50">
                    <IconUpload className="w-5 h-5 text-neutral-500" />
                  </div>
                )}
                <div className="flex items-center gap-2 flex-1">
                  <label
                    htmlFor="image"
                    className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 transition-colors"
                  >
                    <IconUpload className="w-4 h-4" />
                    {imagePreview ? "Change image" : "Choose image"}
                  </label>
                  <input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="sr-only"
                  />
                  {imagePreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setImage(null);
                        setImagePreview(null);
                      }}
                      className="p-2 rounded-md hover:bg-neutral-800 transition-colors text-neutral-400 hover:text-neutral-200"
                    >
                      <IconX className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div> */}
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
              onClick={handleSignUp}
              onKeyUpCapture={(e) => {
                if (e.key === "Enter") {
                  handleSignUp();
                }
              }}
            >
              {loading ? (
                <IconLoader2 size={16} className="animate-spin" />
              ) : (
                "Create an account"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <p className="text-center mt-4 text-xs text-neutral-600 dark:text-neutral-400">
        Already have an account?{" "}
        <Link
          to="/sign-in"
          className="text-orange-400 hover:text-orange-500 dark:text-orange-300 dark:hover:text-orange-200 underline"
        >
          Sign in
        </Link>
      </p>
    </Container>
  );
}
