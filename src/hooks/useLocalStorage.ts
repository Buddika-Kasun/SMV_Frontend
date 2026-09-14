import { useState, useEffect } from "react";
import { storageService } from "../services/storage.service";

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    return storageService.get(key, initialValue);
  });

  useEffect(() => {
    storageService.set(key, storedValue);
  }, [key, storedValue]);

  const setValue = (value: T) => {
    setStoredValue(value);
  };

  return [storedValue, setValue];
}
