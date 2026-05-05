"use client";

import { FeedScreen } from "@/components/screens/FeedScreen";

export default function Home() {
  return (
    <main className="min-h-screen bg-black px-4 py-6 text-white">
      <div className="mx-auto max-w-md">
        <header className="mb-6">
          <h1 className="text-3xl font-black">Smack Talk</h1>
          <p className="text-sm text-gray-400">Talk it. Lock it. Live with it.</p>
        </header>

        <FeedScreen />

        <nav className="fixed bottom-0 left-0 right-0 border-t border-gray-800 bg-black/95 px-4 py-3">
          <div className="mx-auto grid max-w-md grid-cols-4 text-center text-xs font-bold">
            <span className="text-white">Feed</span>
            <span className="text-gray-500">Receipts</span>
            <span className="text-gray-500">Top Talkers</span>
            <span className="text-gray-500">Profile</span>
          </div>
        </nav>
      </div>
    </main>
  );
}
