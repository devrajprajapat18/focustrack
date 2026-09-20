export function parseNoteTags(value: string | null | undefined): string[] {
  if (!value) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((tag): tag is string => typeof tag === "string")
      : [];
  } catch {
    return [];
  }
}

export function serializeNoteTags(tags: string[] | undefined): string {
  return JSON.stringify(tags ?? []);
}
