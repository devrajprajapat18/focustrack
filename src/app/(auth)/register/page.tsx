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
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Registration failed");
      }

      toast.success("Account created");
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Registration failed");
    }
  };

  return (
    <main className="grid min-h-screen place-items-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-3xl">Create FocusTrack Account</CardTitle>
          <CardDescription>Start building momentum every day.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <Input placeholder="Your name" {...register("name")} />
              {errors.name && <p className="mt-1 text-xs text-error">{errors.name.message}</p>}
            </div>
            <div>
              <Input type="email" placeholder="you@example.com" {...register("email")} />
              {errors.email && <p className="mt-1 text-xs text-error">{errors.email.message}</p>}
            </div>
            <div>
              <Input type="password" placeholder="Password" {...register("password")} />
              {errors.password && <p className="mt-1 text-xs text-error">{errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Creating account..." : "Register"}
            </Button>
          </form>

          <p className="mt-4 text-sm text-text-secondary">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-primary">
              Login
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
