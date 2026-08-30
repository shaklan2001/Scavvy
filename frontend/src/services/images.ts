const MAX_PER_IMAGE_CHARS = 6_000_000;
const MAX_TOTAL_CHARS = 2_400_000;

function compact(value: string): string {
  return value.replace(/\s/g, "");
}

function isBase64Payload(value: string): boolean {
  if (value.length < 8 || value.length > MAX_PER_IMAGE_CHARS) return false;
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    const isAlpha = (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
    const isDigit = code >= 48 && code <= 57;
    if (!isAlpha && !isDigit && code !== 43 && code !== 47 && code !== 61) return false;
  }
  return true;
}

/**
 * Normalize a camera/gallery payload into a data URL the Node API accepts.
 * File, blob, and http URIs cannot be posted as image bytes.
 */
export function toApiImage(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (
    trimmed.startsWith("file:") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("content:") ||
    trimmed.startsWith("http:") ||
    trimmed.startsWith("https:")
  ) {
    return null;
  }
  if (trimmed.startsWith("data:image/") && trimmed.includes(";base64,")) {
    const marker = ";base64,";
    const markerAt = trimmed.indexOf(marker);
    const encoded = compact(trimmed.slice(markerAt + marker.length));
    if (!isBase64Payload(encoded)) return null;
    const header = trimmed.slice(0, markerAt + marker.length);
    return `${header}${encoded}`;
  }
  const encoded = compact(trimmed);
  if (!isBase64Payload(encoded)) return null;
  return `data:image/jpeg;base64,${encoded}`;
}

export function toApiImages(values: string[] | null | undefined): string[] {
  if (!values?.length) return [];
  const normalized = values
    .map((value) => toApiImage(value))
    .filter((image): image is string => image !== null);

  const picked: string[] = [];
  let total = 0;
  for (const image of normalized) {
    if (picked.length >= 3) break;
    if (picked.length === 0) {
      picked.push(image);
      total += image.length;
      continue;
    }
    if (total + image.length > MAX_TOTAL_CHARS) continue;
    picked.push(image);
    total += image.length;
  }
  return picked;
}
