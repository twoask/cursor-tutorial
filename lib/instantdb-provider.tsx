"use client";

import { ReactNode } from "react";

// InstantDB React doesn't require a Provider - hooks work directly
export function InstantDBProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

