'use client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, CartesianGrid, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

const COLORS = ['#8b5cf6', '#06b6d4', '#f97316', '#10b981', '#ef4444', '#eab308'];
const tooltipStyle = { background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 };

export function AreaChartCard({ data, dataKey, xKey, color = '#8b5cf6', height = 260 }: any) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data}>
        <defs><linearGradient id={`g${dataKey}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity={0.9} /><stop offset="100%" stopColor={color} stopOpacity={0.1} /></linearGradient></defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey={xKey} stroke="#64748b" fontSize={10} />
        <YAxis stroke="#64748b" fontSize={10} />
        <Tooltip contentStyle={tooltipStyle} />
        <Area type="monotone" dataKey={dataKey} stroke={color} fill={`url(#g${dataKey})`} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
export function BarChartCard({ data, dataKey, xKey, color = '#06b6d4', height = 260, unit = '' }: any) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey={xKey} stroke="#64748b" fontSize={10} />
        <YAxis stroke="#64748b" fontSize={10} unit={unit} />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey={dataKey} fill={color} radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
export function LineChartCard({ data, dataKey, xKey, color = '#f97316', height = 260 }: any) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey={xKey} stroke="#64748b" fontSize={10} />
        <YAxis stroke="#64748b" fontSize={10} />
        <Tooltip contentStyle={tooltipStyle} />
        <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={3} dot={{ fill: color, r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
export function PieChartCard({ data, dataKey, nameKey, height = 260 }: any) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={data} dataKey={dataKey} nameKey={nameKey} cx="50%" cy="50%" outerRadius={90} label={({ value }: any) => value}>
          {data.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Legend formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 11 }}>{v}</span>} />
        <Tooltip contentStyle={tooltipStyle} />
      </PieChart>
    </ResponsiveContainer>
  );
}
export function RadarChartCard({ data, dataKey, angleKey, height = 300 }: any) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data}>
        <PolarGrid stroke="#334155" />
        <PolarAngleAxis dataKey={angleKey} stroke="#94a3b8" style={{ fontSize: 11 }} />
        <PolarRadiusAxis stroke="#64748b" />
        <Radar dataKey={dataKey} stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.5} />
        <Tooltip contentStyle={tooltipStyle} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

export function Card({ title, subtitle, children, className = '' }: any) {
  return (
    <div className={"bg-slate-800/50 border border-slate-700 rounded-xl p-5 " + className}>
      {title && <div className="mb-4">
        <h3 className="text-xs text-slate-400 uppercase tracking-wider font-semibold">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>}
      {children}
    </div>
  );
}

export function KPI({ label, value, delta, color = 'purple' }: any) {
  const g: any = {
    purple: 'from-purple-500 to-pink-500',
    cyan: 'from-cyan-500 to-blue-500',
    orange: 'from-orange-500 to-amber-500',
    emerald: 'from-emerald-500 to-teal-500',
    red: 'from-red-500 to-orange-500',
  };
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
      <div className="text-xs text-slate-400 uppercase tracking-wider">{label}</div>
      <div className={"text-3xl font-bold bg-gradient-to-r " + g[color] + " bg-clip-text text-transparent mt-2"}>{value}</div>
      {delta && <div className="text-xs text-slate-500 mt-1">{delta}</div>}
    </div>
  );
}

export function PageHeader({ title, subtitle, tags = [] }: { title: string, subtitle?: string, tags?: string[] }) {
  return (
    <header className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur border-b border-slate-800 px-8 py-4 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">{title}</h1>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex gap-2">
          {tags.map(t => <span key={t} className="px-2 py-1 bg-slate-800 border border-slate-700 text-xs text-cyan-400 font-mono rounded">{t}</span>)}
        </div>
      </div>
    </header>
  );
}
