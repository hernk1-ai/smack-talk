"use client";

import { WaitlistForm } from "@/components/landing/WaitlistForm";
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
    <section id="waitlist" className="scroll-mt-24 border-b border-white/10 py-12 sm:py-20">
      <div className="landing-shell">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1fr] lg:items-center">
          <div>
            <p className="text-lg font-black uppercase italic tracking-[0.12em] text-purple-300">Coming Soon</p>
            <h2 className="sports-display mt-2 text-6xl leading-none text-white sm:text-8xl">The First Lock</h2>
            <div className="mt-4 h-1.5 w-64 max-w-full rounded-full bg-gradient-to-r from-lime-300 to-purple-500" />

            <p className="mt-7 text-2xl font-black text-white">Join The First Lock.</p>
            <p className="mt-4 max-w-xl text-base font-semibold leading-7 text-gray-300">
              Founding talkers get in early before the Crowd gets loud. Your first receipts start here.
            </p>

            <div className="mt-8 grid grid-cols-4 gap-2 sm:max-w-md sm:gap-4">
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

          <div className="arena-surface rounded-[2rem] border border-purple-400/35 p-4 shadow-[0_30px_90px_rgba(0,0,0,0.52),0_0_44px_rgba(168,85,247,0.08)] sm:p-6">
            <WaitlistForm />
          </div>
        </div>
      </div>
    </section>
  );
}
