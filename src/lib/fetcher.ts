export async function fetcher<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "Request failed");
  }

  return payload.data as T;
}

export async function mutateJson<T>(url: string, method: "POST" | "PUT" | "DELETE", body?: unknown) {
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "Action failed");
  }

  return payload.data as T;
}
