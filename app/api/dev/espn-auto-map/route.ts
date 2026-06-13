import { NextResponse } from "next/server";

import { validateEspnAutoMapping } from "@/lib/sports/espnWorldCupSync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const validation = validateEspnAutoMapping();
  return NextResponse.json(validation);
}
