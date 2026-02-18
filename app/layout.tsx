import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { SmoothScrollProvider } from '@/components/providers/smooth-scroll-provider';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Arivolam — The Horizon of Learning',
  description: 'All-in-one campus social platform. Discover institutions, connect with peers, navigate campus, and manage your academic life.',
  keywords: ['campus', 'education', 'social media', 'ERP', 'navigation', 'AI assistant'],
  openGraph: {
    title: 'Arivolam — The Horizon of Learning',
    description: 'All-in-one campus social platform for educational institutions.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-background text-foreground antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SmoothScrollProvider>
            {children}
          </SmoothScrollProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
