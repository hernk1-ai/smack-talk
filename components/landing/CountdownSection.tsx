"use client";

import { useEffect, useState } from "react";

const LAUNCH_DATE = "2026-09-05T20:00:00-07:00";

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

const zeroTime: TimeLeft = {
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
};

function getTimeLeft(): TimeLeft {
  const distance = new Date(LAUNCH_DATE).getTime() - Date.now();

  if (distance <= 0) return zeroTime;

  return {
    days: Math.floor(distance / (1000 * 60 * 60 * 24)),
    hours: Math.floor((distance / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((distance / (1000 * 60)) % 60),
    seconds: Math.floor((distance / 1000) % 60),
  };
}

export function CountdownSection() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(zeroTime);

  useEffect(() => {
    const updateCountdown = () => setTimeLeft(getTimeLeft());
    const initialTimer = window.setTimeout(updateCountdown, 0);
    const timer = window.setInterval(updateCountdown, 1000);

    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
    };
  }, []);

  const units = [
    { label: "Days", value: timeLeft.days },
    { label: "Hrs", value: timeLeft.hours },
    { label: "Mins", value: timeLeft.minutes },
    { label: "Secs", value: timeLeft.seconds },
  ];

  return (
    <section className="border-b border-white/10 py-16 sm:py-24">
      <div className="landing-shell">
        <div className="arena-surface overflow-hidden rounded-[2rem] border border-white/10 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.52)] sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-purple-200">The Arena Opens In</p>
              <h2 className="sports-display mt-3 text-5xl leading-none sm:text-7xl">Coming Soon</h2>
            </div>
            <p className="rounded-full border border-green-300/20 bg-green-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-green-100">
              Season Zero
            </p>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {units.map((unit) => (
              <div key={unit.label} className="rounded-3xl border border-white/10 bg-black/45 p-5 text-center">
                <p className="scoreboard-number text-5xl text-white">{String(unit.value).padStart(2, "0")}</p>
                <p className="mt-2 text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">{unit.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
