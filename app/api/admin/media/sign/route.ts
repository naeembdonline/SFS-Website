import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getSession } from "@/lib/auth/session";
import { r2Client, r2Config } from "@/lib/media/r2";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as { filename?: string; mime?: string };
  const filename = body.filename ?? "upload.bin";
  const mime = body.mime ?? "";
  if (!ALLOWED_MIME.has(mime)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  }

  const ext = filename.includes(".") ? filename.slice(filename.lastIndexOf(".")).toLowerCase() : "";
  const storageKey = `uploads/${randomUUID()}${ext}`;
  const bucket = mime.startsWith("image/") ? r2Config.bucketPublic : r2Config.bucketPrivate;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: storageKey,
    ContentType: mime,
  });
  const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 60 * 10 });

  return NextResponse.json({
    storageKey,
    bucket,
    uploadUrl,
    expiresIn: 600,
  });
}
