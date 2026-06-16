import type { Metadata } from "next";
import Link from "next/link";

import { LocktLogo } from "@/components/LocktLogo";

export const metadata: Metadata = {
  title: "LOCKT — Privacy Policy",
  description: "Privacy Policy for LOCKT.",
};

type LegalBlock =
  | {
      type: "p";
      text: string;
    }
  | {
      type: "ul";
      items: string[];
    };

const intro = [
  "LOCKT (“LOCKT,” “we,” “our,” or “us”) respects your privacy.",
  "This Privacy Policy explains how we collect, use, store, and protect information when you use the LOCKT platform, website, and related services (“Platform” or “Service”).",
  "By using LOCKT, you agree to this Privacy Policy.",
  "If you do not agree, please do not use the Platform.",
];

const sections: { title: string; blocks: LegalBlock[] }[] = [
  {
    title: "1. INFORMATION WE COLLECT",
    blocks: [
      {
        type: "p",
        text: "Information You Provide",
      },
      {
        type: "p",
        text: "We may collect information you voluntarily provide, including:",
      },
      {
        type: "ul",
        items: [
          "username;",
          "email address;",
          "password credentials;",
          "profile image;",
          "favorite teams/interests;",
          "posts, takes, comments, receipts, and uploaded content;",
          "messages or support inquiries.",
        ],
      },
      {
        type: "p",
        text: "Automatically Collected Information",
      },
      {
        type: "p",
        text: "When you use the Platform, we may automatically collect:",
      },
      {
        type: "ul",
        items: [
          "device information;",
          "browser type;",
          "operating system;",
          "IP address;",
          "app interactions;",
          "pages viewed;",
          "engagement activity;",
          "session data;",
          "referral sources;",
          "crash reports and diagnostics.",
        ],
      },
      {
        type: "p",
        text: "Community & Reputation Activity",
      },
      {
        type: "p",
        text: "LOCKT is a public reputation-based platform.",
      },
      {
        type: "p",
        text: "Certain actions may be publicly visible, including:",
      },
      {
        type: "ul",
        items: [
          "takes;",
          "rides/fades;",
          "rankings;",
          "streaks;",
          "trophies;",
          "receipts;",
          "profile activity;",
          "community engagement metrics.",
        ],
      },
      {
        type: "p",
        text: "Public activity may remain visible even after content is edited or removed in certain cases related to platform integrity, moderation, or community history.",
      },
    ],
  },
  {
    title: "2. HOW WE USE INFORMATION",
    blocks: [
      {
        type: "p",
        text: "We may use information to:",
      },
      {
        type: "ul",
        items: [
          "operate and improve the Platform;",
          "personalize user experiences;",
          "maintain rankings and reputation systems;",
          "moderate content and community safety;",
          "prevent spam, fraud, abuse, or manipulation;",
          "communicate with users;",
          "analyze platform usage;",
          "develop new features;",
          "enforce our Terms of Use;",
          "protect the integrity of the Platform.",
        ],
      },
      {
        type: "p",
        text: "We may also use aggregated or anonymized data for analytics, research, or business insights.",
      },
    ],
  },
  {
    title: "3. NO SALE OF PERSONAL INFORMATION",
    blocks: [
      {
        type: "p",
        text: "LOCKT does not sell personal information to third parties.",
      },
      {
        type: "p",
        text: "We may share limited information with service providers who help operate the Platform, including:",
      },
      {
        type: "ul",
        items: [
          "hosting providers;",
          "analytics providers;",
          "customer support systems;",
          "security and moderation tools.",
        ],
      },
      {
        type: "p",
        text: "These providers may only use information to support our services.",
      },
    ],
  },
  {
    title: "4. PUBLIC CONTENT",
    blocks: [
      {
        type: "p",
        text: "LOCKT is a social platform.",
      },
      {
        type: "p",
        text: "Content you post publicly — including takes, comments, rankings, and receipts — may be viewable by:",
      },
      {
        type: "ul",
        items: [
          "other users;",
          "search engines;",
          "third-party platforms;",
          "social sharing tools.",
        ],
      },
      {
        type: "p",
        text: "Please use discretion when posting content publicly.",
      },
    ],
  },
  {
    title: "5. COOKIES & ANALYTICS",
    blocks: [
      {
        type: "p",
        text: "We may use:",
      },
      {
        type: "ul",
        items: [
          "cookies;",
          "analytics tools;",
          "device identifiers;",
          "similar technologies",
        ],
      },
      {
        type: "p",
        text: "to improve functionality, measure engagement, and enhance user experience.",
      },
      {
        type: "p",
        text: "These technologies may help us:",
      },
      {
        type: "ul",
        items: [
          "remember preferences;",
          "analyze traffic;",
          "detect abuse;",
          "improve performance.",
        ],
      },
    ],
  },
  {
    title: "6. ACCOUNT SECURITY",
    blocks: [
      {
        type: "p",
        text: "We use reasonable safeguards to help protect user information.",
      },
      {
        type: "p",
        text: "However, no platform or internet transmission is completely secure.",
      },
      {
        type: "p",
        text: "You are responsible for maintaining the confidentiality of your account credentials.",
      },
    ],
  },
  {
    title: "7. AGE RESTRICTIONS",
    blocks: [
      {
        type: "p",
        text: "LOCKT is intended for users 13 years of age or older.",
      },
      {
        type: "p",
        text: "We do not knowingly collect personal information from children under 13.",
      },
      {
        type: "p",
        text: "LOCKT is not a gambling product and does not offer betting, odds, cash prizes, or cash-value rewards.",
      },
      {
        type: "p",
        text: "Rep is non-monetary, non-transferable, and has no cash value.",
      },
      {
        type: "p",
        text: "If we become aware that information from a child under 13 has been collected, we may remove the information and terminate the associated account.",
      },
    ],
  },
  {
    title: "8. CONTENT MODERATION & SAFETY",
    blocks: [
      {
        type: "p",
        text: "To maintain platform integrity and community safety, we may:",
      },
      {
        type: "ul",
        items: [
          "review public content;",
          "use automated moderation tools;",
          "investigate reports or abuse;",
          "remove harmful content;",
          "restrict or terminate accounts.",
        ],
      },
      {
        type: "p",
        text: "This may include the use of AI-assisted moderation systems.",
      },
    ],
  },
  {
    title: "9. THIRD-PARTY LINKS & SERVICES",
    blocks: [
      {
        type: "p",
        text: "The Platform may contain links to third-party websites, services, or content.",
      },
      {
        type: "p",
        text: "We are not responsible for the privacy practices or content of third-party services.",
      },
      {
        type: "p",
        text: "Use third-party services at your own risk.",
      },
    ],
  },
  {
    title: "10. DATA RETENTION",
    blocks: [
      {
        type: "p",
        text: "We may retain information:",
      },
      {
        type: "ul",
        items: [
          "as necessary to operate the Platform;",
          "for security purposes;",
          "for legal compliance;",
          "for moderation enforcement;",
          "to preserve community integrity and reputation history.",
        ],
      },
      {
        type: "p",
        text: "We may retain certain information after account deletion where permitted or required by law.",
      },
    ],
  },
  {
    title: "11. YOUR RIGHTS",
    blocks: [
      {
        type: "p",
        text: "Depending on your location, you may have rights to:",
      },
      {
        type: "ul",
        items: [
          "access your data;",
          "correct your data;",
          "request deletion;",
          "object to certain processing;",
          "request data portability.",
        ],
      },
      {
        type: "p",
        text: "To submit requests, contact:",
      },
      {
        type: "p",
        text: "support@getlockt.com",
      },
      {
        type: "p",
        text: "We may verify identity before processing requests.",
      },
    ],
  },
  {
    title: "12. CALIFORNIA PRIVACY RIGHTS",
    blocks: [
      {
        type: "p",
        text: "California residents may have additional rights under applicable privacy laws, including the California Consumer Privacy Act (CCPA).",
      },
      {
        type: "p",
        text: "We do not sell personal information.",
      },
      {
        type: "p",
        text: "Requests regarding California privacy rights may be submitted to:",
      },
      {
        type: "p",
        text: "support@getlockt.com",
      },
    ],
  },
  {
    title: "13. INTERNATIONAL USERS",
    blocks: [
      {
        type: "p",
        text: "LOCKT is operated in the United States.",
      },
      {
        type: "p",
        text: "By using the Platform, you understand that your information may be transferred to and processed in the United States.",
      },
    ],
  },
  {
    title: "14. CHANGES TO THIS POLICY",
    blocks: [
      {
        type: "p",
        text: "We may update this Privacy Policy periodically.",
      },
      {
        type: "p",
        text: "Updated versions will be posted on this page with a revised “Last Updated” date.",
      },
      {
        type: "p",
        text: "Continued use of the Platform constitutes acceptance of the updated policy.",
      },
    ],
  },
  {
    title: "15. CONTACT",
    blocks: [
      {
        type: "p",
        text: "Questions regarding this Privacy Policy may be directed to:",
      },
      {
        type: "p",
        text: "support@getlockt.com",
      },
    ],
  },
  {
    title: "FINAL NOTE",
    blocks: [
      {
        type: "p",
        text: "LOCKT is built around public competition, community identity, sports culture, and reputation systems.",
      },
      {
        type: "p",
        text: "Every call leaves a receipt.",
      },
      {
        type: "p",
        text: "Use the Platform responsibly.",
      },
    ],
  },
];

