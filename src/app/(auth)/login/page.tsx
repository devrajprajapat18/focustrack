"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Login failed");
      }

      toast.success("Welcome back!");
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login failed");
    }
  };

  return (
    <main className="grid min-h-screen place-items-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-3xl">FocusTrack Login</CardTitle>
          <CardDescription>Continue your productivity streak.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <Input type="email" placeholder="you@example.com" {...register("email")} />
              {errors.email && <p className="mt-1 text-xs text-error">{errors.email.message}</p>}
            </div>
            <div>
              <Input type="password" placeholder="Password" {...register("password")} />
              {errors.password && <p className="mt-1 text-xs text-error">{errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Login"}
            </Button>
          </form>

          <p className="mt-4 text-sm text-text-secondary">
            New to FocusTrack?{" "}
            <Link href="/register" className="font-semibold text-primary">
              Create account
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
