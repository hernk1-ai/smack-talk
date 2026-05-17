import { WorldCupSchedule } from "@/components/world-cup/WorldCupSchedule";
import { RouteBottomNav } from "@/components/BottomNav";

export default function SchedulePage() {
  return (
    <main className="min-h-screen bg-black px-4 py-6 pb-28 text-white">
      <div className="mx-auto w-full max-w-6xl screen-safe-bottom">
        <WorldCupSchedule />
      </div>
      <RouteBottomNav activeView="schedule" />
    </main>
  );
}
