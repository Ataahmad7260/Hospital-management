import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Aura Hospital | Advanced Healthcare & Digital Clinical Portal',
  description:
    'Aura Hospital unifies world-class medical specialists, real-time diagnostic intelligence, and frictionless digital health records into an integrated clinical care experience in Darbhanga, Bihar.',
  keywords: [
    'Aura Hospital',
    'Hospital Management System',
    'Darbhanga Hospital',
    'Emergency Care Bihar',
    'Specialist Doctors',
    'Digital Health Records',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-[#0A0A0A] text-[#EDEDED] font-sans antialiased overflow-x-hidden selection:bg-white selection:text-black">
        {children}
      </body>
    </html>
  );
}
