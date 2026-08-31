import { NextResponse } from "next/server";
import { analyzeSymbol, getSymbolAnalysis } from "@/services/underlying";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");

  if (!symbol) {
    return NextResponse.json({ error: "symbol required" }, { status: 400 });
  }

  try {
    const metrics = await getSymbolAnalysis(symbol.toUpperCase());
    if (!metrics) {
      return NextResponse.json(
        { error: "Insufficient data for analysis" },
        { status: 404 },
      );
    }
    return NextResponse.json(metrics);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Analysis failed" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");

  if (!symbol) {
    return NextResponse.json({ error: "symbol required" }, { status: 400 });
  }

  try {
    const metrics = await analyzeSymbol(symbol.toUpperCase());
    if (!metrics) {
      return NextResponse.json(
        { error: "Insufficient data for analysis" },
        { status: 404 },
      );
    }
    return NextResponse.json(metrics);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Analysis failed" },
      { status: 500 },
    );
  }
}
