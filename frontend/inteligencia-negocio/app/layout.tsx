import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { headers } from 'next/headers';
import Sidebar from './components/Sidebar';
import SSOReceiver from './components/SSOReceiver';
import EmbedShell from './components/EmbedShell';
import './globals.css';

// next/font — optimización auto de fuentes sin FOUT (exclusivo de Next.js)
const inter = Inter({ subsets: ['latin'], display: 'swap' });

// Metadata API — SEO dinámico (exclusivo Next.js)
export const metadata: Metadata = {
  title: {
    default: 'Comedor UAGRM — Inteligencia de Negocio',
    template: '%s · BI Comedor UAGRM',
  },
  description: 'Dashboards ML, agentes IA y reportes generativos para el Comedor Universitario UAGRM. Construido con Next.js 14 App Router.',
  authors: [{ name: 'Grupo #25 · UAGRM' }],
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // headers() es Server-only
  const h = headers();
  const user = h.get('x-user') || 'administrador';
  const roles = JSON.parse(h.get('x-roles') || '["administrador"]');

  return (
    <html lang="es" className={inter.className}>
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body className="bg-slate-900 text-slate-100 min-h-screen">
        <SSOReceiver />
        <EmbedShell user={user} roles={roles}>{children}</EmbedShell>
      </body>
    </html>
  );
}
