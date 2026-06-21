import type { Product, ProfileData, TryOnTask } from "./types";

const TOKEN_KEY = "clothApiToken";
const DEVICE_KEY = "clothDeviceId";
const PASSWORD_KEY = "clothAccessPassword";
const API_PREFIX = window.location.pathname.startsWith("/cloth") ? "/cloth-api" : "/api";

function randomId() {
  // crypto.randomUUID 仅在安全上下文(HTTPS/localhost)可用；纯 http 下降级
  const c = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID();
  if (c?.getRandomValues) {
    const b = c.getRandomValues(new Uint8Array(16));
    return Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  }
  return `${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
}

function deviceId() {
  let value = localStorage.getItem(DEVICE_KEY);
  if (!value) {
    value = `${Date.now()}-${randomId()}`;
    localStorage.setItem(DEVICE_KEY, value);
  }
  return value;
}

async function login() {
  const response = await fetch(`${API_PREFIX}/auth/dev`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      deviceId: deviceId(),
      password: localStorage.getItem(PASSWORD_KEY) || "",
    }),
  });
  const data = await response.json();
  if (!response.ok || !data.token) {
    throw new Error(data?.error?.message || "登录失败");
  }
  localStorage.setItem(TOKEN_KEY, data.token);
  return data.token as string;
}

export function isAuthenticated() {
  return !!localStorage.getItem(TOKEN_KEY);
}

/** 用访问密码登录：成功则记住密码与 token，失败抛错并清掉密码 */
export async function authenticate(password: string) {
  localStorage.setItem(PASSWORD_KEY, password);
  try {
    await login();
  } catch (err) {
    localStorage.removeItem(PASSWORD_KEY);
    localStorage.removeItem(TOKEN_KEY);
    throw err;
  }
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(PASSWORD_KEY);
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
