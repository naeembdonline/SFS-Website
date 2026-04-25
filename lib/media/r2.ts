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

export const r2Config = {
  accountId: required("R2_ACCOUNT_ID"),
  accessKeyId: required("R2_ACCESS_KEY_ID"),
  secretAccessKey: required("R2_SECRET_ACCESS_KEY"),
  bucketPublic: required("R2_BUCKET_PUBLIC"),
  bucketPrivate: required("R2_BUCKET_PRIVATE"),
};

export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${r2Config.accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: r2Config.accessKeyId,
    secretAccessKey: r2Config.secretAccessKey,
  },
});
