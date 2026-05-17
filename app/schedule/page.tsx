import { WorldCupSchedule } from "@/components/world-cup/WorldCupSchedule";

export default function SchedulePage() {
  return (
    <main className="min-h-screen bg-black px-4 py-6 text-white">
      <div className="mx-auto w-full max-w-6xl">
        <WorldCupSchedule />
      </div>
    </main>
  );
}
