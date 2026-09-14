export class StorageService {
  private static instance: StorageService;

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  get<T>(key: string, defaultValue: T): T {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Check if parsed data is valid
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed as T;
        }
        // For non-array data
        if (parsed !== null && typeof parsed === "object") {
          return parsed as T;
        }
      }
    } catch (err) {
      console.warn(`Failed to parse saved data for key: ${key}`, err);
    }
    return defaultValue;
  }

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.error(`Error saving data for key: ${key}`, err);
    }
  }

  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (err) {
      console.error(`Error removing data for key: ${key}`, err);
    }
  }

  clear(): void {
    try {
      localStorage.clear();
    } catch (err) {
      console.error("Error clearing localStorage", err);
    }
  }

  has(key: string): boolean {
    return localStorage.getItem(key) !== null;
  }

  getItem(key: string): string | null {
    return localStorage.getItem(key);
  }

  setItem(key: string, value: string): void {
    localStorage.setItem(key, value);
  }
}

export const storageService = StorageService.getInstance();
