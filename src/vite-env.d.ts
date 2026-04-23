/// <reference types="vite/client" />

interface ImportMetaGlob {
  (pattern: string, options?: { eager?: boolean; import?: string }): Record<string, unknown>;
}

interface ImportMeta {
  glob: ImportMetaGlob;
}
