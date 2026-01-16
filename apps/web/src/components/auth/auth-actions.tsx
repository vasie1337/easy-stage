"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

type Props = {
  isAuthed: boolean;
};

export function AuthActions({ isAuthed }: Props) {
  if (isAuthed) {
    return (
      <Button variant="secondary" onClick={() => signOut({ callbackUrl: "/" })}>
        Sign out
      </Button>
    );
  }

  return (
    <Button asChild>
      <Link href="/signin">Sign in</Link>
    </Button>
  );
}
