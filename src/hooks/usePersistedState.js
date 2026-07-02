'use client';

import { useState, useEffect } from 'react';

/**
 * useState que persiste en localStorage.
 * SSR-safe: en el servidor retorna el defaultValue sin tocar localStorage.
 */
export function usePersistedState(key, defaultValue) {
    const [value, setValue] = useState(() => {
        if (typeof window === 'undefined') return defaultValue;
        try {
            const stored = localStorage.getItem(key);
            return stored !== null ? JSON.parse(stored) : defaultValue;
        } catch {
            return defaultValue;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch {}
    }, [key, value]);

    return [value, setValue];
}
