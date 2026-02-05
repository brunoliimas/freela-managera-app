import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/providers/auth-provider";
import { ThemeProvider } from "@/providers/theme-provider";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Freela Manager",
    description: "Gerencie seus projetos freelance com facilidade",
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "Freela Manager",
    },
    formatDetection: {
        telephone: false,
    },
};

export const viewport: Viewport = {
    themeColor: "#2563eb",
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="pt-BR" suppressHydrationWarning>
            <head>
                <link rel="apple-touch-icon" href="/icon-192.png" />
            </head>
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
                <ThemeProvider>
                    <AuthProvider>{children}</AuthProvider>
                </ThemeProvider>
                <Toaster position="top-right" richColors closeButton expand={false} />
            </body>
        </html>
    );
}
