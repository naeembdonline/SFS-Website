import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getAdminLeadershipById } from "@/lib/data/admin/leadership";
import { LeadershipEditor } from "@/components/admin/editor/leadership-editor";
import { LeadershipControls } from "@/components/admin/leadership/controls";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const member = await getAdminLeadershipById(Number(id));
  if (!member) return { title: "Not found" };
  const name = member.translations.find((t) => t.locale === "bn")?.name;
  return { title: name ? `Edit: ${name}` : "Edit member" };
}

export default function LeadershipEditPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={null}>
      <LeadershipEditContent params={params} />
    </Suspense>
  );
}

async function LeadershipEditContent({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (Number.isNaN(id)) notFound();
  const member = await getAdminLeadershipById(id);
  if (!member || member.deletedAt) notFound();

  return (
    <div className="mx-auto max-w-4xl">
      <nav className="mb-4 flex items-center gap-2 text-sm text-neutral-400">
        <Link href="/admin/leadership" className="hover:text-neutral-700">
          Leadership
        </Link>
        <span>/</span>
        <span className="text-neutral-600 line-clamp-1">
          {member.translations.find((t) => t.locale === "bn")?.name ?? `Member #${id}`}
        </span>
      </nav>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_260px]">
        <LeadershipEditor
          leadershipId={id}
          displayOrder={member.displayOrder}
          isVisible={member.isVisible}
          photoMediaId={member.photoMediaId}
          translations={member.translations}
        />
        <LeadershipControls leadershipId={id} isVisible={member.isVisible} />
      </div>
    </div>
  );
}
