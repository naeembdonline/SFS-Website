import { NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSession } from "@/lib/auth/session";
import { r2Client, r2Config } from "@/lib/media/r2";
import { sha256Hex, sniffMime } from "@/lib/media/process";
import { commitMedia } from "@/lib/data/admin/media";

async function streamToUint8Array(stream: unknown): Promise<Uint8Array> {
  if (!stream || typeof stream !== "object" || !("transformToByteArray" in stream)) {
    throw new Error("Invalid stream");
  }
  return (stream as { transformToByteArray: () => Promise<Uint8Array> }).transformToByteArray();
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as {
    storageKey?: string;
    bucket?: string;
    originalFilename?: string;
  };
  if (!body.storageKey || !body.bucket) {
    return NextResponse.json({ error: "storageKey and bucket are required" }, { status: 400 });
  }

  const sourceBucket =
    body.bucket === r2Config.bucketPublic || body.bucket === r2Config.bucketPrivate
      ? body.bucket
      : null;
  if (!sourceBucket) return NextResponse.json({ error: "Invalid bucket" }, { status: 400 });

  // Fetch the uploaded file from R2 — also confirms the object exists
  const object = await r2Client.send(
    new GetObjectCommand({ Bucket: sourceBucket, Key: body.storageKey })
  );
  const fileBytes = await streamToUint8Array(object.Body);

  // Server-side MIME detection (overrides any client-declared type)
  const mime = sniffMime(fileBytes.slice(0, 32));
  if (!mime) return NextResponse.json({ error: "Could not detect MIME type" }, { status: 400 });

  // Checksum via Web Crypto (edge-compatible)
  const checksum = await sha256Hex(fileBytes);

  const result = await commitMedia({
    storageKey: body.storageKey,
    bucket: sourceBucket === r2Config.bucketPublic ? "public" : "private",
    originalFilename: body.originalFilename ?? null,
    mime,
    bytes: fileBytes.byteLength,
    checksumSha256: checksum,
    uploadedByUserId: session.user.id,
    actorRole: session.user.role,
    requestId: crypto.randomUUID(),
    ip: undefined,
    userAgent: req.headers.get("user-agent") ?? undefined,
  });

  return NextResponse.json(result);
}
