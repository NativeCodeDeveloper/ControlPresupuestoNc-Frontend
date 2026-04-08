'use client';

import { FinanceProvider } from '../../context/FinanceContext';
import { ThemeProvider } from '../../context/ThemeContext';

export default function FinanceProviderWrapper({ children }) {
    return (
        <ThemeProvider>
            <FinanceProvider>{children}</FinanceProvider>
        </ThemeProvider>
    );
}
