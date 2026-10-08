// Browser verification only. This alias is never part of the Wix build.
export const httpClient = {
  fetchWithAuth: (url: string, options?: RequestInit) => fetch(url, options),
};
