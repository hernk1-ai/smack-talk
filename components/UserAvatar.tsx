import Image from "next/image";

import { getAvatarOption, isImageAvatar } from "@/lib/avatar";

type UserAvatarProps = {
  avatarUrl?: string | null;
  initials?: string;
  label?: string;
  size?: "sm" | "md" | "lg" | "xl";
  active?: boolean;
  className?: string;
};

const sizeClass = {
  sm: "h-8 w-8 text-[10px]",
  md: "h-11 w-11 text-xs",
  lg: "h-20 w-20 text-lg",
  xl: "h-28 w-28 text-2xl",
};

export function UserAvatar({
  avatarUrl,
  initials = "ST",
  label = "User avatar",
  size = "md",
  active = false,
  className = "",
}: UserAvatarProps) {
  const dimensions = sizeClass[size];
  const hasAvatarValue = Boolean(avatarUrl);
  const storedAvatar = getAvatarOption(avatarUrl);

  if (isImageAvatar(avatarUrl)) {
    return (
      <span
        className={`grid shrink-0 place-items-center overflow-hidden rounded-full border border-lime-300/55 bg-black/65 shadow-[0_0_24px_rgba(132,204,22,0.22)] ${dimensions} ${className}`}
        aria-label={label}
        role="img"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={avatarUrl ?? ""} alt="" className="h-full w-full object-cover" />
      </span>
    );
  }

  if (hasAvatarValue && storedAvatar.key === "logo") {
    return (
      <span
        className={`grid shrink-0 place-items-center overflow-hidden rounded-full border bg-black/70 p-1 shadow-[0_0_24px_rgba(132,204,22,0.18)] ${dimensions} ${
          active ? "border-lime-300/70 shadow-[0_0_30px_rgba(132,204,22,0.28)]" : "border-white/15"
        } ${className}`}
        aria-label={label}
        role="img"
      >
        <Image src="/brand/lockt-icon.svg" alt="" width={96} height={96} className="h-full w-full object-contain" />
      </span>
    );
  }

  if (!hasAvatarValue && initials) {
    return (
      <span
        className={`grid shrink-0 place-items-center rounded-full border border-lime-300/50 bg-gradient-to-br from-lime-300 via-purple-500 to-black font-black text-white shadow-[0_0_26px_rgba(132,204,22,0.2)] ${
          active ? "ring-4 ring-lime-300/10" : ""
        } ${dimensions} ${className}`}
        aria-label={label}
        role="img"
      >
        {initials}
      </span>
    );
  }

  const toneClass =
    storedAvatar.tone === "green"
      ? "border-lime-300/60 from-lime-300 via-purple-500 to-black text-white shadow-[0_0_26px_rgba(132,204,22,0.24)]"
      : "border-purple-300/60 from-purple-400 via-lime-300 to-black text-white shadow-[0_0_26px_rgba(168,85,247,0.24)]";

  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full border bg-gradient-to-br font-black ${dimensions} ${toneClass} ${
        active ? "ring-4 ring-lime-300/10" : ""
      } ${className}`}
      aria-label={label}
      role="img"
    >
      {storedAvatar.glyph || initials}
    </span>
  );
}
