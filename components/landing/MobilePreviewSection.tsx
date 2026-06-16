import Image, { StaticImageData } from "next/image";
import mobilePreviewBacking from "@/public/marketing/mobile-preview-backing.jpg";
import mobilePreviewCountdown from "@/public/marketing/mobile-preview-countdown.jpg";
import mobilePreviewSchedule from "@/public/marketing/mobile-preview-schedule.png";

type Preview = {
  src: StaticImageData;
  alt: string;
  label: string;
  caption: string;
};

const PREVIEWS: Preview[] = [
  {
    src: mobilePreviewCountdown,
    alt: "Lockt match hub countdown to the next match with join game room and view schedule actions",
    label: "Match Hub",
    caption: "Join the Game Room before kickoff and lock in your side.",
  },
  {
    src: mobilePreviewSchedule,
    alt: "Lockt World Cup 2026 schedule with upcoming matches",
    label: "Schedule",
    caption: "Find a match, open its room, and make your call.",
  },
  {
    src: mobilePreviewBacking,
    alt: "Lockt game room showing United States versus Paraguay with room backing and fan voting",
    label: "Game Room",
    caption: "Back your side live and see the room momentum shift in real time.",
  },
];

export function MobilePreviewSection() {
  return (
    <section id="countdown" className="scroll-mt-24 border-b border-white/10 py-10 sm:py-14">
      <div className="landing-shell">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-lime-300 sm:text-xs">Live now</p>
          <h2 className="sports-display mt-3 text-4xl italic leading-none text-white sm:text-6xl">
            See the Game Room in action
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base font-semibold leading-7 text-gray-300">
            Pick your winner, follow live scores, and watch the World Cup with friends and family.
          </p>
        </div>

        <ul className="mx-auto mt-10 grid max-w-5xl gap-6 sm:grid-cols-3">
          {PREVIEWS.map((preview) => (
            <li key={preview.alt} className="flex flex-col items-center">
              <div className="w-full max-w-[280px] overflow-hidden rounded-[1.75rem] border border-white/12 bg-black/45 p-2 shadow-[0_22px_60px_rgba(0,0,0,0.45)]">
                <Image
                  src={preview.src}
                  alt={preview.alt}
                  sizes="(min-width: 640px) 280px, 80vw"
                  className="h-auto w-full rounded-[1.25rem]"
                />
              </div>
              <p className="mt-4 text-[10px] font-black uppercase tracking-[0.16em] text-purple-300">{preview.label}</p>
              <p className="mt-1 max-w-[240px] text-center text-sm font-semibold leading-6 text-gray-400">
                {preview.caption}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
