export async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    credentials: "include",
    cache: "no-store",
  });
  const text = await res.text().catch(() => "");
  const data =
    text && res.headers.get("content-type")?.includes("application/json")
      ? JSON.parse(text)
      : {};
  if (!res.ok)
    throw Object.assign(
      new Error((data as any)?.error || "Permintaan gagal."),
      { status: res.status, data },
    );
  return (data as T) ?? ({} as T);
}
export async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "include", cache: "no-store" });
  const text = await res.text().catch(() => "");
  const data =
    text && res.headers.get("content-type")?.includes("application/json")
      ? JSON.parse(text)
      : {};
  if (!res.ok)
    throw Object.assign(
      new Error((data as any)?.error || "Permintaan gagal."),
      { status: res.status, data },
    );
  return (data as T) ?? ({} as T);
}
