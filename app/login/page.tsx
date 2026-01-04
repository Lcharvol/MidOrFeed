"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  GoogleOAuthProvider,
  GoogleLogin,
  type CredentialResponse,
} from "@react-oauth/google";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";
import { Loader2Icon } from "lucide-react";
import { useGoogleClientId } from "@/lib/hooks/use-google-client-id";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const router = useRouter();
  const { login, user } = useAuth();
  const {
    clientId: googleClientId,
    isConfigured: isGoogleConfigured,
    isLoading: isGoogleConfigLoading,
  } = useGoogleClientId();
  // Redirect authenticated users away from login
  useEffect(() => {
    if (user) {
      router.replace("/");
    }
  }, [user, router]);

  const { t } = useI18n();

  // Create schema dynamically based on locale
  const loginSchema = z.object({
    email: z.string().email(t("login.invalidEmail")),
    password: z.string().min(1, t("login.passwordRequired")),
  });

  type LoginFormValues = z.infer<typeof loginSchema>;

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: "include", // Important: include cookies
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || t("login.connectionError"));
        return;
      }

      // Store user data (token is now in HTTP-only cookie set by server)
      login(result.user);
      toast.success(t("login.connectionSuccessful"));
      router.push("/");
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(t("login.anErrorOccurred"), {
        description: "Vérifiez votre connexion internet et réessayez.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (
    credentialResponse: CredentialResponse
  ) => {
    if (!credentialResponse.credential) {
      toast.error("Connexion Google impossible");
      return;
    }

    setIsGoogleLoading(true);
    try {
      const response = await fetch("/api/auth/google-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: credentialResponse.credential }),
        credentials: "include", // Important: include cookies
      });

      const result = await response.json();

      if (!response.ok || !result?.user) {
        toast.error(result?.error ?? "Connexion Google impossible");
        return;
      }

      // Store user data (token is now in HTTP-only cookie set by server)
      login(result.user);
      toast.success(t("login.connectionSuccessful"));
      router.push("/");
    } catch (error) {
      console.error("Google login error:", error);
      toast.error("Connexion Google impossible");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleError = () => {
    toast.error("Connexion Google impossible");
  };

  return (
    <div className="flex min-h-screen items-center justify-center font-sans">
      <main className="w-full max-w-md px-4">
        <Card>
          <CardHeader className="text-center">
            <Image
              src="/logo.png"
              alt="MidOrFeed"
              width={200}
              height={50}
              className="m-auto"
              priority
            />
            <CardDescription className="mt-4">
              {t("login.enterCredentials")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("login.email")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("login.emailPlaceholder")}
                          type="email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("login.password")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("login.passwordPlaceholder")}
                          type="password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Checkbox id="remember-me" />
                    <label
                      htmlFor="remember-me"
                      className="text-muted-foreground cursor-pointer select-none"
                    >
                      {t("login.rememberMe")}
                    </label>
                  </div>
                  <a href="#" className="text-primary hover:underline">
                    {t("login.forgotPassword")}
                  </a>
                </div>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              className="w-full"
              size="lg"
              onClick={form.handleSubmit(onSubmit)}
              disabled={isLoading}
            >
              {isLoading ? t("login.connecting") : t("login.submit")}
            </Button>
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  {t("login.orContinueWith")}
                </span>
              </div>
            </div>
            <div className="w-full">
              {isGoogleConfigLoading ? (
                <Button variant="outline" className="w-full" disabled>
                  Chargement...
                </Button>
              ) : isGoogleConfigured && googleClientId ? (
                <GoogleOAuthProvider clientId={googleClientId}>
                  <div className="relative flex w-full justify-center">
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={handleGoogleError}
                      theme="outline"
                      shape="rectangular"
                      text="signin_with"
                      type="standard"
                      logo_alignment="left"
                      size="large"
                      width="100%"
                      locale="fr"
                      auto_select={false}
                      useOneTap={false}
                    />
                    {isGoogleLoading ? (
                      <div className="absolute inset-0 flex items-center justify-center rounded-md bg-background/70">
                        <Loader2Icon className="size-5 animate-spin text-primary" />
                      </div>
                    ) : null}
                  </div>
                </GoogleOAuthProvider>
              ) : (
                <Button variant="outline" className="w-full" disabled>
                  Google (non configuré)
                </Button>
              )}
            </div>
            <p className="text-center text-sm text-muted-foreground">
              {t("login.noAccount")}{" "}
              <a href="/signup" className="text-primary hover:underline">
                {t("login.signup")}
              </a>
            </p>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
