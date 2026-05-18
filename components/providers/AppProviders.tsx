"use client";

import { ToastProvider } from "@/components/providers/ToastProvider";
import { PushRegistration } from "@/components/providers/PushRegistration";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <PushRegistration />
      {children}
    </ToastProvider>
  );
}
