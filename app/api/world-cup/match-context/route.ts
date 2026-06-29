import { NextResponse } from "next/server";

import { fetchResolvedMatchContextInput } from "@/lib/worldCup/fetchResolvedMatchContext";

export const dynamic = "force-dynamic";

/** FIFA bracket + ESPN game rows for client-side resolved match building. */
export async function GET() {
  const context = await fetchResolvedMatchContextInput();
  return NextResponse.json(context);
}
