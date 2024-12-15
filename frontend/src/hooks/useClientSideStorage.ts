import { useState, useEffect, Dispatch, SetStateAction } from "react";

function useClientSideStorage<T>(key: string, defaultValue: T): [T, Dispatch<SetStateAction<T>>] {
    const [value, setValue] = useState<T>(() => {
        // Initial value logic
        if (typeof window === "undefined") {
            return defaultValue; // Return the default value during SSR
        }
        try {
            const storedValue = localStorage.getItem(key);
            return storedValue !== null ? (JSON.parse(storedValue) as T) : defaultValue;
        } catch (error) {
            console.warn(`Error reading localStorage key "${key}":`, error);
            return defaultValue;
        }
    });

    useEffect(() => {
        // Sync with localStorage whenever `key` or `value` changes
        if (typeof window !== "undefined") {
            try {
                localStorage.setItem(key, JSON.stringify(value));
            } catch (error) {
                console.warn(`Error setting localStorage key "${key}":`, error);
            }
        }
    }, [key, value]);

    return [value, setValue];
}

export default useClientSideStorage;
