import { S3Client } from "@aws-sdk/client-s3";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    if (process.env.NEXT_PHASE === "phase-production-build") {
      return "dummy";
    }
    throw new Error(`Missing env var: ${name}`);
  }
  return value;
}

function optional(name: string): string | undefined {
  return process.env[name];
}

export const r2Config = {
  accountId: required("R2_ACCOUNT_ID"),
  accessKeyId: required("R2_ACCESS_KEY_ID"),
  secretAccessKey: required("R2_SECRET_ACCESS_KEY"),
  bucketPublic: required("R2_BUCKET_PUBLIC"),
  bucketPrivate: required("R2_BUCKET_PRIVATE"),
  endpoint: optional("R2_ENDPOINT"),
  forcePathStyle: process.env.R2_FORCE_PATH_STYLE === "true",
};

const endpoint =
  r2Config.endpoint ||
  `https://${r2Config.accountId}.r2.cloudflarestorage.com`;

export const r2Client = new S3Client({
  region: "auto",
  endpoint,
  forcePathStyle: r2Config.forcePathStyle,
  credentials: {
    accessKeyId: r2Config.accessKeyId,
    secretAccessKey: r2Config.secretAccessKey,
  },
});
