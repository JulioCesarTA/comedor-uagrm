import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { provideHttpClient, HttpClient } from '@angular/common/http';
import { Component, OnInit, OnDestroy, signal, inject, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule, DecimalPipe, JsonPipe, DatePipe } from '@angular/common';

const API_URL = (typeof window !== 'undefined' && (window as any).__API_URL__) || 'http://localhost:8080';

// ============== LOGIN ==============
@Component({
  standalone: true, selector: 'app-login', imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div class="w-full max-w-md p-8 bg-slate-800/60 backdrop-blur rounded-2xl shadow-2xl border border-slate-700">
        <div class="text-center mb-8">
          <div class="w-20 h-20 mx-auto bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-4xl mb-4">🧑‍🍳</div>
          <h1 class="text-3xl font-bold text-white">Back-office</h1>
          <p class="text-slate-400 mt-2 text-sm">Panel administrador · Comedor UAGRM</p>
        </div>
        <form (ngSubmit)="login()" class="space-y-4">
          <div>
            <label class="block text-xs text-slate-400 uppercase mb-2 font-medium">Usuario</label>
            <input [(ngModel)]="username" name="username" required
              class="w-full px-4 py-3 bg-slate-900 border border-slate-700 text-white rounded-lg focus:outline-none focus:border-purple-500" />
          </div>
          <div>
            <label class="block text-xs text-slate-400 uppercase mb-2 font-medium">Contraseña</label>
            <input [(ngModel)]="password" name="password" type="password" required
              class="w-full px-4 py-3 bg-slate-900 border border-slate-700 text-white rounded-lg focus:outline-none focus:border-purple-500" />
          </div>
          <button type="submit" [disabled]="loading"
            class="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:shadow-xl text-white font-semibold rounded-xl transition-all disabled:opacity-50">
            {{ loading ? 'Autenticando…' : '🔐 Iniciar sesión' }}
          </button>
        </form>
        <div class="mt-6 p-4 bg-slate-900/50 rounded-lg space-y-1">
          <p class="text-xs text-slate-400 font-medium">Cuentas demo:</p>
          <code class="block text-xs text-cyan-400">admin.comedor / admin123</code>
          <code class="block text-xs text-cyan-400">nutricionista.demo / nutri123</code>
          <code class="block text-xs text-cyan-400">caja.demo / caja123</code>
        </div>
        <p *ngIf="error" class="text-red-400 text-xs mt-4 text-center">{{ error }}</p>
      </div>
    </div>
  `,
})
class LoginComponent {
  username = ''; password = ''; loading = false; error = '';
  async login() {
    this.loading = true; this.error = '';
    try {
      const body = new URLSearchParams({ grant_type: 'password', client_id: 'backoffice-gestion', username: this.username, password: this.password });
      const r = await fetch('http://44.252.104.3:8085/realms/comedor-uagrm/protocol/openid-connect/token', {
        method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body
      });
      if (!r.ok) throw new Error('Credenciales inválidas');
      const data = await r.json();
      sessionStorage.setItem('kc_token', data.access_token);
      sessionStorage.setItem('kc_user', this.username);
      sessionStorage.setItem('kc_roles', JSON.stringify((JSON.parse(atob(data.access_token.split('.')[1]))).realm_access?.roles || []));
      window.location.href = '/menus';
    } catch (e: any) { this.error = e.message; }
    finally { this.loading = false; }
  }
}

// ============== MENÚ + INVENTARIO ==============
@Component({
  standalone: true, selector: 'app-menus', imports: [CommonModule, DecimalPipe, FormsModule],
  template: `
    <div class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-gradient-to-br from-purple-500/20 to-slate-800 border border-purple-500/30 rounded-xl p-5">
          <div class="text-xs text-slate-400 uppercase">Menús publicados</div>
          <div class="text-3xl font-bold text-white mt-2">{{ menus().length }}</div>
        </div>
        <div class="bg-gradient-to-br from-cyan-500/20 to-slate-800 border border-cyan-500/30 rounded-xl p-5">
          <div class="text-xs text-slate-400 uppercase">Insumos</div>
          <div class="text-3xl font-bold text-white mt-2">{{ insumos().length }}</div>
        </div>
        <div class="bg-gradient-to-br from-orange-500/20 to-slate-800 border border-orange-500/30 rounded-xl p-5">
          <div class="text-xs text-slate-400 uppercase">En alerta</div>
          <div class="text-3xl font-bold text-orange-400 mt-2">{{ stockBajo().length }}</div>
        </div>
        <div class="bg-gradient-to-br from-emerald-500/20 to-slate-800 border border-emerald-500/30 rounded-xl p-5">
          <div class="text-xs text-slate-400 uppercase">Turno activo</div>
          <select [(ngModel)]="turno" (change)="load()" class="mt-2 w-full px-3 py-1.5 bg-slate-900 border border-slate-700 text-white rounded-lg text-sm">
            <option>DESAYUNO</option><option>ALMUERZO</option><option>CENA</option>
          </select>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <h3 class="text-sm text-slate-400 uppercase mb-4 font-semibold">📅 Menús semana · {{ turno }}</h3>
          <div class="space-y-3 max-h-[500px] overflow-auto">
            <div *ngFor="let m of menus()" class="bg-slate-900/50 rounded-lg p-4">
              <div class="flex justify-between items-center mb-3">
                <span class="font-semibold text-white">{{ m.fecha }}</span>
                <span class="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full">{{ m.turno }}</span>
              </div>
              <div *ngFor="let p of toPorciones(m.porciones)" class="flex justify-between items-center py-2 border-t border-slate-800">
                <div>
                  <div class="text-white text-sm">{{ p.id }}</div>
                  <div class="text-xs text-slate-400">{{ p.disponibles }}/{{ p.cupo }} disp.</div>
                </div>
                <span [class]="statusColor(p)" class="text-xs font-medium px-2 py-1 rounded">
                  {{ statusLabel(p) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <h3 class="text-sm text-slate-400 uppercase mb-4 font-semibold">📦 Inventario insumos</h3>
          <div class="space-y-2 max-h-[500px] overflow-auto">
            <div *ngFor="let i of insumos()" class="flex items-center justify-between py-3 border-b border-slate-700/50">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center text-lg">
                  {{ i.nombre.includes('ARROZ') ? '🌾' : i.nombre.includes('POLLO') ? '🍗' : i.nombre.includes('ZANAH') ? '🥕' : i.nombre.includes('CEBOLLA') ? '🧅' : i.nombre.includes('ACEITE') ? '🫒' : i.nombre.includes('PAPA') ? '🥔' : i.nombre.includes('TOMATE') ? '🍅' : i.nombre.includes('SAL') ? '🧂' : '📦' }}
                </div>
                <div>
                  <div class="text-white text-sm font-medium">{{ i.nombre }}</div>
                  <div class="text-xs text-slate-400">{{ stockTotal(i) | number:'1.0-1' }} {{ i.unidad }} · mín {{ i.stockMinimo }}</div>
                </div>
              </div>
              <span [class]="stockTotal(i) > i.stockMinimo ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'" class="text-xs px-2 py-1 rounded font-medium">
                {{ stockTotal(i) > i.stockMinimo ? '✓ OK' : '⚠ Bajo' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
class MenusComponent implements OnInit {
  http = inject(HttpClient);
  turno = 'ALMUERZO';
  menus = signal<any[]>([]);
  insumos = signal<any[]>([]);
  stockBajo = signal<any[]>([]);
  ngOnInit() { this.load(); }
  load() {
    this.http.get<any[]>(`${API_URL}/menus/semana/${this.turno}`).subscribe(r => this.menus.set(r));
    this.http.get<any[]>(`${API_URL}/insumos`).subscribe(r => this.insumos.set(r));
    this.http.get<any[]>(`${API_URL}/insumos/stock-bajo`).subscribe(r => this.stockBajo.set(r));
  }
  toPorciones(p: any) { return Object.entries(p || {}).map(([id, v]: any) => ({ id, ...v })); }
  stockTotal(i: any) { return (i.lotes || []).reduce((s: number, l: any) => s + (l.cantidad?.valor || 0), 0); }
  statusColor(p: any) {
    const r = p.disponibles / p.cupo;
    return r > 0.5 ? 'bg-emerald-500/20 text-emerald-400' : r > 0.2 ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400';
  }
  statusLabel(p: any) {
    const r = p.disponibles / p.cupo;
    return r > 0.5 ? 'disponible' : r > 0.2 ? 'bajo' : 'crítico';
  }
}

// ============== ADMIN · ESTUDIANTES & BECAS ==============
@Component({
  standalone: true, selector: 'app-admin-estudiantes', imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div class="lg:col-span-3 bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <h3 class="text-sm text-slate-400 uppercase mb-4 font-semibold flex justify-between items-center">
            <span>👥 Estudiantes ({{ estudiantes().length }})</span>
            <input [(ngModel)]="filtro" placeholder="buscar..." class="px-3 py-1 bg-slate-900 border border-slate-700 text-white rounded text-xs w-40" />
          </h3>
          <div class="space-y-1 max-h-[500px] overflow-auto">
            <div *ngFor="let e of filtered()" (click)="elegir(e)"
              [class]="seleccionado()?.id === e.id ? 'bg-purple-500/20 border-purple-500' : 'bg-slate-900/50 border-transparent hover:bg-slate-900'"
              class="p-3 border rounded-lg cursor-pointer transition">
              <div class="flex justify-between items-center">
                <div>
                  <div class="text-white font-medium text-sm">{{ e.nombre }}</div>
                  <div class="text-xs text-slate-400">{{ e.registroUniv }} · {{ e.email }}</div>
                </div>
                <div class="text-xs text-cyan-400 font-mono">{{ e.id?.slice(0,8) }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="lg:col-span-2 space-y-6">
          <div class="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h3 class="text-sm text-slate-400 uppercase mb-4 font-semibold">➕ Crear estudiante</h3>
            <div class="space-y-3">
              <input [(ngModel)]="nuevoRegistro" placeholder="Registro universitario (ej: 123456)"
                class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 text-white rounded-lg text-sm" />
              <input [(ngModel)]="nuevoNombre" placeholder="Nombre completo"
                class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 text-white rounded-lg text-sm" />
              <input [(ngModel)]="nuevoEmail" placeholder="email@uagrm.edu.bo" type="email"
                class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 text-white rounded-lg text-sm" />
              <input [(ngModel)]="nuevoTel" placeholder="Teléfono (opcional)"
                class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 text-white rounded-lg text-sm" />
              <button (click)="crear()" [disabled]="!nuevoRegistro || !nuevoNombre"
                class="w-full py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold disabled:opacity-40">
                Crear estudiante
              </button>
            </div>
          </div>

          <div *ngIf="seleccionado()" class="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h3 class="text-sm text-slate-400 uppercase mb-2 font-semibold">🎓 Asignar beca a {{ seleccionado().nombre }}</h3>
            <div *ngIf="becaActual()" class="mb-3 bg-emerald-500/10 border border-emerald-500/40 rounded-lg p-3">
              <div class="text-sm text-emerald-400">Beca activa: {{ becaActual().tipo }}</div>
              <div class="text-xs text-slate-400">{{ becaActual().racionesUsadasMes }}/{{ becaActual().cupoRacionesMes }} del mes</div>
            </div>
            <div class="space-y-3">
              <select [(ngModel)]="nuevoTipoBeca" class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 text-white rounded-lg text-sm">
                <option value="completa">Completa (60 raciones/mes)</option>
                <option value="media">Media (30 raciones/mes)</option>
                <option value="parcial">Parcial (15 raciones/mes)</option>
              </select>
              <input [(ngModel)]="nuevoMesesVig" type="number" min="1" max="12" placeholder="Meses de vigencia"
                class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 text-white rounded-lg text-sm" />
              <button (click)="asignarBeca()" class="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg font-semibold">
                Asignar beca
              </button>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="toast()" class="fixed top-6 right-6 px-5 py-3 rounded-xl shadow-2xl z-50"
        [class]="toast().kind === 'ok' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'">{{ toast().msg }}</div>
    </div>
  `,
})
class AdminEstudiantesComponent implements OnInit {
  http = inject(HttpClient);
  estudiantes = signal<any[]>([]);
  seleccionado = signal<any>(null);
  becaActual = signal<any>(null);
  filtro = '';
  nuevoRegistro = ''; nuevoNombre = ''; nuevoEmail = ''; nuevoTel = '';
  nuevoTipoBeca: 'completa'|'media'|'parcial' = 'completa';
  nuevoMesesVig = 12;
  toast = signal<any>(null);

  ngOnInit() { this.load(); }
  load() {
    this.http.get<any[]>(`${API_URL}/estudiantes`).subscribe({ next: r => this.estudiantes.set(r || []), error: () => this.estudiantes.set([]) });
  }
  filtered() {
    const q = this.filtro.toLowerCase();
    const list = this.estudiantes();
    if (!q) return list;
    return list.filter((e: any) => (e.nombre + ' ' + e.registroUniv + ' ' + e.email).toLowerCase().includes(q));
  }
  elegir(e: any) {
    this.seleccionado.set(e);
    this.becaActual.set(null);
    this.http.get(`${API_URL}/estudiantes/${e.id}/beca`).subscribe({
      next: (b: any) => this.becaActual.set(b?.tieneBeca ? b : null),
      error: () => this.becaActual.set(null),
    });
  }
  notif(msg: string, kind: 'ok'|'err' = 'ok') {
    this.toast.set({ msg, kind });
    setTimeout(() => this.toast.set(null), 4000);
  }
  crear() {
    this.http.post(`${API_URL}/estudiantes`, {
      registroUniv: this.nuevoRegistro, nombre: this.nuevoNombre, email: this.nuevoEmail || `${this.nuevoRegistro}@uagrm.edu.bo`, telefono: this.nuevoTel
    }).subscribe({
      next: () => {
        this.notif('✅ Estudiante creado'); this.nuevoRegistro=''; this.nuevoNombre=''; this.nuevoEmail=''; this.nuevoTel='';
        this.load();
      },
      error: e => this.notif('Error: ' + (e.error?.message || e.message), 'err')
    });
  }
  asignarBeca() {
    const est = this.seleccionado();
    if (!est) return;
    this.http.post(`${API_URL}/estudiantes/${est.id}/beca`, { tipo: this.nuevoTipoBeca, mesesVigencia: this.nuevoMesesVig }).subscribe({
      next: () => { this.notif(`✅ Beca ${this.nuevoTipoBeca} asignada a ${est.nombre}`); this.elegir(est); },
      error: e => this.notif('Error: ' + (e.error?.message || e.message), 'err')
    });
  }
}

// ============== ADMIN · PUBLICAR MENU + RECIBIR INSUMO ==============
@Component({
  standalone: true, selector: 'app-admin-operacion', imports: [CommonModule, FormsModule],
  template: `
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <h3 class="text-sm text-slate-400 uppercase mb-4 font-semibold">📅 Publicar menú del día</h3>
        <div class="space-y-3">
          <input type="date" [(ngModel)]="menuFecha" class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 text-white rounded-lg text-sm" />
          <select [(ngModel)]="menuTurno" class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 text-white rounded-lg text-sm">
            <option>DESAYUNO</option><option>ALMUERZO</option><option>CENA</option>
          </select>
          <div class="space-y-2">
            <div *ngFor="let p of menuPlatos; let i = index" class="flex gap-2">
              <input [(ngModel)]="p.id" placeholder="plato-id (ej: plato-asado)" class="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 text-white rounded text-sm" />
              <input [(ngModel)]="p.cupo" type="number" min="1" placeholder="cupo" class="w-20 px-3 py-2 bg-slate-900 border border-slate-700 text-white rounded text-sm" />
              <button (click)="quitarPlato(i)" class="px-3 bg-slate-700 text-slate-300 rounded hover:bg-red-500/40">×</button>
            </div>
            <button (click)="agregarPlato()" class="w-full py-2 border border-dashed border-slate-700 text-slate-400 rounded text-xs hover:bg-slate-800">+ Agregar plato</button>
          </div>
          <button (click)="publicarMenu()" [disabled]="!menuFecha || menuPlatos.length === 0"
            class="w-full py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold disabled:opacity-40">
            Publicar menú
          </button>
        </div>
      </div>

      <div class="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <h3 class="text-sm text-slate-400 uppercase mb-4 font-semibold">📦 Recibir lote de insumo</h3>
        <div class="space-y-3">
          <select [(ngModel)]="insSel" class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 text-white rounded-lg text-sm">
            <option value="">— seleccioná un insumo —</option>
            <option *ngFor="let i of insumos()" [value]="i.id">{{ i.nombre }} ({{ i.unidad }})</option>
          </select>
          <input [(ngModel)]="loteCant" type="number" min="0.1" step="0.1" placeholder="cantidad"
            class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 text-white rounded-lg text-sm" />
          <input [(ngModel)]="loteProv" placeholder="proveedor"
            class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 text-white rounded-lg text-sm" />
          <input [(ngModel)]="loteVence" type="date"
            class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 text-white rounded-lg text-sm" />
          <button (click)="recibirLote()" [disabled]="!insSel || !loteCant"
            class="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg font-semibold disabled:opacity-40">
            Registrar lote
          </button>
          <div class="pt-3 border-t border-slate-700 text-xs text-slate-400">
            Stock bajo requiere OC manual. Para crear insumo nuevo escribí nombre + unidad + stock mínimo abajo.
          </div>
          <div class="space-y-2">
            <input [(ngModel)]="insNuevoNombre" placeholder="Nombre nuevo insumo (ej: QUINUA)"
              class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 text-white rounded-lg text-sm" />
            <div class="grid grid-cols-2 gap-2">
              <input [(ngModel)]="insNuevaUnidad" placeholder="unidad (kg, l)"
                class="px-4 py-2.5 bg-slate-900 border border-slate-700 text-white rounded-lg text-sm" />
              <input [(ngModel)]="insNuevoMin" type="number" placeholder="stock mínimo"
                class="px-4 py-2.5 bg-slate-900 border border-slate-700 text-white rounded-lg text-sm" />
            </div>
            <button (click)="crearInsumo()" [disabled]="!insNuevoNombre || !insNuevaUnidad"
              class="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs disabled:opacity-40">
              + Crear insumo
            </button>
          </div>
        </div>
      </div>
    </div>
    <div *ngIf="toast()" class="fixed top-6 right-6 px-5 py-3 rounded-xl shadow-2xl z-50"
      [class]="toast().kind === 'ok' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'">{{ toast().msg }}</div>
  `,
})
class AdminOperacionComponent implements OnInit {
  http = inject(HttpClient);
  menuFecha = new Date().toISOString().slice(0, 10);
  menuTurno = 'ALMUERZO';
  menuPlatos: { id: string; cupo: number }[] = [{ id: '', cupo: 50 }];
  insumos = signal<any[]>([]);
  insSel = ''; loteCant: number | null = null; loteProv = ''; loteVence = '';
  insNuevoNombre = ''; insNuevaUnidad = 'kg'; insNuevoMin = 5;
  toast = signal<any>(null);
  ngOnInit() { this.load(); }
  load() { this.http.get<any[]>(`${API_URL}/insumos`).subscribe({ next: r => this.insumos.set(r || []), error: () => this.insumos.set([]) }); }
  notif(msg: string, kind: 'ok'|'err' = 'ok') { this.toast.set({ msg, kind }); setTimeout(() => this.toast.set(null), 4000); }
  agregarPlato() { this.menuPlatos.push({ id: '', cupo: 50 }); }
  quitarPlato(i: number) { this.menuPlatos.splice(i, 1); }
  publicarMenu() {
    const platos = this.menuPlatos.filter(p => p.id).map(p => ({ platoId: p.id, cupo: Number(p.cupo) }));
    if (platos.length === 0) return this.notif('Agregá al menos un plato', 'err');
    this.http.post(`${API_URL}/menus`, { fecha: this.menuFecha, turno: this.menuTurno, platos }).subscribe({
      next: () => { this.notif('✅ Menú publicado'); this.menuPlatos = [{ id: '', cupo: 50 }]; },
      error: e => this.notif('Error: ' + (e.error?.message || e.message), 'err')
    });
  }
  recibirLote() {
    const loteId = 'lote-' + Date.now();
    const insumo = this.insumos().find(i => i.id === this.insSel);
    const unidad = insumo?.unidad || 'kg';
    this.http.post(`${API_URL}/insumos/lotes`, {
      insumoId: this.insSel,
      loteId,
      cantidad: Number(this.loteCant),
      unidad,
      vence: this.loteVence || new Date(Date.now()+30*24*3600*1000).toISOString().slice(0,10)
    }).subscribe({
      next: () => { this.notif('✅ Lote registrado'); this.loteCant = null; this.loteProv = ''; this.load(); },
      error: e => this.notif('Error: ' + (e.error?.message || e.message), 'err')
    });
  }
  crearInsumo() {
    const id = this.insNuevoNombre.toUpperCase().replace(/\s+/g, '_');
    this.http.post(`${API_URL}/insumos`, { id, nombre: this.insNuevoNombre, unidad: this.insNuevaUnidad, stockMinimo: Number(this.insNuevoMin) }).subscribe({
      next: () => { this.notif('✅ Insumo creado'); this.insNuevoNombre = ''; this.load(); },
      error: e => this.notif('Error: ' + (e.error?.message || e.message), 'err')
    });
  }
}

// ============== CAJA / QR ==============
@Component({
  standalone: true, selector: 'app-caja', imports: [CommonModule, FormsModule, JsonPipe],
  template: `
    <div class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-gradient-to-br from-emerald-500/20 to-slate-800 border border-emerald-500/30 rounded-xl p-5">
          <div class="text-xs text-slate-400 uppercase">Validadas hoy</div>
          <div class="text-3xl font-bold text-emerald-400 mt-2">{{ contador() }}</div>
        </div>
        <div class="bg-gradient-to-br from-red-500/20 to-slate-800 border border-red-500/30 rounded-xl p-5">
          <div class="text-xs text-slate-400 uppercase">Rechazadas</div>
          <div class="text-3xl font-bold text-red-400 mt-2">{{ rechazadas() }}</div>
        </div>
        <div class="bg-gradient-to-br from-cyan-500/20 to-slate-800 border border-cyan-500/30 rounded-xl p-5">
          <div class="text-xs text-slate-400 uppercase">Modo</div>
          <div class="text-lg font-bold text-white mt-2">🧑‍🍳 Línea de atención</div>
        </div>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <h3 class="text-sm text-slate-400 uppercase mb-4 font-semibold">📷 Escáner QR con cámara</h3>
          <div class="flex gap-2 mb-4">
            <button (click)="startCamera()" [disabled]="scanning()"
              class="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-lg disabled:opacity-50">
              ▶ Iniciar cámara
            </button>
            <button (click)="stopCamera()" [disabled]="!scanning()"
              class="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg disabled:opacity-50">
              ■ Parar
            </button>
          </div>
          <div id="qr-reader" class="rounded-lg overflow-hidden bg-slate-900"></div>
        </div>
        <div class="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <h3 class="text-sm text-slate-400 uppercase mb-4 font-semibold">⌨️ Validar manualmente</h3>
          <input [(ngModel)]="qr" placeholder="Pega el token del QR del estudiante"
            class="w-full px-4 py-3 bg-slate-900 border border-slate-700 text-white rounded-lg focus:outline-none focus:border-purple-500 mb-3" />
          <button (click)="validar()" [disabled]="!qr"
            class="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg disabled:opacity-50">
            ✓ Validar QR
          </button>
          <div *ngIf="resultado()" class="mt-4 p-4 rounded-lg border"
            [class]="resultado().ok ? 'bg-emerald-500/10 border-emerald-500/40' : 'bg-red-500/10 border-red-500/40'">
            <div class="flex items-center gap-3">
              <div class="text-3xl">{{ resultado().ok ? '✅' : '❌' }}</div>
              <div>
                <div class="font-bold text-white">{{ resultado().ok ? 'INGRESO VÁLIDO' : (resultado().motivo || 'Error') }}</div>
                <div *ngIf="resultado().reservaId" class="text-xs text-slate-400 mt-1">Reserva: {{ resultado().reservaId }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
class CajaComponent implements OnInit, AfterViewInit {
  http = inject(HttpClient);
  qr = '';
  scanning = signal(false);
  resultado = signal<any>(null);
  contador = signal(0);
  rechazadas = signal(0);
  html5QrCode: any;
  ngOnInit() {}
  ngAfterViewInit() {
    if (!(window as any).Html5Qrcode) {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.8/html5-qrcode.min.js';
      document.head.appendChild(s);
    }
  }
  startCamera() {
    const H = (window as any).Html5Qrcode;
    if (!H) { alert('Librería QR cargando, prueba en 2 seg'); return; }
    this.html5QrCode = new H('qr-reader');
    this.html5QrCode.start({ facingMode: 'environment' }, { fps: 10, qrbox: 250 }, (decoded: string) => {
      this.qr = decoded; this.validar(); this.stopCamera();
    }, () => {}).then(() => this.scanning.set(true)).catch((e: any) => alert('Cámara no disponible: ' + e));
  }
  stopCamera() { if (this.html5QrCode) { this.html5QrCode.stop(); this.scanning.set(false); } }
  validar() {
    this.http.post(`${API_URL}/ingreso/validar-qr`, { qr: this.qr }).subscribe({
      next: (r: any) => {
        this.resultado.set(r);
        if (r.ok) this.contador.update(c => c + 1); else this.rechazadas.update(c => c + 1);
      },
      error: e => this.resultado.set({ ok: false, motivo: e.message })
    });
  }
}

// ============== AGENTES IA ==============
@Component({
  standalone: true, selector: 'app-agentes', imports: [CommonModule, FormsModule, JsonPipe],
  template: `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div *ngFor="let a of agentes" class="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-purple-500/50 transition-colors">
        <div class="flex items-start gap-4 mb-4">
          <div class="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-3xl shadow-lg">{{ a.emoji }}</div>
          <div class="flex-1">
            <h4 class="font-bold text-white">{{ a.titulo }}</h4>
            <p class="text-xs text-slate-400 mt-1 leading-relaxed">{{ a.desc }}</p>
            <p class="text-xs text-cyan-400 mt-1 font-mono">{{ a.tech }}</p>
          </div>
        </div>
        <button (click)="correr(a.name)" [disabled]="loading() === a.name"
          class="w-full py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-lg disabled:opacity-50">
          {{ loading() === a.name ? '⚡ Ejecutando misión…' : '▶ Ejecutar misión' }}
        </button>
        <pre *ngIf="resultados()[a.name]" class="mt-4 p-3 bg-slate-900 rounded-lg text-xs text-slate-300 max-h-72 overflow-auto font-mono">{{ resultados()[a.name] | json }}</pre>
      </div>
    </div>
  `,
})
class AgentesComponent {
  http = inject(HttpClient);
  loading = signal<string | null>(null);
  resultados = signal<Record<string, any>>({});
  agentes = [
    { name: 'monitor-comedor', titulo: 'Monitor del comedor', emoji: '📡', desc: 'Detecta anomalías de asistencia, desperdicio y costo por ración.', tech: 'sklearn + MCP tools' },
    { name: 'planificador-menu', titulo: 'Planificador menú', emoji: '🧠', desc: 'Propone menú semanal usando predicción ML + stock disponible.', tech: 'RandomForest + MCP' },
    { name: 'inventario-compras', titulo: 'Inventario + compras', emoji: '📦', desc: 'Stock bajo + órdenes de compra borrador. Requiere confirmación humana.', tech: 'MCP tools' },
    { name: 'atencion-estudiante', titulo: 'Atención al estudiante', emoji: '💬', desc: 'LLM local TF-IDF para intents + consultas a los microservicios.', tech: 'TF-IDF + cosine' },
  ];
  correr(name: string) {
    this.loading.set(name);
    this.http.post(`${API_URL}/agentes/${name}`, { objetivo: 'Analizar y reportar hallazgos', contexto: {} })
      .subscribe({
        next: r => { this.resultados.update(x => ({ ...x, [name]: r })); this.loading.set(null); },
        error: e => { this.resultados.update(x => ({ ...x, [name]: { error: e.message } })); this.loading.set(null); }
      });
  }
}

// ============== LAYOUT APP ==============
@Component({
  standalone: true, selector: 'app-root', imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <div *ngIf="!loggedIn()" class="min-h-screen">
      <ng-container *ngIf="path === '/login'; else redir"></ng-container>
      <router-outlet />
      <ng-template #redir>{{ redirect() }}</ng-template>
    </div>
    <div *ngIf="loggedIn()" class="min-h-screen flex bg-slate-900 text-white">
      <aside class="w-64 bg-slate-900 border-r border-slate-800 min-h-screen flex flex-col">
        <div class="p-6 border-b border-slate-800">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-xl">🧑‍🍳</div>
            <div>
              <div class="font-bold text-white">Back-office</div>
              <div class="text-xs text-slate-400">Angular 18 · UAGRM</div>
            </div>
          </div>
        </div>
        <nav class="flex-1 p-4 space-y-1 overflow-auto">
          <div class="text-[10px] font-bold text-slate-500 px-3 py-2 tracking-wider">OPERACIÓN</div>
          <a *ngIf="verMenus" routerLink="/menus" routerLinkActive="bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white border-l-2 border-purple-500"
            class="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition">
            <span>📋</span><span class="text-sm font-medium">Menú / Inventario</span>
          </a>
          <a *ngIf="verCaja" routerLink="/caja" routerLinkActive="bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white border-l-2 border-purple-500"
            class="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition">
            <span>💳</span><span class="text-sm font-medium">Caja / QR Scanner</span>
          </a>
          <div *ngIf="verAdminEstudiantes || verAdminOperacion" class="text-[10px] font-bold text-slate-500 px-3 py-2 mt-2 tracking-wider">ADMINISTRACIÓN</div>
          <a *ngIf="verAdminEstudiantes" routerLink="/admin/estudiantes" routerLinkActive="bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white border-l-2 border-purple-500"
            class="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition">
            <span>👥</span><span class="text-sm font-medium">Estudiantes & Becas</span>
          </a>
          <a *ngIf="verAdminOperacion" routerLink="/admin/operacion" routerLinkActive="bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white border-l-2 border-purple-500"
            class="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition">
            <span>📅</span><span class="text-sm font-medium">Publicar menú / Recibir insumos</span>
          </a>
          <ng-container *ngIf="verAgentes">
            <div class="text-[10px] font-bold text-slate-500 px-3 py-2 mt-2 tracking-wider">INTELIGENCIA</div>
            <a routerLink="/agentes" routerLinkActive="bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white border-l-2 border-purple-500"
              class="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition">
              <span>🤖</span><span class="text-sm font-medium">Agentes IA</span>
            </a>
          </ng-container>
        </nav>
        <div class="p-4 border-t border-slate-800">
          <div class="bg-slate-800 rounded-lg p-3 mb-2">
            <div class="text-xs text-slate-400">Sesión activa</div>
            <div class="text-sm text-white font-medium mt-1">{{ user }}</div>
            <div class="text-xs text-emerald-400 mt-1">● {{ roles }}</div>
          </div>
          <button (click)="logout()" class="w-full py-2 text-slate-400 hover:text-red-400 text-xs">⎋ Cerrar sesión</button>
        </div>
      </aside>
      <main class="flex-1">
        <header class="sticky top-0 z-10 bg-slate-900/80 backdrop-blur border-b border-slate-800 px-8 py-4 flex justify-between items-center">
          <h1 class="text-xl font-bold text-white">🧑‍🍳 Panel administrador</h1>
          <div class="text-xs text-slate-400">AWS us-west-2 · Angular 18</div>
        </header>
        <div class="p-8">
          <router-outlet />
        </div>
      </main>
    </div>
  `,
})
class AppComponent {
  path = window.location.pathname;
  loggedIn() { return !!sessionStorage.getItem('kc_token'); }
  user = sessionStorage.getItem('kc_user') || '';
  rawRoles = (JSON.parse(sessionStorage.getItem('kc_roles') || '[]') as string[]).filter(r => !r.startsWith('default-') && !r.startsWith('offline') && !r.startsWith('uma'));
  roles = this.rawRoles.join(', ');
  esAdmin = this.rawRoles.some(r => r === 'administrador' || r.toLowerCase().includes('admin'));
  esCocinero = this.rawRoles.some(r => r.toLowerCase().includes('cocinero'));
  esCaja = this.rawRoles.some(r => r.toLowerCase().includes('caja'));
  // Visibilidad de módulos por rol:
  verMenus = this.esAdmin || this.esCocinero;
  verCaja = this.esAdmin || this.esCaja;
  verAdminEstudiantes = this.esAdmin;         // solo admin
  verAdminOperacion = this.esAdmin || this.esCocinero;  // cocinero publica menú + recibe insumos
  verAgentes = this.esAdmin;                   // solo admin ejecuta agentes
  redirect() { if (window.location.pathname !== '/login') window.location.href = '/login'; return ''; }
  logout() { sessionStorage.clear(); window.location.href = '/login'; }
}

// SSO cross-microfrontend: si estamos embebidos en el shell, recibimos el token Keycloak
// mediante postMessage del shell host (origen HTTP compartido).
window.addEventListener('message', (ev: MessageEvent) => {
  if (ev.data?.type === 'SSO_TOKEN' && ev.data?.token) {
    sessionStorage.setItem('kc_token', ev.data.token);
    try {
      const payload = JSON.parse(atob(ev.data.token.split('.')[1]));
      sessionStorage.setItem('kc_user', payload.preferred_username || 'admin.comedor');
      sessionStorage.setItem('kc_roles', JSON.stringify(payload.realm_access?.roles || []));
    } catch {}
    if (window.location.pathname === '/login') window.location.href = '/menus';
  }
});
// Avisar al shell que estamos listos para recibir el token
if (window.parent !== window) window.parent.postMessage({ type: 'MF_READY' }, '*');

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter([
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      { path: 'login', component: LoginComponent },
      { path: 'menus', component: MenusComponent },
      { path: 'caja', component: CajaComponent },
      { path: 'agentes', component: AgentesComponent },
      { path: 'admin/estudiantes', component: AdminEstudiantesComponent },
      { path: 'admin/operacion', component: AdminOperacionComponent },
    ]),
    provideHttpClient(),
  ],
});
