let queued: string[] = [];

export function queueScanImages(images: string[]): void {
  queued = images;
}

export function peekScanImages(): string[] {
  return queued;
}
