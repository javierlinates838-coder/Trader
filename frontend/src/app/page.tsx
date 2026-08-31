import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { SetupStatus } from "@/components/setup-status";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="text-center space-y-4">
        <Badge
          variant="outline"
          className="border-emerald-500/50 text-emerald-400"
        >
          OPTION1 Scanner
        </Badge>
        <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
          OPTION1
        </h1>
        <p className="max-w-lg text-slate-400">
          Options Value Scanner — real data from MarketData.app, no fake
          numbers.
        </p>
      </div>

      <SetupStatus />

      <div className="flex flex-wrap justify-center gap-4">
        <Link
          href="/diagnostics"
          className="inline-flex items-center justify-center rounded-md border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
        >
          API Diagnostics
        </Link>
        <Link
          href="/underlying"
          className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
        >
          Underlying Engine
        </Link>
      </div>
    </main>
  );
}
