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
    <section className="border-b border-white/10 py-12 sm:py-20">
      <div className="landing-shell">
        <div className="arena-surface overflow-hidden rounded-[2rem] border border-lime-300/25 p-5 shadow-[0_30px_90px_rgba(0,0,0,0.52),0_0_44px_rgba(132,204,22,0.08)] sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-center text-[10px] font-black uppercase tracking-[0.34em] text-lime-300 lg:text-left">
                The Arena Opens In
              </p>
              <div className="mt-6 grid grid-cols-4 gap-2 sm:gap-4">
                {units.map((unit) => (
                  <div key={unit.label} className="text-center">
                    <p className="scoreboard-number text-4xl text-white sm:text-6xl">
                      {String(unit.value).padStart(2, "0")}
                    </p>
                    <p className="mt-2 text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">
                      {unit.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="overflow-visible border-t border-white/10 px-3 pt-7 text-center lg:border-l lg:border-t-0 lg:pl-12 lg:pr-6 lg:pt-0">
              <h2 className="sports-display mx-auto w-fit overflow-visible bg-gradient-to-r from-purple-300 via-purple-500 to-lime-300 bg-clip-text px-3 pb-2 text-5xl italic leading-[1.12] text-transparent sm:text-6xl xl:text-[4.25rem]">
                Coming Soon
              </h2>
              <p className="mt-2 text-2xl font-black uppercase italic tracking-[0.12em] text-lime-300">Season Zero</p>
              <div className="mx-auto mt-3 h-1.5 w-36 rounded-full bg-gradient-to-r from-lime-300 to-purple-500" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
