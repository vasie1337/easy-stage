"use client";

import type { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";

type Props = {
  children: ReactNode;
};

export function AuthSessionProvider({ children }: Props) {
  return <SessionProvider>{children}</SessionProvider>;
}
