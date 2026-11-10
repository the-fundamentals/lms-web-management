declare global {
  interface ImportMetaEnv {
    readonly VITE_API_BASE_URL?: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

/**
 * API origin for the generated client. Public Vite env only. No secret is stored.
 */
export function readApiBaseUrl(): string {
  const value = import.meta.env.VITE_API_BASE_URL;
  return typeof value === "string" ? value : "";
}
