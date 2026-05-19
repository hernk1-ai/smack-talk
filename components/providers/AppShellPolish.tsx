"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

function prefersReducedMotion() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function AppShellPolish({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hasMounted = useRef(false);
  const [showLaunch, setShowLaunch] = useState(true);
  const [showRouteTransition, setShowRouteTransition] = useState(false);
  const [isOffline, setIsOffline] = useState(() => {
    if (typeof navigator === "undefined") return false;
    return !navigator.onLine;
  });

  const reduceMotion = useMemo(() => prefersReducedMotion(), []);

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setShowLaunch(false);
    }, reduceMotion ? 120 : 360);
    return () => window.clearTimeout(timeout);
  }, [reduceMotion]);

  useEffect(() => {
    const isStandalone =
      (typeof window !== "undefined" && window.matchMedia?.("(display-mode: standalone)").matches) ||
      (typeof navigator !== "undefined" && Boolean((navigator as Navigator & { standalone?: boolean }).standalone));

    if (isStandalone) {
      document.documentElement.setAttribute("data-standalone", "true");
    } else {
      document.documentElement.removeAttribute("data-standalone");
    }

    return () => {
      document.documentElement.removeAttribute("data-standalone");
    };
  }, []);

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }

    setShowRouteTransition(true);
    const timeout = window.setTimeout(() => {
      setShowRouteTransition(false);
    }, reduceMotion ? 80 : 220);

    return () => window.clearTimeout(timeout);
  }, [pathname, reduceMotion]);

  return (
    <>
      <div className={showRouteTransition ? "app-route-transitioning" : "app-route-ready"}>{children}</div>

      {showLaunch ? (
        <div className="pointer-events-none fixed inset-0 z-[105] flex items-center justify-center bg-black/96">
          <div className="relative flex flex-col items-center gap-3">
            <div className="absolute -inset-8 rounded-full bg-[radial-gradient(circle,rgba(123,255,0,0.24)_0%,rgba(154,29,255,0.24)_36%,transparent_74%)] blur-2xl" />
            <Image src="/brand/lockt-icon.svg" alt="LOCKT" width={64} height={64} className="relative h-14 w-14 sm:h-16 sm:w-16" priority />
            <p className="relative text-xs font-black uppercase tracking-[0.2em] text-gray-300">Loading LOCKT</p>
          </div>
        </div>
      ) : null}

      {isOffline ? (
        <div className="fixed inset-x-0 bottom-24 z-[115] px-4 sm:bottom-6">
          <div className="mx-auto w-full max-w-md rounded-2xl border border-white/20 bg-black/92 px-4 py-3 shadow-[0_18px_36px_rgba(0,0,0,0.5)]">
            <p className="text-sm font-black uppercase tracking-[0.1em] text-white">You&rsquo;re offline</p>
            <p className="mt-1 text-sm font-semibold text-gray-300">
              LOCKT needs a connection to lock calls and check receipts.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-3 min-h-10 rounded-xl border border-lime-300/40 bg-lime-400/10 px-3 text-xs font-black uppercase tracking-[0.1em] text-lime-200"
            >
              Try again
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
