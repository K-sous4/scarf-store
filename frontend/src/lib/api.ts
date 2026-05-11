const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000"

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown
}

type FormRequestOptions = Omit<RequestInit, "body"> & {
  body?: FormData
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, ...rest } = options

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Erro desconhecido" }))
    throw new ApiError(response.status, error.detail ?? "Erro desconhecido")
  }

  // 204 No Content
  if (response.status === 204) return undefined as T

  return response.json() as Promise<T>
}

async function requestForm<T>(path: string, formData: FormData, options: FormRequestOptions = {}): Promise<T> {
  const { headers, ...rest } = options

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    credentials: "include",
    headers: {
      ...headers,
    },
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Erro desconhecido" }))
    throw new ApiError(response.status, error.detail ?? "Erro desconhecido")
  }

  if (response.status === 204) return undefined as T

  return response.json() as Promise<T>
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message)
    this.name = "ApiError"
  }
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { method: "GET", ...options }),

  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { method: "POST", body, ...options }),

  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { method: "PUT", body, ...options }),

  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { method: "DELETE", ...options }),

  postForm: <T>(path: string, formData: FormData, options?: FormRequestOptions) =>
    requestForm<T>(path, formData, { method: "POST", ...options }),
}
