import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { r2Client, r2Config } from "@/lib/media/r2";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const mediaId = Number(id);
    if (!Number.isInteger(mediaId) || mediaId <= 0) {
      return NextResponse.json({ error: "Invalid media id" }, { status: 400 });
    }

    const [media] = await db
      .select({
        storageKey: schema.media.storageKey,
        bucket: schema.media.bucket,
        mime: schema.media.mime,
      })
      .from(schema.media)
      .where(eq(schema.media.id, mediaId))
      .limit(1);

    if (!media) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (media.bucket === "public") {
      const publicBase = process.env.R2_PUBLIC_URL?.replace(/\/$/, "");
      if (publicBase) {
        return NextResponse.redirect(`${publicBase}/${media.storageKey}`, 302);
      }
    }

    const bucketName =
      media.bucket === "public" ? r2Config.bucketPublic : r2Config.bucketPrivate;

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: media.storageKey,
    });
    const signedUrl = await getSignedUrl(r2Client, command, { expiresIn: 60 * 5 });

    return NextResponse.redirect(signedUrl, 302);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
