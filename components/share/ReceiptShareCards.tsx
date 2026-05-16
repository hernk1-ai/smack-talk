import { UserAvatar } from "@/components/UserAvatar";

type ReceiptShareCardProps = {
  handle: string;
  takeText: string;
  gameLabel: string;
  result: "hit" | "miss";
  rideCount: number;
  fadeCount: number;
  heat: number;
  avatarUrl?: string | null;
};

type ProfileReceiptShareCardProps = {
  handle: string;
  reputation: number;
  receiptsCount: number;
  takesCount: number;
  hitRate: number;
  avatarUrl?: string | null;
};

export function ReceiptShareCard({
  handle,
  takeText,
  gameLabel,
  result,
  rideCount,
  fadeCount,
  heat,
  avatarUrl,
}: ReceiptShareCardProps) {
  const initials = handle.replace(/^@/, "").slice(0, 2).toUpperCase() || "ST";

  return (
    <article className="w-full rounded-2xl border border-white/15 bg-black/70 p-4 text-white">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <UserAvatar avatarUrl={avatarUrl ?? null} initials={initials} size="sm" />
          <p className="text-xs font-black uppercase tracking-[0.1em]">{handle}</p>
        </div>
        <span className={`rounded-md px-2 py-1 text-[10px] font-black uppercase ${result === "hit" ? "bg-lime-400/15 text-lime-300" : "bg-red-500/15 text-red-300"}`}>
          {result}
        </span>
      </div>

      <h3 className="mt-3 text-xl font-black leading-tight">{takeText}</h3>
      <p className="mt-2 text-[11px] font-black uppercase tracking-[0.1em] text-sky-300">{gameLabel}</p>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-black">
        <p className="rounded-lg border border-white/10 bg-white/5 py-2">🔥 {heat}</p>
        <p className="rounded-lg border border-white/10 bg-white/5 py-2 text-lime-300">Ride {rideCount}</p>
        <p className="rounded-lg border border-white/10 bg-white/5 py-2 text-purple-300">Fade {fadeCount}</p>
      </div>
    </article>
  );
}

export function ProfileReceiptShareCard({
  handle,
  reputation,
  receiptsCount,
  takesCount,
  hitRate,
  avatarUrl,
}: ProfileReceiptShareCardProps) {
  const initials = handle.replace(/^@/, "").slice(0, 2).toUpperCase() || "ST";

  return (
    <article className="w-full rounded-2xl border border-white/15 bg-black/70 p-4 text-white">
      <div className="flex items-center gap-3">
        <UserAvatar avatarUrl={avatarUrl ?? null} initials={initials} size="md" />
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-lime-300">Smack Talk Receipts</p>
          <h3 className="text-2xl font-black italic">{handle}</h3>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs font-black">
        <p className="rounded-lg border border-white/10 bg-white/5 py-2">REP {reputation}</p>
        <p className="rounded-lg border border-white/10 bg-white/5 py-2">Hit {hitRate}%</p>
        <p className="rounded-lg border border-white/10 bg-white/5 py-2">Takes {takesCount}</p>
        <p className="rounded-lg border border-white/10 bg-white/5 py-2">Receipts {receiptsCount}</p>
      </div>
    </article>
  );
}
