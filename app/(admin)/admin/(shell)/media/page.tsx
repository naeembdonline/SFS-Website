import type { Metadata } from "next";
import { MediaLibrary } from "@/components/admin/media/media-library";
import { getAdminMediaById, getAdminMediaList } from "@/lib/data/admin/media";

export const metadata: Metadata = { title: "Media" };

export default async function MediaPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  const mediaItems = await getAdminMediaList();
  const selected = id ? await getAdminMediaById(Number(id)) : mediaItems[0] ? await getAdminMediaById(mediaItems[0].id) : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-neutral-900">Media Library</h2>
        <p className="mt-0.5 text-sm text-neutral-500">Upload to R2, commit with MIME sniffing, and manage metadata.</p>
      </div>
      <MediaLibrary mediaItems={mediaItems} selected={selected} />
    </div>
  );
}
