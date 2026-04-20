import type { ModuleRecord, ModuleSpecWire } from "./types";

const BASE = (import.meta.env.VITE_API_BASE ?? "http://localhost:8000").replace(/\/$/, "");
const TOKEN = import.meta.env.VITE_KOMPASS_TOKEN ?? "";

function headers(extra?: HeadersInit): HeadersInit {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (TOKEN) h["Authorization"] = `Bearer ${TOKEN}`;
  return { ...h, ...(extra ?? {}) };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { ...init, headers: headers(init?.headers) });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  listModules: () => request<ModuleSpecWire[]>("/api/modules"),
  getModule: <T>(id: string) => request<ModuleRecord<T>>(`/api/modules/${id}`),
  putModule: <T>(id: string, data: T) =>
    request<ModuleRecord<T>>(`/api/modules/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  health: () => request<{ status: string }>("/health"),
};
