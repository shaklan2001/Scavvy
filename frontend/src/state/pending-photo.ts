import type { VerificationPhoto } from "@/src/types";

let queued: VerificationPhoto | null = null;

export function queueVerificationPhoto(photo: VerificationPhoto | null): void {
  queued = photo;
}

export function peekVerificationPhoto(): VerificationPhoto | null {
  return queued;
}
