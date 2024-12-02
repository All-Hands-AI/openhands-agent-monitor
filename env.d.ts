/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GITHUB_TOKEN: string;
  readonly VITE_USE_CACHE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}