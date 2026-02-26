import type { Metadata } from 'next';
import './globals.css';
import '../styles/index.css';
import '../styles/themes.css';
import '../styles/animations.css';

export const metadata: Metadata = {
    title: 'Minimind - AI Character Chat',
    description: 'Elevate your AI experience with Minimind.',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <head>
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css" />
            </head>
            <body className="bg-slate-900">{children}</body>
        </html>
    );
}
