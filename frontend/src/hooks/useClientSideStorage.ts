import { useState, useEffect, Dispatch, SetStateAction } from "react";

function useClientSideStorage<T>(
    key: string,
    defaultValue: T
): [T, Dispatch<SetStateAction<T>>, boolean] {
    const [value, setValue] = useState<T>(defaultValue);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (typeof window !== "undefined") {
            try {
                const storedValue = localStorage.getItem(key);
                setValue(storedValue !== null ? (JSON.parse(storedValue) as T) : defaultValue);
            } catch (error) {
                console.warn(`Error reading localStorage key "${key}":`, error);
                setValue(defaultValue);
            } finally {
                setIsLoading(false); // Mark as loaded
            }
        }
    }, [key, defaultValue]);

    useEffect(() => {
        if (!isLoading) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
            } catch (error) {
                console.warn(`Error setting localStorage key "${key}":`, error);
            }
        }
    }, [key, value, isLoading]);

    return [value, setValue, isLoading];
}

export default useClientSideStorage;
