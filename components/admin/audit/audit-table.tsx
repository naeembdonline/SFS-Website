import type { AdminAuditLogItem } from "@/lib/data/admin/audit";

export function AuditTable({ logs }: { logs: AdminAuditLogItem[] }) {
  if (logs.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-neutral-300 bg-white py-16 text-center">
        <p className="text-sm text-neutral-400">No audit log entries found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-neutral-100 bg-neutral-50">
            <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wider text-neutral-400">
              When
            </th>
            <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Actor
            </th>
            <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Action
            </th>
            <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Entity
            </th>
            <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wider text-neutral-400">
              IP
            </th>
            <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Diff
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {logs.map((log) => (
            <tr key={log.id} className="align-top hover:bg-neutral-50/50">
              <td className="whitespace-nowrap px-4 py-3 text-xs text-neutral-500">
                <time dateTime={log.at.toISOString()}>{formatDate(log.at)}</time>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-col">
                  <span className="font-medium text-neutral-900">
                    {log.actorDisplayName ?? log.actorEmail ?? "System"}
                  </span>
                  {log.actorEmail && log.actorDisplayName && (
                    <span className="text-xs text-neutral-400">
                      {log.actorEmail}
                    </span>
                  )}
                  {log.actorRole && (
                    <span className="mt-1 w-fit rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-neutral-500">
                      {log.actorRole}
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3">
                <code className="rounded bg-neutral-100 px-2 py-1 text-xs text-neutral-700">
                  {log.action}
                </code>
              </td>
              <td className="px-4 py-3 text-neutral-600">
                {log.entityType ? (
                  <div className="flex flex-col">
                    <span>{log.entityType}</span>
                    {log.entityId && (
                      <span className="text-xs text-neutral-400">
                        #{log.entityId}
                      </span>
                    )}
                    {log.localeAffected && (
                      <span className="text-xs uppercase text-neutral-400">
                        {log.localeAffected}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-neutral-400">None</span>
                )}
              </td>
              <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-neutral-500">
                {log.ip ?? "not stored"}
              </td>
              <td className="min-w-72 px-4 py-3">
                {log.diff ? (
                  <details className="group">
                    <summary className="cursor-pointer text-xs font-medium text-[#0B3D2E]">
                      View diff
                    </summary>
                    <pre className="mt-2 max-h-72 overflow-auto rounded-lg bg-neutral-950 p-3 text-xs leading-relaxed text-neutral-100">
                      {safeStringify(log.diff)}
                    </pre>
                  </details>
                ) : (
                  <span className="text-xs text-neutral-400">No diff</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function safeStringify(value: unknown): string {
  return JSON.stringify(value, (_key, nestedValue) => {
    if (typeof nestedValue === "bigint") return nestedValue.toString();
    return nestedValue;
  }, 2);
}
