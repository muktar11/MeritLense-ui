import type { AxiosInstance } from "axios"

// The page language (from the /en or /ar route), sent with every API
// request so the backend answers with Arabic messages on the Arabic site
// (api/core/error_i18n.py).
export function pageLanguage(): "ar" | "en" {
  if (typeof window === "undefined") return "en"
  return window.location.pathname.split("/")[1] === "ar" ? "ar" : "en"
}

export function withPageLanguage<T extends AxiosInstance>(instance: T): T {
  instance.interceptors.request.use((config) => {
    config.headers.set("Accept-Language", pageLanguage())
    return config
  })
  return instance
}
