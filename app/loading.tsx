import Image from "next/image";

export default function AppLoading() {
  return (
    <main className="min-h-dvh bg-transparent text-white">
      <div className="mx-auto flex min-h-dvh w-full max-w-3xl items-center justify-center px-6">
        <div className="relative flex flex-col items-center gap-3">
          <div className="absolute -inset-8 rounded-full bg-[radial-gradient(circle,rgba(123,255,0,0.24)_0%,rgba(154,29,255,0.24)_40%,transparent_74%)] blur-2xl" />
          <Image src="/brand/lockt-icon.svg" alt="LOCKT" width={64} height={64} className="relative h-16 w-16" priority />
          <p className="relative text-xs font-black uppercase tracking-[0.2em] text-gray-300">Loading LOCKT</p>
        </div>
      </div>
    </main>
  );
}
