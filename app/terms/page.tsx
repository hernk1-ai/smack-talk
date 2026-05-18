import type { Metadata } from "next";
import Link from "next/link";

import { LocktLogo } from "@/components/LocktLogo";

export const metadata: Metadata = {
  title: "LOCKT — Terms of Use",
  description: "Terms of Use for LOCKT.",
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
  "Welcome to LOCKT.",
  "LOCKT is a competitive social platform built around sports culture, public takes, predictions, community discussion, and reputation systems.",
  "By accessing or using LOCKT (“Platform,” “Service,” “we,” “our,” or “us”), you agree to these Terms of Use (“Terms”).",
  "If you do not agree to these Terms, do not use the Platform.",
];

const sections: { title: string; blocks: LegalBlock[] }[] = [
  {
    title: "1. ELIGIBILITY",
    blocks: [
      {
        type: "p",
        text: "You must be at least 13 years old to use LOCKT.",
      },
      {
        type: "p",
        text: "By using the Platform, you represent that:",
      },
      {
        type: "ul",
        items: [
          "you meet the minimum age requirement;",
          "you have the legal capacity to enter into these Terms;",
          "your use of the Platform complies with all applicable laws.",
        ],
      },
      {
        type: "p",
        text: "LOCKT is intended for entertainment and community discussion purposes only.",
      },
    ],
  },
  {
    title: "2. NO GAMBLING OR FINANCIAL SERVICES",
    blocks: [
      {
        type: "p",
        text: "LOCKT is NOT a sportsbook, casino, betting platform, financial exchange, or gambling operator.",
      },
      {
        type: "p",
        text: "The Platform does not facilitate:",
      },
      {
        type: "ul",
        items: [
          "real-money gambling;",
          "sportsbook-style services;",
          "financial investment activity.",
        ],
      },
      {
        type: "p",
        text: "All predictions, takes, rankings, reputation systems, rides, fades, streaks, and receipts are for entertainment, social interaction, and community engagement purposes only.",
      },
      {
        type: "p",
        text: "Users compete for reputation, status, visibility, and community recognition — not guaranteed monetary rewards.",
      },
    ],
  },
  {
    title: "3. USER ACCOUNTS",
    blocks: [
      {
        type: "p",
        text: "You are responsible for:",
      },
      {
        type: "ul",
        items: [
          "maintaining the security of your account;",
          "all activity occurring under your account;",
          "keeping your login credentials confidential.",
        ],
      },
      {
        type: "p",
        text: "You may not:",
      },
      {
        type: "ul",
        items: [
          "impersonate another person;",
          "create misleading accounts;",
          "evade bans or restrictions;",
          "sell or transfer accounts without permission.",
        ],
      },
      {
        type: "p",
        text: "We reserve the right to suspend or terminate accounts at our discretion.",
      },
    ],
  },
  {
    title: "4. COMMUNITY CONDUCT",
    blocks: [
      {
        type: "p",
        text: "LOCKT is built for competition, rivalry, and confident sports takes.",
      },
      {
        type: "p",
        text: "Bring strong opinions. Keep it respectful.",
      },
      {
        type: "p",
        text: "But you may NOT:",
      },
      {
        type: "ul",
        items: [
          "engage in hate speech;",
          "threaten violence;",
          "harass or target individuals;",
          "dox users;",
          "promote illegal activity;",
          "spam or manipulate engagement;",
          "impersonate leagues, teams, brands, or public figures;",
          "post sexually explicit content;",
          "use the Platform for scams or fraudulent activity.",
        ],
      },
      {
        type: "p",
        text: "Attack takes. Not lives.",
      },
      {
        type: "p",
        text: "We reserve the right to remove content or restrict accounts that violate these rules.",
      },
    ],
  },
  {
    title: "5. USER CONTENT",
    blocks: [
      {
        type: "p",
        text: "You retain ownership of content you post, including:",
      },
      {
        type: "ul",
        items: [
          "takes;",
          "comments;",
          "usernames;",
          "profile images;",
          "receipts;",
          "media uploads.",
        ],
      },
      {
        type: "p",
        text: "However, by posting content on LOCKT, you grant us a worldwide, non-exclusive, royalty-free license to:",
      },
      {
        type: "ul",
        items: [
          "display;",
          "distribute;",
          "reproduce;",
          "modify;",
          "promote;",
          "feature;",
          "share",
        ],
      },
      {
        type: "p",
        text: "your content in connection with operating and promoting the Platform.",
      },
      {
        type: "p",
        text: "This includes:",
      },
      {
        type: "ul",
        items: [
          "featured feeds;",
          "social media promotions;",
          "marketing materials;",
          "creator highlights;",
          "community showcases.",
        ],
      },
      {
        type: "p",
        text: "You represent that you own or have the right to post any content you upload.",
      },
    ],
  },
  {
    title: "6. PLATFORM REPUTATION SYSTEMS",
    blocks: [
      {
        type: "p",
        text: "LOCKT may use public engagement systems including:",
      },
      {
        type: "ul",
        items: [
          "rankings;",
          "streaks;",
          "scores;",
          "trophies;",
          "receipts;",
          "creator status;",
          "ride/fade metrics;",
          "leaderboards.",
        ],
      },
      {
        type: "p",
        text: "These systems are entertainment features only.",
      },
      {
        type: "p",
        text: "We reserve the right to:",
      },
      {
        type: "ul",
        items: [
          "modify scoring systems;",
          "reset seasons;",
          "adjust rankings;",
          "remove fraudulent engagement;",
          "suspend manipulation attempts.",
        ],
      },
      {
        type: "p",
        text: "Platform reputation has no cash value, is non-transferable, cannot be bought or sold, and is not redeemable for money or prizes.",
      },
    ],
  },
  {
    title: "7. INTELLECTUAL PROPERTY",
    blocks: [
      {
        type: "p",
        text: "All LOCKT branding, logos, graphics, software, designs, interfaces, and platform systems are owned by LOCKT or its licensors.",
      },
      {
        type: "p",
        text: "You may not:",
      },
      {
        type: "ul",
        items: [
          "copy the Platform;",
          "reverse engineer the Platform;",
          "reproduce proprietary systems;",
          "use LOCKT branding without permission.",
        ],
      },
      {
        type: "p",
        text: "Third-party names, teams, leagues, trademarks, and references remain property of their respective owners.",
      },
      {
        type: "p",
        text: "Reference to sports teams, leagues, events, or public figures does not imply endorsement or affiliation.",
      },
    ],
  },
  {
    title: "8. THIRD-PARTY CONTENT & SPORTS INFORMATION",
    blocks: [
      {
        type: "p",
        text: "The Platform may reference:",
      },
      {
        type: "ul",
        items: [
          "sports teams;",
          "athletes;",
          "leagues;",
          "entertainment events;",
          "public statistics;",
          "public outcomes;",
          "community commentary.",
        ],
      },
      {
        type: "p",
        text: "LOCKT is not officially affiliated with any sports league, team, broadcaster, or entertainment organization unless explicitly stated.",
      },
    ],
  },
  {
    title: "9. TERMINATION",
    blocks: [
      {
        type: "p",
        text: "We reserve the right to:",
      },
      {
        type: "ul",
        items: [
          "suspend accounts;",
          "remove content;",
          "restrict access;",
          "terminate the Service",
        ],
      },
      {
        type: "p",
        text: "at any time, with or without notice, for violations of these Terms or conduct harmful to the community or Platform.",
      },
    ],
  },
  {
    title: "10. DISCLAIMERS",
    blocks: [
      {
        type: "p",
        text: "The Platform is provided “AS IS” and “AS AVAILABLE.”",
      },
      {
        type: "p",
        text: "We do not guarantee:",
      },
      {
        type: "ul",
        items: [
          "uninterrupted availability;",
          "error-free operation;",
          "accuracy of user content;",
          "reliability of predictions or opinions.",
        ],
      },
      {
        type: "p",
        text: "User content represents the views of individual users, not LOCKT.",
      },
    ],
  },
  {
    title: "11. LIMITATION OF LIABILITY",
    blocks: [
      {
        type: "p",
        text: "To the maximum extent permitted by law, LOCKT and its affiliates shall not be liable for:",
      },
      {
        type: "ul",
        items: [
          "indirect damages;",
          "lost profits;",
          "lost data;",
          "reputational harm;",
          "emotional distress;",
          "user disputes;",
          "community interactions.",
        ],
      },
      {
        type: "p",
        text: "Your use of the Platform is at your own risk.",
      },
    ],
  },
  {
    title: "12. CHANGES TO THE PLATFORM",
    blocks: [
      {
        type: "p",
        text: "We may modify, suspend, or discontinue any aspect of the Platform at any time without liability.",
      },
      {
        type: "p",
        text: "This includes:",
      },
      {
        type: "ul",
        items: [
          "features;",
          "rankings;",
          "seasons;",
          "creator systems;",
          "reputation mechanics;",
          "monetization systems.",
        ],
      },
    ],
  },
  {
    title: "13. CHANGES TO THESE TERMS",
    blocks: [
      {
        type: "p",
        text: "We may update these Terms periodically.",
      },
      {
        type: "p",
        text: "Continued use of the Platform after updates constitutes acceptance of the revised Terms.",
      },
    ],
  },
  {
    title: "14. GOVERNING LAW",
    blocks: [
      {
        type: "p",
        text: "These Terms shall be governed by the laws of the State of California, without regard to conflict of law principles.",
      },
    ],
  },
  {
    title: "15. CONTACT",
    blocks: [
      {
        type: "p",
        text: "For questions regarding these Terms, contact:",
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
        text: "LOCKT is a competitive social platform built around community, reputation, predictions, and sports culture.",
      },
      {
        type: "p",
        text: "Called it. Check the receipt.",
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

export default function TermsPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#050508] text-white">
      <div className="pointer-events-none fixed inset-0 -z-0 bg-[radial-gradient(circle_at_20%_0%,rgba(157,255,46,0.13),transparent_28%),radial-gradient(circle_at_80%_10%,rgba(155,77,255,0.16),transparent_32%),linear-gradient(180deg,#050508_0%,#07070d_48%,#050508_100%)]" />
      <div className="relative z-10 mx-auto flex w-[min(100%-32px,980px)] flex-col gap-10 py-6 sm:py-10">
        <header className="flex items-center justify-between gap-4 border-b border-white/10 pb-6">
          <Link href="/" className="flex items-center gap-3 transition hover:opacity-90">
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
            LOCKT — TERMS OF USE
          </p>
          <h1 className="mt-4 font-display text-5xl uppercase leading-none tracking-[0.02em] text-white sm:text-7xl">
            TERMS OF USE
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
