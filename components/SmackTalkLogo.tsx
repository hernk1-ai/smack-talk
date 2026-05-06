import Image from "next/image";

export function SmackTalkLogo({ size = 48 }: { size?: number }) {
  return (
    <div
      className="logo-glow grid shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/5 p-1.5 shadow-[0_0_28px_rgba(139,92,246,0.16)] transition hover:scale-[1.03]"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <Image
        src="/smack-talk-logo.svg"
        alt=""
        width={size - 10}
        height={size - 10}
        priority
        className="h-full w-full rounded-xl object-contain"
      />
    </div>
  );
}
