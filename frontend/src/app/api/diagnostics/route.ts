import { NextResponse } from "next/server";
import { runDiagnostics } from "@/services/marketdata";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol") ?? "QQQ";

  const result = await runDiagnostics(symbol.toUpperCase());

  return NextResponse.json(result);
}
