'use client';
// Cuando el BI corre embebido en el shell (iframe), ocultamos su sidebar interno
// para evitar la doble barra lateral. Detectamos ?embedded=1 o window.parent !== window.
import { useEffect, useState } from 'react';
import Sidebar from './Sidebar';

export default function EmbedShell({
  user, roles, children,
}: { user: string; roles: string[]; children: React.ReactNode }) {
  const [embedded, setEmbedded] = useState(false);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    setEmbedded(q.get('embedded') === '1' || window.parent !== window);
  }, []);

  if (embedded) {
    return <main className="min-h-screen overflow-auto">{children}</main>;
  }
  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} roles={roles} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
