'use client';

import { useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { FinanceProvider } from '../../context/FinanceContext';
import { ThemeProvider } from '../../context/ThemeContext';
import { setTokenGetter } from '../../services/apiClient';

function ClerkTokenBridge() {
    const { getToken } = useAuth();
    useEffect(() => {
        setTokenGetter((opts) => getToken(opts));
        return () => setTokenGetter(null);
    }, [getToken]);
    return null;
}

export default function FinanceProviderWrapper({ children }) {
    return (
        <ThemeProvider>
            <ClerkTokenBridge />
            <FinanceProvider>{children}</FinanceProvider>
        </ThemeProvider>
    );
}
