function getEnv() {
  if (typeof process !== 'undefined' && process.env) {
    return {
      GITHUB_TOKEN: process.env['VITE_GITHUB_TOKEN'] ?? '',
      USE_CACHE: process.env['VITE_USE_CACHE'] === 'true'
    };
  }

  if (typeof import.meta !== 'undefined') {
    const viteEnv = (import.meta as any).env ?? {};
    return {
      GITHUB_TOKEN: viteEnv['VITE_GITHUB_TOKEN'] ?? '',
      USE_CACHE: viteEnv['VITE_USE_CACHE'] === 'true'
    };
  }

  return {
    GITHUB_TOKEN: '',
    USE_CACHE: false
  };
}

export const env = getEnv();