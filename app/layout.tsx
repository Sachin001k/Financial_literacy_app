import type { Metadata, Viewport } from 'next';
import { Inter, Poppins } from 'next/font/google';
import { AuthGateModal } from '@/components/auth/auth-gate-modal';
import { Footer } from '@/components/layout/footer';
import { Navbar } from '@/components/layout/navbar';
import { Providers } from '@/components/providers/providers';
import './globals.css';

const display = Poppins({ subsets: ['latin'], weight: ['500', '600', '700', '800'], variable: '--font-display' });
const body = Inter({ subsets: ['latin'], variable: '--font-body' });

export const metadata: Metadata = {
  title: { default: 'FinPlay — Learn money by playing', template: '%s · FinPlay' },
  description: 'Short games that teach budgeting, saving and investing with virtual ₹. Free to start.',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8f8fc' },
    { media: '(prefers-color-scheme: dark)', color: '#090a16' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${display.variable} ${body.variable}`}>
      <body className="min-h-screen overflow-x-hidden font-sans">
        <Providers>
          <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-xl focus:bg-brand focus:px-4 focus:py-2 focus:text-white">
            Skip to content
          </a>
          <Navbar />
          <main id="main">{children}</main>
          <Footer />
          <AuthGateModal />
        </Providers>
      </body>
    </html>
  );
}
