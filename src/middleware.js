import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
    '/dashboard(.*)',
    '/socios(.*)',
    '/gastos(.*)',
    '/ingresos(.*)',
    '/inversiones(.*)',
    '/reportes(.*)',
    '/flujo-caja(.*)',
    '/contabilidad(.*)',
    '/config(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
    if (isProtectedRoute(req)) {
        await auth.protect();
    }
});

export const config = {
    matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
