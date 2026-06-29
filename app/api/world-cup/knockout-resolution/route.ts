import { NextResponse } from "next/server";

import { fetchKnockoutResolutionData } from "@/lib/worldCup/fetchKnockoutResolution";

export async function GET() {
  const data = await fetchKnockoutResolutionData();
  return NextResponse.json(data);
}
