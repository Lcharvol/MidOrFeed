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
  CardTitle,
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
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n-context";
import { useAuth } from "@/lib/auth-context";
import { Loader2Icon } from "lucide-react";
import { useGoogleClientId } from "@/lib/hooks/use-google-client-id";

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const router = useRouter();
  const { t } = useI18n();
  const { user, login } = useAuth();
  const {
    clientId: googleClientId,
    isConfigured: isGoogleConfigured,
    isLoading: isGoogleConfigLoading,
  } = useGoogleClientId();

  // Redirect authenticated users away from signup
  useEffect(() => {
    if (user) {
      router.replace("/");
    }
  }, [user, router]);

  const signupSchema = z
    .object({
      name: z.string().min(2, t("signup.nameMinCharacters")),
      email: z.string().email(t("signup.invalidEmail")),
      password: z.string().min(8, t("signup.passwordMinCharacters")),
      confirmPassword: z.string(),
      terms: z.boolean().refine((val) => val === true, {
        message: t("signup.mustAcceptConditions"),
      }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("signup.passwordsDoNotMatch"),
      path: ["confirmPassword"],
    });

  type SignupFormValues = z.infer<typeof signupSchema>;

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
      });

      const result = await response.json();

      if (!response.ok || !result?.user) {
        toast.error(result?.error ?? "Connexion Google impossible");
        return;
      }

      login(result.user);
      toast.success(t("login.connectionSuccessful"));
      router.push("/");
    } catch (error) {
      console.error("Google signup error:", error);
      toast.error("Connexion Google impossible");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleError = () => {
    toast.error("Connexion Google impossible");
  };

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      terms: false,
    },
  });

  const onSubmit = async (data: SignupFormValues) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          confirmPassword: data.confirmPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.details && Array.isArray(result.details)) {
          result.details.forEach((detail: { message?: string }) => {
            toast.error(detail.message || t("signup.validationError"));
          });
        } else {
          toast.error(result.error || t("signup.errorAccountCreation"));
        }
        return;
      }

      toast.success(t("signup.success"));
      // Rediriger vers la page de connexion
      router.push("/login");
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(t("signup.error"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center font-sans">
      <main className="w-full max-w-md px-4">
        <Card>
          <CardHeader className="text-center">
            <Image
              src="/logo.png"
              alt="MidOrFeed"
              width={100}
              height={50}
              className="m-auto"
              priority
            />
            <CardTitle className="text-2xl">{t("signup.title")}</CardTitle>
            <CardDescription>{t("signup.fillInfo")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("signup.name")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("signup.namePlaceholder")}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("signup.email")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("signup.emailPlaceholder")}
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
                      <FormLabel>{t("signup.password")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("signup.passwordPlaceholder")}
                          type="password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("signup.confirmPassword")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("signup.passwordPlaceholder")}
                          type="password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="terms"
                  render={({ field }) => (
                    <FormItem className="flex items-start gap-2 text-sm">
                      <FormControl>
                        <input
                          type="checkbox"
                          className="mt-0.5 rounded border-gray-300"
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                        />
                      </FormControl>
                      <div className="text-muted-foreground">
                        <label>
                          {t("signup.acceptTerms")}{" "}
                          <a href="#" className="text-primary hover:underline">
                            {t("signup.termsOfUse")}
                          </a>{" "}
                          {t("signup.and")}{" "}
                          <a href="#" className="text-primary hover:underline">
                            {t("signup.privacyPolicy")}
                          </a>
                        </label>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
              {isLoading ? t("signup.creating") : t("signup.submit")}
            </Button>
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  {t("signup.orContinueWith")}
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
              {t("signup.hasAccount")}{" "}
              <a href="/login" className="text-primary hover:underline">
                {t("signup.login")}
              </a>
            </p>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
