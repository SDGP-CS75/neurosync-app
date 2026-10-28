import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "./firebase";

const MAX_PROFILE_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
]);

export interface ProfileImageInput {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
  file?: Blob | null;
}

function normalizeImageType(value: string | null | undefined): string {
  const normalized = (value || "").split(";")[0].trim().toLowerCase();
  return normalized === "image/jpg" ? "image/jpeg" : normalized;
}

function inferImageType(input: ProfileImageInput, blob: Blob): string {
  const candidates = [
    input.mimeType,
    blob.type,
    input.fileName,
    input.uri,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeImageType(candidate);
    if (ALLOWED_IMAGE_TYPES.has(normalized)) return normalized;
  }

  const extension = (input.fileName || input.uri).split("?")[0].split(".").pop();
  switch (extension?.toLowerCase()) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    case "heic":
      return "image/heic";
    case "heif":
      return "image/heif";
    default:
      throw new Error("Please choose a JPEG, PNG, WebP, GIF, HEIC, or HEIF image.");
  }
}

async function resolveImageBlob(input: ProfileImageInput): Promise<Blob> {
  if (input.file) return input.file;

  const response = await fetch(input.uri);
  if (!response.ok) {
    throw new Error("Could not read the selected image.");
  }
  return response.blob();
}

export async function uploadProfileImage(
  userId: string,
  input: ProfileImageInput
): Promise<string> {
  if (!userId) throw new Error("You must be signed in to update your profile image.");

  const blob = await resolveImageBlob(input);
  if (blob.size <= 0) throw new Error("The selected image is empty.");
  if (blob.size >= MAX_PROFILE_IMAGE_BYTES) {
    throw new Error("Profile images must be smaller than 5 MB.");
  }

  const contentType = inferImageType(input, blob);
  const storageRef = ref(storage, `users/${userId}/profile/avatar`);
  await uploadBytes(storageRef, blob, {
    contentType,
    cacheControl: "public,max-age=3600",
  });
  return getDownloadURL(storageRef);
}
