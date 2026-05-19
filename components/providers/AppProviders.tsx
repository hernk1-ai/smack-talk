"use client";

import { ToastProvider } from "@/components/providers/ToastProvider";
import { PushRegistration } from "@/components/providers/PushRegistration";
import { AppShellPolish } from "@/components/providers/AppShellPolish";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <PushRegistration />
      <AppShellPolish>{children}</AppShellPolish>
    </ToastProvider>
  );
}
