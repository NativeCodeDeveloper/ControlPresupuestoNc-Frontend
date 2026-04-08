'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const THEME_STORAGE_KEY = 'nativecode-theme';
const VALID_THEMES = ['light', 'dark', 'system'];

const ThemeContext = createContext({
    theme: 'dark',
    resolvedTheme: 'dark',
    setTheme: () => { },
});

function isValidTheme(theme) {
    return VALID_THEMES.includes(theme);
}

function getSystemTheme() {
    if (typeof window === 'undefined') {
        return 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(() => {
        if (typeof window === 'undefined') {
            return 'dark';
        }
        const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
        return isValidTheme(savedTheme) ? savedTheme : 'dark';
    });
    const [resolvedTheme, setResolvedTheme] = useState('dark');

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const applyTheme = (currentTheme) => {
            const nextResolvedTheme = currentTheme === 'system' ? getSystemTheme() : currentTheme;
            setResolvedTheme(nextResolvedTheme);

            document.documentElement.classList.toggle('dark', nextResolvedTheme === 'dark');
            document.documentElement.dataset.theme = nextResolvedTheme;
        };

        applyTheme(theme);
        window.localStorage.setItem(THEME_STORAGE_KEY, theme);

        const onSystemChange = () => {
            if (theme === 'system') {
                applyTheme('system');
            }
        };

        mediaQuery.addEventListener('change', onSystemChange);
        return () => mediaQuery.removeEventListener('change', onSystemChange);
    }, [theme]);

    const value = useMemo(() => ({
        theme,
        resolvedTheme,
        setTheme,
    }), [theme, resolvedTheme]);

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    return useContext(ThemeContext);
}

export { THEME_STORAGE_KEY, VALID_THEMES };
