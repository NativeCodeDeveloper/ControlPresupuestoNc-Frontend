'use client';

import { FinanceProvider } from '../../context/FinanceContext';

export default function FinanceProviderWrapper({ children }) {
    return <FinanceProvider>{children}</FinanceProvider>;
}
