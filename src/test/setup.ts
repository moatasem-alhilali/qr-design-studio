import "@testing-library/jest-dom";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

/*
  This jsdom build exposes `localStorage` as a bare object with none of the
  Storage methods on it, so anything that persists — designs, locale, the auth
  session, sync links — would silently no-op under test and hide real bugs.
  A minimal in-memory Storage stands in.
*/
function createMemoryStorage(): Storage {
  let entries = new Map<string, string>();

  return {
    get length() {
      return entries.size;
    },
    key: (index: number) => Array.from(entries.keys())[index] ?? null,
    getItem: (key: string) => (entries.has(key) ? (entries.get(key) as string) : null),
    setItem: (key: string, value: string) => {
      entries.set(key, String(value));
    },
    removeItem: (key: string) => {
      entries.delete(key);
    },
    clear: () => {
      entries = new Map<string, string>();
    },
  } as Storage;
}

if (typeof window.localStorage?.setItem !== "function") {
  Object.defineProperty(window, "localStorage", { writable: true, value: createMemoryStorage() });
}

if (typeof window.sessionStorage?.setItem !== "function") {
  Object.defineProperty(window, "sessionStorage", { writable: true, value: createMemoryStorage() });
}