function LegalSection({
  title,
  blocks,
}: {
  title: string;
  blocks: LegalBlock[];
}) {
  return (
    <section className="border-t border-white/10 py-8 first:border-t-0 first:pt-0">
      <h2 className="font-display text-2xl uppercase tracking-[0.08em] text-white sm:text-3xl">
        {title}
      </h2>
      <div className="mt-5 space-y-4 text-base leading-8 text-gray-300 sm:text-lg">
        {blocks.map((block, index) => {
          if (block.type === "ul") {
            return (
              <ul key={index} className="list-disc space-y-2 pl-6 marker:text-lime-300">
                {block.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            );
          }

          return <p key={index}>{block.text}</p>;
        })}
      </div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#050508] text-white">
      <div className="pointer-events-none fixed inset-0 -z-0 bg-[radial-gradient(circle_at_20%_0%,rgba(157,255,46,0.13),transparent_28%),radial-gradient(circle_at_80%_10%,rgba(155,77,255,0.16),transparent_32%),linear-gradient(180deg,#050508_0%,#07070d_48%,#050508_100%)]" />
      <div className="relative z-10 mx-auto flex w-[min(100%-32px,980px)] flex-col gap-10 py-6 sm:py-10">
        <header className="flex items-center justify-between gap-4 border-b border-white/10 pb-6">
          <Link href="/app" className="flex items-center gap-3 transition hover:opacity-90">
            <LocktLogo size={48} />
            <div>
              <p className="brand-lockup text-3xl leading-none">
                <span className="bg-gradient-to-r from-lime-300 via-white to-purple-400 bg-clip-text text-transparent">LOCKT</span>
              </p>
              <p className="mt-1 text-[0.65rem] font-black uppercase tracking-[0.24em] text-lime-300">
                Check the Receipt
              </p>
            </div>
          </Link>
          <Link
            href="/"
            className="rounded-full border border-white/15 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-gray-300 transition hover:border-lime-300/50 hover:text-white"
          >
            Home
          </Link>
        </header>

        <section className="rounded-[2rem] border border-lime-300/20 bg-black/55 p-6 shadow-[0_0_60px_rgba(155,77,255,0.12)] sm:p-10">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-lime-300">
            LOCKT — PRIVACY POLICY
          </p>
          <h1 className="mt-4 font-display text-5xl uppercase leading-none tracking-[0.02em] text-white sm:text-7xl">
            PRIVACY POLICY
          </h1>
          <p className="mt-4 text-sm font-black uppercase tracking-[0.18em] text-purple-300">
            Last Updated: May 2026
          </p>
        </section>

        <article className="rounded-[2rem] border border-white/10 bg-[rgba(10,10,18,0.88)] p-6 shadow-[0_24px_90px_rgba(0,0,0,0.42)] sm:p-10">
          <div className="space-y-4 border-b border-white/10 pb-8 text-base leading-8 text-gray-300 sm:text-lg">
            {intro.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          <div className="mt-8">
            {sections.map((section) => (
              <LegalSection key={section.title} {...section} />
            ))}
          </div>
        </article>

        <footer className="flex flex-col gap-4 border-t border-white/10 py-6 text-sm text-gray-400 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-4">
            <Link className="transition hover:text-white" href="/privacy">
              Privacy Policy
            </Link>
            <Link className="transition hover:text-white" href="/terms">
              Terms of Use
            </Link>
          </div>
          <a className="transition hover:text-lime-300" href="mailto:support@getlockt.com">
            support@getlockt.com
          </a>
        </footer>
      </div>
    </main>
  );
}
