"use client";

import { useEffect } from "react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AdminShellError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("[admin shell error]", error);
  }, [error]);

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center px-4 text-center">
      <div className="rounded-xl border border-red-200 bg-red-50 px-8 py-10 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-widest text-red-400">
          Error
        </p>
        <h2 className="mt-2 text-lg font-semibold text-neutral-900">
          Something went wrong
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          {error.message ?? "An unexpected error occurred."}
        </p>
        {error.digest && (
          <p className="mt-1 font-mono text-xs text-neutral-400">
            Digest: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          className="mt-6 rounded-lg bg-[#0B3D2E] px-5 py-2 text-sm font-medium text-white hover:bg-[#0a3527]"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
