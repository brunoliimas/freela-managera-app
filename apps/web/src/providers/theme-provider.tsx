'use client';

/**
 * ThemeProvider - passthrough wrapper.
 * Theme application is handled per-area:
 * - Dashboard: useFreelancerTheme() in DashboardLayout
 * - Portal: usePortalTheme() in portal layout
 * - Landing: useLandingTheme() in landing page
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
