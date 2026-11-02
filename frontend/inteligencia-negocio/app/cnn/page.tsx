import { PageHeader, Card } from '../components/Charts';
import { CNNClient } from './client';

export const metadata = { title: 'CNN · Visión por computador' };

export default function CNNPage() {
  return (
    <>
      <PageHeader title="📷 Deep Learning · CNN visión" subtitle="TensorFlow MobileNetV2 pretrained · análisis de imágenes" tags={['TensorFlow', 'CNN']} />
      <div className="px-8 pb-8 space-y-6">
        <Card title="Modelo activo" subtitle="Red convolucional pre-entrenada en ImageNet">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center text-3xl">🧠</div>
            <div>
              <div className="text-white font-bold">MobileNetV2</div>
              <div className="text-xs text-slate-400">Arquitectura: 53 layers · 3.5M params · Input 224×224×3</div>
              <div className="text-xs text-cyan-400 font-mono mt-1">Backend: TensorFlow 2.17 CPU · Python 3.12</div>
            </div>
          </div>
        </Card>
        <CNNClient />
      </div>
    </>
  );
}
