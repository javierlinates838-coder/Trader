"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="text-2xl font-bold text-white">Something went wrong</h1>
      <p className="max-w-md text-slate-400 text-sm">
        {error.message || "An unexpected error occurred."}
      </p>
      <div className="flex gap-4">
        <button
          onClick={reset}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-500"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-md border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
        >
          Home
        </Link>
      </div>
    </main>
  );
}
