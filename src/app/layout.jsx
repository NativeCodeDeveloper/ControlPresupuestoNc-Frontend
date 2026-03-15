import '../index.css';
import FinanceProviderWrapper from '../components/providers/FinanceProviderWrapper';

export const metadata = {
    title: 'NativeCode Finance',
    description: 'Plataforma de control financiero para decisiones ejecutivas',
};

export default function RootLayout({ children }) {
    return (
        <html lang="es">
            <body>
                <FinanceProviderWrapper>
                    {children}
                </FinanceProviderWrapper>
            </body>
        </html>
    );
}
