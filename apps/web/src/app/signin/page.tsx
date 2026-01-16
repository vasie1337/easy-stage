"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function SignInPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6">
      <div className="w-full space-y-6 rounded-xl border bg-card p-8 text-card-foreground">
        <div>
          <h1 className="text-2xl font-semibold">Sign in</h1>
          <p className="text-sm text-muted-foreground">
            Continue with your Google account.
          </p>
        </div>
        <Button className="w-full" onClick={() => signIn("google")}>
          Continue with Google
        </Button>
      </div>
    </main>
  );
}
