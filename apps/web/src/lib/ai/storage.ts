import { S3Client } from "bun";
import { env } from "@kestrel-path/env/server";
import { put } from "@vercel/blob";

type StoredTranscriptObject = {
  pathname: string;
  url: string;
};

let s3Client: S3Client | null = null;

function getConfiguredS3Client() {
  if (s3Client) {
    return s3Client;
  }

  if (
    !env.S3_ENDPOINT ||
    !env.S3_BUCKET ||
    !env.S3_REGION ||
    !env.S3_ACCESS_KEY_ID ||
    !env.S3_SECRET_ACCESS_KEY
  ) {
    throw new Error(
      "S3 storage is not fully configured. Set S3_ENDPOINT, S3_BUCKET, S3_REGION, S3_ACCESS_KEY_ID, and S3_SECRET_ACCESS_KEY.",
    );
  }

  s3Client = new S3Client({
    region: env.S3_REGION,
    endpoint: env.S3_ENDPOINT,
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    bucket: env.S3_BUCKET,
  });

  return s3Client;
}

function encodeObjectPath(pathname: string) {
  return pathname
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function getS3PublicUrl(pathname: string) {
  if (!env.S3_BUCKET) {
    throw new Error("S3_BUCKET must be configured when using S3 storage.");
  }

  const baseUrl = (env.S3_PUBLIC_URL ?? env.S3_ENDPOINT ?? "").replace(/\/$/, "");
  if (!baseUrl) {
    throw new Error("S3_PUBLIC_URL or S3_ENDPOINT must be configured when using S3 storage.");
  }

  return `${baseUrl}/${env.S3_BUCKET}/${encodeObjectPath(pathname)}`;
}

async function uploadToS3(pathname: string, file: File): Promise<StoredTranscriptObject> {
  const client = getConfiguredS3Client();

  await client.write(pathname, file, {
    type: file.type || "text/plain",
    acl: "public-read",
  });

  return {
    pathname,
    url: getS3PublicUrl(pathname),
  };
}

async function uploadToVercelBlob(pathname: string, file: File): Promise<StoredTranscriptObject> {
  const blob = await put(pathname, file, {
    access: "public",
    addRandomSuffix: false,
    contentType: file.type || "text/plain",
  });

  return {
    pathname: blob.pathname,
    url: blob.url,
  };
}

export async function uploadTranscriptObject(
  pathname: string,
  file: File,
): Promise<StoredTranscriptObject> {
  if (env.STORAGE_PROVIDER === "s3") {
    return uploadToS3(pathname, file);
  }

  return uploadToVercelBlob(pathname, file);
}
