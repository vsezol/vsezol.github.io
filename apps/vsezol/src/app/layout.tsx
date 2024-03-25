import { Viewport } from 'next';
import '../shared/ui/styles.css';
import './global.css';
import './icons';

export { metadata } from './metadata';

export const viewport: Viewport = {
  // themeColor: 'black',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="h-screen">{children}</body>
    </html>
  );
}
