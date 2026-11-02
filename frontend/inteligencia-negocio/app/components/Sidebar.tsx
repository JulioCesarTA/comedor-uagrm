'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const sections = [
  { label: 'OVERVIEW', items: [{ href: '/', icon: '📊', label: 'Dashboard' }] },
  { label: 'DASHBOARDS', items: [
    { href: '/raciones', icon: '🍽️', label: 'Raciones servidas' },
    { href: '/asistencia', icon: '👥', label: 'Asistencia' },
    { href: '/desperdicio', icon: '🗑️', label: 'Desperdicio' },
    { href: '/costos', icon: '💰', label: 'Costo por ración' },
  ]},
  { label: 'MACHINE LEARNING', items: [
    { href: '/prediccion', icon: '📈', label: 'Predicción demanda' },
    { href: '/segmentacion', icon: '🧠', label: 'Segmentación' },
    { href: '/cnn', icon: '📷', label: 'CNN visión' },
  ]},
  { label: 'IA & REPORTES', items: [
    { href: '/agentes', icon: '🤖', label: 'Agentes IA' },
    { href: '/reportes', icon: '💬', label: 'Reportes LLM' },
  ]},
];

export default function Sidebar({ user, roles }: { user: string, roles: string[] }) {
  const pathname = usePathname();
  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 min-h-screen sticky top-0 flex flex-col">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-orange-500 rounded-lg flex items-center justify-center text-xl">📊</div>
          <div>
            <div className="font-bold text-white">Intel. Negocio</div>
            <div className="text-xs text-purple-400 font-mono">Next.js 14 · App Router</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-5 overflow-auto">
        {sections.map(s => (
          <div key={s.label}>
            <div className="text-[10px] font-bold text-slate-500 px-3 mb-1 tracking-wider">{s.label}</div>
            <div className="space-y-0.5">
              {s.items.map(i => (
                <Link key={i.href} href={i.href}
                  className={"flex items-center gap-3 px-3 py-2 rounded-lg transition " +
                    (pathname === i.href ? "bg-gradient-to-r from-purple-500/20 to-orange-500/20 text-white border-l-2 border-purple-500" : "text-slate-400 hover:bg-slate-800 hover:text-white")}>
                  <span>{i.icon}</span>
                  <span className="text-sm">{i.label}</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-sm font-bold">{user[0]?.toUpperCase()}</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">{user}</div>
              <div className="text-xs text-emerald-400">● Keycloak OIDC</div>
            </div>
          </div>
          <div className="text-[10px] text-slate-500 mt-2">{roles.filter(r => !r.startsWith('default-') && !r.startsWith('offline') && !r.startsWith('uma')).join(' · ') || 'administrador'}</div>
        </div>
      </div>
    </aside>
  );
}
