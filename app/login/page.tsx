"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createLogger } from "@/lib/logger";
import { Button } from "@/components/ui/button";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { RiotSignInButton } from "@/components/RiotSignInButton";
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
import { useGoogleClientId } from "@/lib/hooks/use-google-client-id";

const logger = createLogger("login");

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
  const searchParams = useSearchParams();

  // Redirect authenticated users away from login
  useEffect(() => {
    if (user) {
      router.replace("/");
    }
  }, [user, router]);

  const { t } = useI18n();

  // Handle RSO error query params
  useEffect(() => {
    const error = searchParams.get("error");
    if (!error) return;
    const errorMessages: Record<string, string> = {
      riot_denied: t("login.riotDenied"),
      riot_error: t("login.riotError"),
      riot_not_configured: t("login.riotNotConfigured"),
    };
    const message = errorMessages[error];
    if (message) {
      toast.error(message);
      // Clean URL without reloading
      router.replace("/login", { scroll: false });
    }
  }, [searchParams, t, router]);

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
      logger.error("Login error", error as Error);
      toast.error(t("login.anErrorOccurred"), {
        description: "Vérifiez votre connexion internet et réessayez.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAccessToken = async (accessToken: string) => {
    setIsGoogleLoading(true);
    try {
      const response = await fetch("/api/auth/google-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken }),
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok || !result?.user) {
        toast.error(result?.error ?? t("login.googleError"));
        return;
      }

      login(result.user);
      toast.success(t("login.connectionSuccessful"));
      router.push("/");
    } catch (error) {
      logger.error("Google login error", error as Error);
      toast.error(t("login.googleError"));
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center font-sans">
      <main className="w-full max-w-md px-4">
        <Card>
          <CardHeader className="text-center">
            <Image
              src="/logo.webp"
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
                          autoComplete="email"
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
                          autoComplete="current-password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex items-center text-sm">
                  <div className="flex items-center gap-2">
                    <Checkbox id="remember-me" />
                    <label
                      htmlFor="remember-me"
                      className="text-muted-foreground cursor-pointer select-none"
                    >
                      {t("login.rememberMe")}
                    </label>
                  </div>
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
            <div className="flex w-full flex-col gap-2">
              {isGoogleConfigLoading ? (
                <Button variant="outline" className="w-full" disabled>
                  {t("common.loading")}
                </Button>
              ) : isGoogleConfigured && googleClientId ? (
                <GoogleSignInButton
                  clientId={googleClientId}
                  onAccessToken={handleGoogleAccessToken}
                  text="Google"
                  disabled={isGoogleLoading}
                />
              ) : (
                <Button variant="outline" className="w-full" disabled>
                  Google ({t("login.googleNotConfigured")})
                </Button>
              )}
              <RiotSignInButton />
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
