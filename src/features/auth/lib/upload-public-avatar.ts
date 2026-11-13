import "../../../shared/api/client";
import { uploadToStorage } from "../../../generated/sdk.gen";
import type { UploadToStorageResponse } from "../../../generated/types.gen";

function readUpload(result: unknown): UploadToStorageResponse | undefined {
  if (typeof result !== "object" || result === null || !("data" in result)) return undefined;
  const data = (result as { data?: UploadToStorageResponse }).data;
  if (!data || typeof data.uploadUrl !== "string" || typeof data.objectKey !== "string") return undefined;
  return data;
}

/** Public avatar keys are stored under the `public/` prefix. */
export function asPublicObjectKey(objectKey: string): string {
  if (objectKey.startsWith("public/")) return objectKey;
  return `public/${objectKey}`;
}

export type PublicAvatarUpload = {
  downloadUrl?: string;
  objectKey: string;
};

async function putToPresignedUrl(uploadUrl: string, file: File): Promise<void> {
  // Presigned URLs carry their own auth — do not send the API Bearer header.
  const response = await globalThis.fetch(uploadUrl, {
    body: file,
    headers: file.type ? { "Content-Type": file.type } : undefined,
    method: "PUT",
  });
  if (!response.ok) {
    throw new Error("The image could not be uploaded.");
  }
}

/**
 * Public file flow: request a public landing-zone URL, PUT the bytes, return the
 * object key for `avatarKey`. Profile save (not `/test/storage/confirm-public`)
 * moves landing-zone → permanent public store.
 */
export async function uploadPublicAvatar(file: File): Promise<PublicAvatarUpload> {
  const result = await uploadToStorage({ body: { isPublic: true } });
  const upload = readUpload(result);
  if (!upload) throw new Error("The upload URL could not be created.");

  const objectKey = asPublicObjectKey(upload.objectKey);
  await putToPresignedUrl(upload.uploadUrl, file);
  return {
    objectKey,
    downloadUrl: typeof upload.downloadUrl === "string" ? upload.downloadUrl : undefined,
  };
}
