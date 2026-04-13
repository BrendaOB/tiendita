import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Phone, Building, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function PurchasingReport() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/dashboard/stats');
        setStats(res.data.data);
      } catch (e) {
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="p-10 font-bold text-neutral-500 text-lg flex justify-center items-center h-full">Evaluando Inventario...</div>;

  const lowStock = stats?.low_stock || [];

  return (
    <div className="flex-1 p-4 md:p-8 overflow-y-auto">
      <div className="max-w-[1400px] mx-auto w-full space-y-6">
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4 md:mb-8">
          <div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-red-600 flex items-center gap-4">
              Directorio de Compras <AlertCircle className="w-8 h-8 hidden md:block" />
            </h1>
            <p className="text-neutral-500 font-semibold mt-1.5 text-sm md:text-lg">Catálogo urgente de re-abastecimiento por proveedor.</p>
          </div>
          <div className="bg-red-50 text-red-700 px-6 py-3 rounded-2xl font-black text-lg border border-red-200">
             {lowStock.length} Alarmas
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
           {lowStock.map((p: any) => (
             <Card key={p.id} className="bg-white/80 backdrop-blur-xl rounded-[32px] p-6 shadow-xl shadow-red-900/5 border-2 border-red-100 flex flex-col hover:scale-[1.02] transition-transform">
               <div className="flex justify-between items-start mb-6">
                 <div>
                   <div className="bg-red-100 text-red-700 text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-3 inline-block">Stock: {p.stock} / {p.min_stock}</div>
                   <h3 className="font-extrabold text-xl text-neutral-900 leading-tight pr-4">{p.name}</h3>
                 </div>
               </div>
               
               <div className="bg-neutral-50 rounded-2xl p-5 mt-auto border border-neutral-100">
                  <div className="flex flex-col gap-3">
                     <span className="text-[12px] font-black uppercase tracking-widest text-neutral-400 flex items-center gap-2"><Building className="w-4 h-4"/> Proveedor Asignado</span>
                     <span className="font-bold text-[16px] text-neutral-800">{p.supplier_name || 'Sin Proveedor Asignado'}</span>
                     
                     {p.supplier_phone && (
                        <a href={`tel:${p.supplier_phone}`}>
                           <Button className="w-full h-14 rounded-xl font-black bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/20 text-[15px] mt-2 group">
                              <Phone className="w-5 h-5 mr-3 group-hover:animate-bounce"/> Llamar: {p.supplier_phone}
                           </Button>
                        </a>
                     )}
                     {!p.supplier_phone && p.supplier_name && (
                         <div className="text-red-500 font-bold text-sm mt-3">Proveedor no tiene teléfono registrado.</div>
                     )}
                     {!p.supplier_name && (
                         <div className="text-neutral-400 font-bold text-sm mt-3">Desconocemos dónde surtir esto.</div>
                     )}
                  </div>
               </div>
             </Card>
           ))}
           {lowStock.length === 0 && (
             <div className="col-span-full py-20 text-center text-green-600 font-black text-2xl bg-green-50 rounded-[32px] border border-green-200">
                Todo el Almacén está saludable.
             </div>
           )}
        </div>

      </div>
    </div>
  );
}
