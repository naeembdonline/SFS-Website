"use client";

import { useActionState, useState } from "react";
import { updateMediaTranslationsAction, deleteMediaAction } from "@/lib/actions/media";
import type { ActionState } from "@/lib/auth/with-admin";
import type { AdminMediaDetail, AdminMediaItem } from "@/lib/data/admin/media";

export function MediaLibrary({
  mediaItems,
  selected,
}: {
  mediaItems: AdminMediaItem[];
  selected: AdminMediaDetail | null;
}) {
  const [uploadState, setUploadState] = useState<string>("");
  const [translationsState, translationsAction, translationsPending] = useActionState<ActionState, FormData>(
    selected ? updateMediaTranslationsAction.bind(null, selected.id) : (async () => null),
    null
  );
  const [deleteState, deleteAction, deletePending] = useActionState<ActionState, FormData>(
    deleteMediaAction,
    null
  );

  async function onUpload(file: File) {
    const sign = await fetch("/api/admin/media/sign", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ filename: file.name, mime: file.type }),
    });
    if (!sign.ok) {
      setUploadState("Failed to sign upload");
      return;
    }
    const signed = await sign.json();
    const put = await fetch(signed.uploadUrl, { method: "PUT", headers: { "content-type": file.type }, body: file });
    if (!put.ok) {
      setUploadState("Upload failed");
      return;
    }
    const commit = await fetch("/api/admin/media/commit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ storageKey: signed.storageKey, bucket: signed.bucket, originalFilename: file.name }),
    });
    if (!commit.ok) {
      setUploadState("Commit failed");
      return;
    }
    setUploadState("Uploaded successfully. Refresh to see new media.");
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        <label className="block rounded-xl border border-dashed border-neutral-300 bg-white p-6 text-center text-sm text-neutral-600">
          <input
            type="file"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void onUpload(file);
            }}
          />
          Click to upload media
        </label>
        {uploadState && <p className="text-sm text-neutral-600">{uploadState}</p>}

        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50">
                <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wider text-neutral-400">ID</th>
                <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wider text-neutral-400">Key</th>
                <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wider text-neutral-400">MIME</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {mediaItems.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3">{item.id}</td>
                  <td className="px-4 py-3 font-mono text-xs">{item.storageKey}</td>
                  <td className="px-4 py-3">{item.mime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="space-y-4 rounded-xl border border-neutral-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-neutral-900">Media #{selected.id}</h3>
          <p className="text-xs text-neutral-500">{selected.storageKey}</p>
          <form action={translationsAction} className="space-y-3">
            {(["bn", "en", "ar"] as const).map((locale) => (
              <fieldset key={locale} className="space-y-2 rounded border border-neutral-200 p-2">
                <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">{locale.toUpperCase()}</legend>
                <input name={`${locale}_alt_text`} defaultValue={selected.translations[locale].altText ?? ""} placeholder="Alt text" className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
                <textarea name={`${locale}_caption`} defaultValue={selected.translations[locale].caption ?? ""} placeholder="Caption" rows={2} className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
              </fieldset>
            ))}
            <button disabled={translationsPending} className="rounded-md bg-[#0B3D2E] px-3 py-2 text-xs font-medium text-white">
              {translationsPending ? "Saving..." : "Save translations"}
            </button>
          </form>
          {translationsState && !translationsState.ok && <p className="text-xs text-red-500">{translationsState.error}</p>}

          <form action={deleteAction}>
            <input type="hidden" name="mediaId" value={selected.id} />
            <button disabled={deletePending} className="rounded-md border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50">
              Delete media (admin only)
            </button>
          </form>
          {deleteState && !deleteState.ok && <p className="text-xs text-red-500">{deleteState.error}</p>}
        </div>
      )}
    </div>
  );
}
