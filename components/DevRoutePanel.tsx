import Link from "next/link";

const devRoutes = [
  {
    href: "/",
    label: "Landing Page",
    file: "app/page.tsx",
  },
  {
    href: "/app",
    label: "Smack Talk App",
    file: "app/app/page.tsx",
  },
  {
    href: "/signup",
    label: "Create Account",
    file: "app/signup/page.tsx",
  },
  {
    href: "/verify-email",
    label: "Verify Email",
    file: "app/verify-email/page.tsx",
  },
];

export function DevRoutePanel() {
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <nav
      aria-label="Developer route shortcuts"
      className="fixed bottom-3 left-3 z-[100] max-w-[calc(100vw-1.5rem)] rounded-2xl border border-white/15 bg-black/80 p-3 text-white shadow-2xl backdrop-blur-md"
    >
      <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-lime-300">
        Dev Routes
      </p>
      <div className="flex flex-wrap gap-2">
        {devRoutes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs font-bold transition hover:border-lime-300/60 hover:bg-lime-300/15 hover:text-lime-200"
            title={route.file}
          >
            {route.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
