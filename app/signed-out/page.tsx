import Link from "next/link";

import { SmackTalkLogo } from "@/components/SmackTalkLogo";

export default function SignedOutPage() {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#02040a] text-white">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_4%,rgba(168,85,247,0.18),transparent_34rem),radial-gradient(circle_at_16%_62%,rgba(132,204,22,0.12),transparent_30rem),linear-gradient(180deg,rgba(2,4,10,0.55),#02040a_80%)]" />
        <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(circle_at_30%_20%,#fff_0_0.8px,transparent_1px),radial-gradient(circle_at_70%_80%,#fff_0_0.7px,transparent_1px)] bg-[length:14px_14px,19px_19px]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-dvh w-[min(100%-24px,760px)] flex-col items-center justify-center py-8 text-center">
        <Link href="/" className="flex items-center gap-3 transition hover:-translate-y-0.5" aria-label="LOCKT home">
          <SmackTalkLogo size={72} />
          <div className="brand-lockup text-4xl leading-[0.82]">
            <span className="block text-white">Smack</span>
            <span className="block bg-gradient-to-r from-lime-300 via-white to-purple-400 bg-clip-text text-transparent">
              Talk
            </span>
          </div>
        </Link>

        <section className="mt-10 w-full rounded-[2rem] border border-white/10 bg-black/45 p-6 shadow-[0_28px_90px_rgba(0,0,0,0.55),0_0_46px_rgba(168,85,247,0.12)] sm:p-10">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-lime-300">Session closed</p>
          <h1 className="sports-display mt-4 text-[4.2rem] italic leading-[0.82] text-white drop-shadow-[0_10px_28px_rgba(255,255,255,0.14)] min-[390px]:text-[5rem] sm:text-[6.6rem]">
            You Have Been
            <span className="block bg-gradient-to-r from-lime-300 via-white to-purple-500 bg-clip-text text-transparent">
              Signed Out.
            </span>
          </h1>
          <div className="mx-auto mt-5 h-1.5 w-56 rounded-full bg-gradient-to-r from-lime-300 via-white/50 to-purple-500 shadow-[0_0_24px_rgba(168,85,247,0.34)]" />
          <p className="mx-auto mt-6 max-w-md text-base font-black uppercase tracking-[0.12em] text-gray-300 sm:text-xl">
            The Arena will be waiting.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Link
              href="/login"
              className="grid min-h-14 place-items-center rounded-2xl bg-gradient-to-r from-lime-300 via-lime-300 to-purple-500 px-5 text-sm font-black uppercase italic tracking-[0.16em] text-black shadow-[0_0_38px_rgba(132,204,22,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_0_52px_rgba(168,85,247,0.3)] active:scale-[0.985]"
            >
              Log Back In
            </Link>
            <Link
              href="/"
              className="grid min-h-14 place-items-center rounded-2xl border border-purple-300/45 bg-purple-500/10 px-5 text-sm font-black uppercase tracking-[0.14em] text-purple-100 transition hover:-translate-y-0.5 hover:bg-purple-500/16 active:scale-[0.985]"
            >
              Return Home
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
