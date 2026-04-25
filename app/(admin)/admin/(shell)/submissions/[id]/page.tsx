import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getAdminSubmissionById } from "@/lib/data/admin/submissions";
import { SubmissionUpdateForm, STATUS_STYLES } from "@/components/admin/submissions/submission-update-form";
import { cn } from "@/lib/utils/cn";

const IP_RETENTION_DAYS = 90;

function isIpExpired(createdAt: Date): boolean {
  return Date.now() - createdAt.getTime() > IP_RETENTION_DAYS * 24 * 60 * 60 * 1000;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const item = await getAdminSubmissionById(Number(id));
  if (!item) return { title: "Not found" };
  return { title: `Submission #${item.id} — ${item.name}` };
}

export default function SubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={null}>
      <SubmissionDetailContent params={params} />
    </Suspense>
  );
}

async function SubmissionDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;
  const itemId = Number(rawId);
  if (isNaN(itemId)) notFound();

  const item = await getAdminSubmissionById(itemId);
  if (!item) notFound();

  const ipDisplay = isIpExpired(item.createdAt)
    ? "redacted (retention expired)"
    : item.ip ?? "not stored";

  return (
    <div className="mx-auto max-w-4xl">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-2 text-sm text-neutral-400">
        <Link href="/admin/submissions" className="hover:text-neutral-700">
          Submissions
        </Link>
        <span>/</span>
        <span className="text-neutral-600">#{item.id}</span>
      </nav>

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold text-neutral-900">
          Submission #{item.id}
        </h2>
        <span
          className={cn(
            "rounded px-2 py-0.5 text-xs font-medium uppercase",
            "bg-neutral-100 text-neutral-600"
          )}
        >
          {item.kind}
        </span>
        <span
          className={cn(
            "rounded px-2 py-0.5 text-xs font-medium",
            STATUS_STYLES[item.status]
          )}
        >
          {item.status}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_300px]">
        {/* ── Left: full submission content ─────────────────────────── */}
        <div className="space-y-5">
          {/* Sender */}
          <section className="rounded-xl border border-neutral-200 bg-white p-5">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Sender
            </h3>
            <dl className="space-y-2 text-sm">
              <div className="flex gap-3">
                <dt className="w-24 shrink-0 text-neutral-400">Name</dt>
                <dd className="font-medium text-neutral-900">{item.name}</dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-24 shrink-0 text-neutral-400">Email</dt>
                <dd>
                  <a
                    href={`mailto:${item.email}`}
                    className="text-[#0B3D2E] underline-offset-2 hover:underline"
                  >
                    {item.email}
                  </a>
                </dd>
              </div>
              {item.locale && (
                <div className="flex gap-3">
                  <dt className="w-24 shrink-0 text-neutral-400">Locale</dt>
                  <dd className="uppercase text-neutral-700">{item.locale}</dd>
                </div>
              )}
            </dl>
          </section>

          {/* Message */}
          <section className="rounded-xl border border-neutral-200 bg-white p-5">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Message
            </h3>
            {item.subject && (
              <p className="mb-2 text-sm font-semibold text-neutral-800">
                {item.subject}
              </p>
            )}
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-700">
              {item.message}
            </p>
          </section>

          {/* Metadata */}
          <section className="rounded-xl border border-neutral-200 bg-white p-5">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Metadata
            </h3>
            <dl className="space-y-2 text-sm">
              <div className="flex gap-3">
                <dt className="w-24 shrink-0 text-neutral-400">Submitted</dt>
                <dd className="text-neutral-700">
                  {item.createdAt.toLocaleString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-24 shrink-0 text-neutral-400">IP address</dt>
                <dd className="font-mono text-xs text-neutral-500">{ipDisplay}</dd>
              </div>
              {item.userAgent && (
                <div className="flex gap-3">
                  <dt className="w-24 shrink-0 text-neutral-400">User agent</dt>
                  <dd className="break-all font-mono text-xs text-neutral-500">
                    {item.userAgent}
                  </dd>
                </div>
              )}
              {item.handledAt && (
                <div className="flex gap-3">
                  <dt className="w-24 shrink-0 text-neutral-400">Handled</dt>
                  <dd className="text-neutral-700">
                    {item.handledAt.toLocaleString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </dd>
                </div>
              )}
            </dl>
          </section>
        </div>

        {/* ── Right: status + notes panel ───────────────────────────── */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Manage
          </h3>
          <SubmissionUpdateForm item={item} />
        </div>
      </div>
    </div>
  );
}
