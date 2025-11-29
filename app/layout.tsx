import type { Metadata, Viewport } from 'next';
import './globals.css';
import { KioskProvider } from '@/context/KioskContext';
import { KeyboardProvider } from '@/context/KeyboardContext';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { IdleTimer } from '@/components/ui/IdleTimer';
import { KioskRestrictions } from '@/components/ui/KioskRestrictions';
import { AppWrapper } from '@/components/layout/AppWrapper';
import { DocumentTitleUpdater } from '@/components/ui/DocumentTitleUpdater';

export const metadata: Metadata = {
  title: 'Restaurant Kiosk - Order System',
  description: 'Modern restaurant kiosk ordering system with multi-language support',
  keywords: ['restaurant', 'kiosk', 'ordering', 'food', 'drinks'],
  authors: [{ name: 'Restaurant Kiosk' }],
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/assets/logo.svg', type: 'image/svg+xml' },
      { url: '/assets/logo.png', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/assets/logo.png',
  },
  manifest: '/manifest.json',
  openGraph: {
    title: 'Restaurant Kiosk - Order System',
    description: 'Modern restaurant kiosk ordering system',
    type: 'website',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Restaurant Kiosk',
  },
};

const enableKioskRestrictions = process.env.NEXT_PUBLIC_ENABLE_KIOSK_RESTRICTIONS !== 'false';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: enableKioskRestrictions ? 1 : undefined,
  userScalable: enableKioskRestrictions ? false : undefined,
  themeColor: '#667eea',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Prevent theme transition flash on initial load
              (function() {
                document.documentElement.classList.add('no-transition');
                window.addEventListener('load', function() {
                  setTimeout(function() {
                    document.documentElement.classList.remove('no-transition');
                  }, 100);
                });
              })();
            `,
          }}
        />
      </head>
      <body className="font-sans" suppressHydrationWarning>
        <ErrorBoundary>
          <KioskProvider>
            <KeyboardProvider>
              {/* Update document title dynamically based on restaurant config */}
              <DocumentTitleUpdater />
              <KioskRestrictions />
              <AppWrapper>
                {children}
              </AppWrapper>
              <IdleTimer idleTimeout={60000} warningTimeout={60000} />
            </KeyboardProvider>
          </KioskProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}