import type { Product, ProfileData, TryOnTask } from "./types";

const TOKEN_KEY = "clothApiToken";
const DEVICE_KEY = "clothDeviceId";
const API_PREFIX = window.location.pathname.startsWith("/cloth") ? "/cloth-api" : "/api";

function deviceId() {
  let value = localStorage.getItem(DEVICE_KEY);
  if (!value) {
    value = `${Date.now()}-${crypto.randomUUID()}`;
    localStorage.setItem(DEVICE_KEY, value);
  }
  return value;
}

async function login() {
  const response = await fetch(`${API_PREFIX}/auth/dev`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deviceId: deviceId() }),
  });
  const data = await response.json();
  if (!response.ok || !data.token) {
    throw new Error(data?.error?.message || "登录失败");
  }
  localStorage.setItem(TOKEN_KEY, data.token);
  return data.token as string;
}

async function request<T>(
  path: string,
  options: RequestInit & { retry?: boolean } = {},
): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY) || (await login());
  const response = await fetch(path, {
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });
  if (response.status === 401 && options.retry !== false) {
    localStorage.removeItem(TOKEN_KEY);
    await login();
    return request<T>(path, { ...options, retry: false });
  }
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || "服务请求失败");
  return data as T;
}

async function upload<T>(path: string, file: File) {
  const form = new FormData();
  form.append("file", file);
  return request<T>(path, { method: "POST", body: form });
}

export const api = {
  getProfile: () => request<ProfileData | null>(`${API_PREFIX}/profile`),
  saveProfile: (profile: ProfileData) =>
    request<ProfileData>(`${API_PREFIX}/profile`, {
      method: "PUT",
      body: JSON.stringify(profile),
    }),
  uploadProfilePhoto: (file: File) =>
    upload<{ fileId: string; url: string }>(`${API_PREFIX}/files/profile-photo`, file),
  uploadGarment: (file: File) => upload<Product>(`${API_PREFIX}/products/upload`, file),
  parseProduct: (url: string) =>
    request<Product>(`${API_PREFIX}/products/parse`, {
      method: "POST",
      body: JSON.stringify({ url }),
    }),
  createTask: (productId: string, model: string, garmentType: string) =>
    request<TryOnTask>(`${API_PREFIX}/tasks`, {
      method: "POST",
      body: JSON.stringify({ productId, model, garmentType }),
    }),
  getTask: (id: string) => request<TryOnTask>(`${API_PREFIX}/tasks/${id}`),
  listTasks: () => request<TryOnTask[]>(`${API_PREFIX}/tasks`),
  deleteTask: (id: string) =>
    request<{ deleted: boolean }>(`${API_PREFIX}/tasks/${id}`, { method: "DELETE" }),
  clearUserData: () =>
    request<{ deleted: boolean }>(`${API_PREFIX}/user/data`, { method: "DELETE" }),
};
