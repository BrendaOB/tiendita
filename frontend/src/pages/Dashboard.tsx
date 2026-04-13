import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '@/lib/api';
import { TrendingUp, AlertCircle, ShoppingBag, Package, Award } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role !== 'admin') {
       navigate('/pos');
       return;
    }
    fetchStats();
  }, [navigate]);

  const fetchStats = async () => {
    try {
      const res = await api.get('/dashboard/stats');
      setStats(res.data.data);
    } catch (e) {
      console.error(e);
    }
  };

  if (!stats) return <div className="p-10 font-bold text-neutral-500 text-lg flex justify-center items-center h-full">Calculando métricas visuales...</div>;

  return (
    <div className="flex-1 p-4 md:p-8 overflow-y-auto">
      <div className="max-w-[1400px] mx-auto w-full space-y-6 md:space-y-8">
        
        {/* Superior Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-2 md:mb-4">
          <div>
             <h1 className="text-3xl md:text-5xl font-black tracking-tight text-neutral-900 flex items-center gap-3">
               Mando Directivo
             </h1>
             <p className="text-neutral-500 font-semibold mt-1.5 text-sm md:text-lg">Radar estadístico de rendimiento general.</p>
          </div>
          <div className="hidden md:block text-sm font-bold bg-green-100 text-green-800 px-5 py-2.5 rounded-full shadow-sm border border-green-200">
             Acceso Directivo ACTIVO
          </div>
        </div>

        {/* Bento Grid Superior */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-5">
           
           {/* Total de hoy vibrante (LINK A SALES-HISTORY) */}
           <Link to="/sales-history" className="bg-gradient-to-br from-green-400 to-green-600 rounded-3xl p-6 md:p-8 shadow-xl shadow-green-600/20 text-white relative overflow-hidden group cursor-pointer hover:-translate-y-1 transition duration-200">
             <div className="absolute top-0 right-0 p-6 opacity-30 transform group-hover:scale-110 transition-transform"><TrendingUp className="w-20 h-20"/></div>
             <div className="relative z-10 flex flex-col h-full justify-between gap-8 md:gap-12">
                <p className="text-[13px] font-black uppercase tracking-widest text-green-100">Ingresos Hoy (Toca para ver Detalle)</p>
                <div>
                   <div className="text-5xl md:text-5xl font-black">S/ {stats.daily_sales.toFixed(2)}</div>
                   <p className="text-sm font-bold text-green-100 mt-2 opacity-90">Ver todo el histórico ▸</p>
                </div>
             </div>
           </Link>
           
           {/* Volumen de mes */}
           <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-sm border border-neutral-200/60 relative overflow-hidden flex flex-col justify-between gap-6 md:gap-12">
             <div className="flex justify-between items-start">
                 <p className="text-[13px] font-black uppercase tracking-widest text-neutral-400">Acumulado Mes Actual</p>
                 <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><ShoppingBag className="w-6 h-6"/></div>
             </div>
             <div>
                <div className="text-4xl md:text-4xl font-black text-neutral-900">S/ {stats.monthly_revenue.toFixed(2)}</div>
                <p className="text-sm font-bold text-neutral-500 mt-2">{stats.monthly_count} tickets cerrados con éxito.</p>
             </div>
           </div>

           {/* Alertas Críticas (LINK A PURCHASING) */}
           <Link to="/purchasing" className="bg-red-50/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-sm border border-red-100/50 relative overflow-hidden flex flex-col justify-between gap-6 md:gap-12 cursor-pointer group hover:-translate-y-1 transition duration-200">
             <div className="flex justify-between items-start">
                 <p className="text-[13px] font-black uppercase tracking-widest text-red-500 group-hover:text-red-700 transition">Stock Crítico (Toca Revisar)</p>
                 <div className="p-3 bg-red-100 text-red-600 rounded-2xl group-hover:bg-red-200 transition"><AlertCircle className="w-6 h-6"/></div>
             </div>
             <div>
                <div className="text-5xl font-black text-red-600">{stats.low_stock.length} <span className="text-2xl font-bold">unds.</span></div>
                <p className="text-[14px] font-bold text-red-500/80 mt-2 leading-tight">Módulo de Proveedores ▸</p>
             </div>
           </Link>

           {/* Catálogo Seguro */}
           <div className="hidden xl:flex bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-sm border border-neutral-200/60 flex-col justify-center items-center text-center gap-4">
               <div className="p-5 bg-neutral-100/80 rounded-full"><Package className="w-10 h-10 text-neutral-400"/></div>
               <div>
                  <p className="text-xl font-black text-neutral-900">Catálogo Seguro</p>
                  <p className="text-sm text-neutral-400 font-bold mt-1">Bases asíncronas en línea</p>
               </div>
           </div>
        </div>

        {/* Graficas y Tops */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6 mt-4">
           {/* Chart */}
           <div className="col-span-1 lg:col-span-3 xl:col-span-2 bg-white/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-sm border border-neutral-200/60 flex flex-col h-[420px] order-last xl:order-none">
             <h3 className="text-[15px] text-neutral-800 font-extrabold uppercase tracking-wider flex items-center mb-6"><TrendingUp className="w-5 h-5 mr-2 text-neutral-400"/> Rendimiento Ingresos Diarios</h3>
             <div className="h-[300px] w-full min-h-[300px] shrink-0 relative -left-4 md:-left-2 mt-2">
                <ResponsiveContainer width="100%" height="100%" debounce={300}>
                   <BarChart data={stats.chart}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                     <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: '#A3A3A3', fontWeight: '800' }} dy={15} />
                     <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: '#A3A3A3', fontWeight: '800' }} dx={-10} tickFormatter={(value) => `S/${value}`} />
                     <Tooltip cursor={{ fill: '#f5f5f5', radius: 10 }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px -5px rgba(0,0,0,0.15)', fontWeight: 'bold' }} formatter={(value) => [`S/ ${value}`, 'Ingresos']} />
                     <Bar dataKey="ingresos" fill="#171717" radius={[8, 8, 0, 0]} barSize={45} />
                   </BarChart>
                </ResponsiveContainer>
             </div>
           </div>

           {/* Ranking Vendedores y Productos (Apilados) */}
           <div className="col-span-1 lg:col-span-3 xl:col-span-1 flex flex-col gap-5 md:gap-6">
               
               {/* Ranking Vendedores */}
               <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-2 shadow-sm border border-neutral-200/60 flex flex-col flex-1 max-h-[300px] md:max-h-none">
                 <div className="p-6 pb-2">
                    <h3 className="text-[15px] text-neutral-800 font-extrabold uppercase tracking-wider flex items-center"><Award className="w-5 h-5 mr-3 text-yellow-500"/> Ránking Cajeros (Mes)</h3>
                 </div>
                 <div className="flex-1 overflow-auto p-3 custom-scrollbar">
                     <div className="flex flex-col gap-2.5">
                        {stats.ranking && stats.ranking.map((seller: any, idx: number) => (
                           <div key={idx} className={`p-4 rounded-2xl flex justify-between items-center transition-colors ${idx === 0 ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200' : 'bg-neutral-50/80 hover:bg-neutral-100 border border-transparent'}`}>
                              <div className="flex items-center gap-3">
                                 {idx === 0 ? (
                                     <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-yellow-400 to-orange-500 text-white rounded-xl shadow-lg shadow-orange-500/20 shrink-0"><Award className="w-6 h-6"/></div>
                                 ) : (
                                     <div className="w-8 h-8 flex items-center justify-center bg-white border border-neutral-200 text-neutral-900 rounded-xl text-[14px] font-black shadow-sm shrink-0">{idx + 1}</div>
                                 )}
                                 <span className={`font-bold text-[15px] leading-tight line-clamp-1 ${idx === 0 ? 'text-orange-900' : 'text-neutral-800'}`}>{seller.name}</span>
                              </div>
                              <div className="text-right flex flex-col">
                                 <span className="font-black text-green-700 text-[15px]">S/ {parseFloat(seller.total_sold).toFixed(2)}</span>
                                 {idx === 0 && <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mt-[-2px]">Líder</span>}
                              </div>
                           </div>
                        ))}
                        {(!stats.ranking || stats.ranking.length === 0) && (
                           <div className="p-10 text-center text-neutral-400 font-medium">Ningún cajero activo.</div>
                        )}
                     </div>
                 </div>
               </div>

               {/* Top Productos */}
               <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-2 shadow-sm border border-neutral-200/60 flex flex-col flex-1 max-h-[300px] md:max-h-none">
                 <div className="p-6 pb-2">
                    <h3 className="text-[15px] text-neutral-800 font-extrabold uppercase tracking-wider flex items-center"><ShoppingBag className="w-5 h-5 mr-3 text-neutral-400"/> Tops Productos</h3>
                 </div>
                 <div className="flex-1 overflow-auto p-3 custom-scrollbar">
                     <div className="flex flex-col gap-2.5">
                        {stats.top_products.map((p: any, idx: number) => (
                           <div key={idx} className="p-3 rounded-2xl flex justify-between items-center bg-neutral-50/80 hover:bg-neutral-100 transition-colors">
                              <div className="flex items-center gap-3">
                                 <div className="w-7 h-7 flex items-center justify-center bg-white border border-neutral-200 text-neutral-900 rounded-lg text-[13px] font-black shadow-sm shrink-0">{idx + 1}</div>
                                 <span className="font-bold text-neutral-800 text-[13px] leading-tight line-clamp-1 max-w-[130px]">{p.name}</span>
                              </div>
                              <span className="font-extrabold text-neutral-500 bg-white shadow-sm border border-neutral-100 px-2 py-1 rounded-lg text-[12px] shrink-0">{p.total_sold} <span className="font-medium text-[10px]">u</span></span>
                           </div>
                        ))}
                        {stats.top_products.length === 0 && (
                           <div className="p-5 text-center text-neutral-400 font-medium">Sin ventas registradas.</div>
                        )}
                     </div>
                 </div>
               </div>

           </div>
        </div>
      </div>
    </div>
  );
}
