import type { Metadata } from "next";
import Link from "next/link";
import { LeadershipEditor } from "@/components/admin/editor/leadership-editor";

export const metadata: Metadata = { title: "New leadership member" };

export default function NewLeadershipPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <nav className="mb-4 flex items-center gap-2 text-sm text-neutral-400">
        <Link href="/admin/leadership" className="hover:text-neutral-700">
          Leadership
        </Link>
        <span>/</span>
        <span className="text-neutral-600">New member</span>
      </nav>
      <LeadershipEditor />
    </div>
  );
}
