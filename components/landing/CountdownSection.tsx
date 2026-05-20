"use client";

import { useEffect, useState } from "react";

const WORLD_CUP_KICKOFF_DATE = "2026-06-11T15:00:00-04:00";

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
  const distance = new Date(WORLD_CUP_KICKOFF_DATE).getTime() - Date.now();

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
    <section id="countdown" className="scroll-mt-24 border-b border-white/10 py-10 sm:py-14">
      <div className="landing-shell">
        <div className="mx-auto max-w-4xl text-center">
            <p className="text-lg font-black uppercase italic tracking-[0.12em] text-purple-300">World Cup Kickoff Countdown</p>
            <h2 className="sports-display mt-2 text-6xl leading-none text-white sm:text-8xl">Countdown to World Cup 2026</h2>
            <div className="mx-auto mt-4 h-1.5 w-64 max-w-full rounded-full bg-gradient-to-r from-lime-300 to-purple-500" />

            <p className="mt-7 text-2xl font-black text-white">Mexico vs South Africa · June 11, 2026</p>
            <p className="mx-auto mt-4 max-w-xl text-base font-semibold leading-7 text-gray-300">
              Study the groups, track the schedule, and lock your World Cup calls before kickoff.
            </p>

            <div className="mx-auto mt-8 grid max-w-md grid-cols-4 gap-2 sm:gap-4">
              {units.map((unit) => (
                <div key={unit.label}>
                  <p className="scoreboard-number text-4xl text-lime-300 sm:text-5xl">
                    {String(unit.value).padStart(2, "0")}
                  </p>
                  <p className="mt-2 text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">
                    {unit.label}
                  </p>
                </div>
              ))}
            </div>
        </div>
      </div>
    </section>
  );
}
