"use client";

import { useState } from "react";
import { SmackTalkLogo } from "@/components/SmackTalkLogo";

const navLinks = [
  { label: "About", href: "#about" },
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
];

export function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#02040a]/82 backdrop-blur-xl">
      <div className="landing-shell flex min-h-20 items-center justify-between gap-4">
        <a href="#about" className="flex min-w-0 items-center gap-3" aria-label="Smack Talk home">
          <SmackTalkLogo size={46} />
          <div className="leading-none">
            <p className="brand-lockup text-2xl sm:text-3xl">
              <span>Smack</span>{" "}
              <span className="bg-gradient-to-r from-purple-300 to-sky-300 bg-clip-text text-transparent">Talk</span>
            </p>
            <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">Season Zero</p>
          </div>
        </a>

        <nav className="hidden items-center gap-8 text-xs font-black uppercase tracking-[0.18em] text-gray-400 md:flex">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="transition hover:text-white">
              {link.label}
            </a>
          ))}
        </nav>

        <a
          href="#waitlist"
          className="hidden rounded-full bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-black shadow-[0_0_28px_rgba(255,255,255,0.16)] transition hover:scale-[1.02] md:inline-flex"
        >
          Claim Your Spot
        </a>

        <button
          onClick={() => setIsOpen((value) => !value)}
          className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/5 text-xl md:hidden"
          type="button"
          aria-expanded={isOpen}
          aria-label="Toggle navigation"
        >
          {isOpen ? "×" : "☰"}
        </button>
      </div>

      {isOpen && (
        <div className="landing-shell pb-4 md:hidden">
          <div className="rounded-3xl border border-white/10 bg-black/70 p-3 shadow-[0_18px_50px_rgba(0,0,0,0.4)]">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="block rounded-2xl px-4 py-3 text-sm font-black uppercase tracking-[0.14em] text-gray-300"
              >
                {link.label}
              </a>
            ))}
            <a
              href="#waitlist"
              onClick={() => setIsOpen(false)}
              className="mt-2 flex min-h-12 items-center justify-center rounded-2xl bg-white px-4 text-sm font-black uppercase tracking-[0.14em] text-black"
            >
              Claim Your Spot
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
