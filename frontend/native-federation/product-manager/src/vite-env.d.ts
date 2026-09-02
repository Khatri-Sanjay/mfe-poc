interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_REFRESH_ENDPOINT?: string;
  readonly VITE_REFRESH_TOKEN_FIELD?: string;
  readonly VITE_LOGIN_URL?: string;
  readonly VITE_REDIRECT_ON_MISSING_AUTH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
