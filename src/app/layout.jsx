import '../index.css';
import Script from 'next/script';
import FinanceProviderWrapper from '../components/providers/FinanceProviderWrapper';

export const metadata = {
    title: 'NativeCode Finance',
    description: 'Plataforma de control financiero para decisiones ejecutivas',
};

export default function RootLayout({ children }) {
    const THEME_STORAGE_KEY = 'nativecode-theme';
    const noFlashThemeScript = `
        (function() {
            try {
                var storedTheme = localStorage.getItem('${THEME_STORAGE_KEY}') || 'dark';
                var isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                var resolvedTheme = storedTheme === 'system' ? (isSystemDark ? 'dark' : 'light') : storedTheme;

                document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
                document.documentElement.dataset.theme = resolvedTheme;
            } catch (error) {
                document.documentElement.classList.add('dark');
                document.documentElement.dataset.theme = 'dark';
            }
        })();
    `;

    return (
        <html lang="es" suppressHydrationWarning>
            <head>
                <Script id="theme-init" strategy="beforeInteractive">
                    {noFlashThemeScript}
                </Script>
            </head>
            <body>
                <FinanceProviderWrapper>
                    {children}
                </FinanceProviderWrapper>
            </body>
        </html>
    );
}
