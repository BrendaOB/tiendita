import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { ChevronLeft, ChevronRight, ListFilter, CreditCard, Banknote, User, PackageOpen, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export default function SalesHistory() {
  const [sales, setSales] = useState<any[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalsByMethod, setTotalsByMethod] = useState<{method: string, total_amount: string}[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros y Paginación
  const [limit, setLimit] = useState('10');
  const [page, setPage] = useState(1);
  const [dateFilter, setDateFilter] = useState('today');
  
  // Custom Date
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Dialogo de Detalles
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [saleDetails, setSaleDetails] = useState<any[]>([]);
  const [salePayments, setSalePayments] = useState<any[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    fetchSales();
  }, [page, limit, dateFilter]);

  const fetchSales = async () => {
    setLoading(true);
    let offset = (page - 1) * parseInt(limit);
    let finalDateFilter = dateFilter;
    
    // Inyectar Custom Date al backend parseado
    if (dateFilter === 'custom' && customStart && customEnd) {
      finalDateFilter = `${customStart} to ${customEnd}`;
    }

    try {
      const res = await api.get(`/sales?limit=${limit}&offset=${offset}&date_filter=${finalDateFilter}`);
      setSales(res.data.data || []);
      setTotalItems(res.data.total || 0);
      setTotalsByMethod(res.data.totalsByMethod || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const applyCustomDate = () => {
    if (customStart && customEnd) {
       setPage(1);
       setDateFilter('custom');
       fetchSales();
    }
  };

  const getSaleDetails = async (sale: any) => {
    setSelectedSale(sale);
    setDetailsLoading(true);
    try {
      const res = await api.get(`/sales/${sale.id}/details`);
      if (res.data.data && res.data.data.details) {
         setSaleDetails(res.data.data.details);
         setSalePayments(res.data.data.payments || []);
      } else {
         setSaleDetails(res.data.data || []);
         setSalePayments([]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDetailsLoading(false);
    }
  };

  const totalPages = Math.ceil(totalItems / parseInt(limit));

  return (
    <div className="flex-1 p-4 md:p-8 overflow-y-auto bg-neutral-100">
      <div className="max-w-[1200px] mx-auto w-full space-y-6">
        
        {/* Header y Filtros */}
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 mb-4">
          <div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-neutral-900 flex items-center gap-4">Arqueo y Diario</h1>
            <p className="text-neutral-500 font-semibold mt-2 text-sm md:text-lg">Auditoría remota del volumen transaccional de caja.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
             <div className="flex-1 min-w-[150px]">
                <label className="text-[12px] font-black uppercase text-neutral-500 mb-1 block">Periodo</label>
                <Select value={dateFilter} onValueChange={(v) => { setDateFilter(v || ""); setPage(1); }}>
                  <SelectTrigger className="h-12 rounded-2xl font-bold bg-white ring-1 ring-neutral-200 border-0">
                    <SelectValue placeholder="Seleccionar Periodo" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl font-bold">
                    <SelectItem value="today">Día de Hoy</SelectItem>
                    <SelectItem value="month">Este Mes</SelectItem>
                    <SelectItem value="year">Histórico Anual</SelectItem>
                    <SelectItem value="all">Todo desde Inicio</SelectItem>
                    <SelectItem value="custom">Rango Específico</SelectItem>
                  </SelectContent>
                </Select>
             </div>

             <div className="w-[100px]">
                <label className="text-[12px] font-black uppercase text-neutral-500 mb-1 block">Paginación</label>
                <Select value={limit} onValueChange={(v) => { setLimit(v || ""); setPage(1); }}>
                  <SelectTrigger className="h-12 rounded-2xl font-bold bg-white ring-1 ring-neutral-200 border-0 text-center">
                    <SelectValue placeholder="10" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl font-bold">
                    <SelectItem value="5">5 Filas</SelectItem>
                    <SelectItem value="10">10 Filas</SelectItem>
                    <SelectItem value="20">20 Filas</SelectItem>
                    <SelectItem value="50">50 Filas</SelectItem>
                  </SelectContent>
                </Select>
             </div>
          </div>
        </div>

        {/* Formulario Custom Date Condicional */}
        {dateFilter === 'custom' && (
           <Card className="bg-white/90 backdrop-blur-md rounded-3xl border border-blue-100 shadow-sm p-4 w-full xl:max-w-xl animate-in fade-in slide-in-from-top-4">
              <div className="flex flex-col sm:flex-row items-end gap-3">
                 <div className="w-full">
                    <label className="text-[11px] font-black uppercase text-neutral-500">Desde</label>
                    <Input type="date" value={customStart} onChange={e=>setCustomStart(e.target.value)} className="h-12 rounded-xl bg-neutral-50 font-bold border-0 ring-1 ring-neutral-200" />
                 </div>
                 <div className="w-full">
                    <label className="text-[11px] font-black uppercase text-neutral-500">Hasta</label>
                    <Input type="date" value={customEnd} onChange={e=>setCustomEnd(e.target.value)} className="h-12 rounded-xl bg-neutral-50 font-bold border-0 ring-1 ring-neutral-200" />
                 </div>
                 <Button onClick={applyCustomDate} className="h-12 rounded-xl font-bold px-6 bg-blue-600 hover:bg-blue-700 text-white shadow-md">Buscar</Button>
              </div>
           </Card>
        )}

         {/* TOTALES POR MÉTODO */}
         {totalsByMethod.length > 0 && !loading && (
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              {totalsByMethod.map((t) => (
                  <Card key={t.method} className={`border-0 rounded-3xl shadow-sm bg-white overflow-hidden ${t.method === 'efectivo' ? 'ring-1 ring-green-100' : t.method === 'yape' ? 'ring-1 ring-purple-100' : t.method === 'plin' ? 'ring-1 ring-blue-100' : t.method === 'tarjeta' ? 'ring-1 ring-indigo-100' : 'ring-1 ring-neutral-200'}`}>
                     <CardContent className="p-5 flex flex-col items-center text-center">
                        <div className={`w-10 h-10 rounded-xl mb-2 flex items-center justify-center ${t.method === 'efectivo' ? 'bg-green-100/50 text-green-600' : t.method === 'yape' ? 'bg-purple-100/50 text-purple-600' : t.method === 'plin' ? 'bg-blue-100/50 text-blue-600' : t.method === 'tarjeta' ? 'bg-indigo-100/50 text-indigo-600' : 'bg-neutral-100 text-neutral-600'}`}>
                           {t.method === 'efectivo' ? <Banknote className="w-5 h-5"/> : t.method === 'tarjeta' ? <CreditCard className="w-5 h-5"/> : <Banknote className="w-5 h-5"/>}
                        </div>
                        <span className="text-[12px] font-black uppercase text-neutral-400 tracking-widest">{t.method}</span>
                        <div className="text-xl font-black mt-1 text-neutral-800">S/ {parseFloat(t.total_amount).toFixed(2)}</div>
                     </CardContent>
                  </Card>
              ))}
           </div>
         )}

        {/* FEED MOVIL DE RECIBOS (Mobile-First) vs TABLA ESCRITORIO */}
        <div className="mt-8">
           {loading ? (
             <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>
           ) : sales.length === 0 ? (
             <div className="bg-white/60 p-12 rounded-3xl border border-neutral-200 text-center text-neutral-500 font-bold flex flex-col items-center">
                <ListFilter className="w-12 h-12 mb-3 text-neutral-300"/>
                No se hallaron registros financieros en este criterio de tiempo.
             </div>
           ) : (
             <>
               {/* VISTA MÓVIL (Tickets Apilados) */}
               <div className="grid grid-cols-1 md:hidden gap-4">
                 {sales.map((s) => (
                    <div key={s.id} onClick={() => getSaleDetails(s)} className="bg-white rounded-3xl p-5 shadow-sm border border-neutral-100 flex flex-col gap-3 active:scale-[0.98] transition-transform relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><Banknote className="w-20 h-20"/></div>
                       <div className="flex justify-between items-start z-10">
                          <div>
                             <span className="text-[12px] font-extrabold text-neutral-400">TKT-{s.id}</span>
                             <div className="font-black text-[18px] text-green-700">S/ {parseFloat(s.total).toFixed(2)}</div>
                          </div>
                          <div className="flex flex-wrap items-center justify-end gap-1 mt-1">
                             {s.payments_raw ? s.payments_raw.split('|').map((pay: string, i: number) => {
                                const [method, amount] = pay.split(':');
                                return (
                                 <span key={i} className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-widest ${method === 'efectivo' ? 'bg-green-100 text-green-700' : method === 'yape' ? 'bg-purple-100 text-purple-700' : method === 'plin' ? 'bg-blue-100 text-blue-700' : method === 'tarjeta' ? 'bg-indigo-100 text-indigo-700' : 'bg-neutral-200 text-neutral-700'}`}>
                                    {method} {parseFloat(amount).toFixed(0)}
                                 </span>
                                );
                             }) : <span className="text-[10px] uppercase text-neutral-400 font-bold">Sin Medio</span>}
                          </div>
                       </div>
                       <div className="flex items-center gap-2 text-neutral-500 text-[13px] font-bold z-10 mt-1">
                          <User className="w-4 h-4 text-neutral-400"/> Cajero: {s.user_name || 'Desconocido'}
                       </div>
                       <div className="flex items-center justify-between z-10 pt-2 border-t border-neutral-50 mt-1">
                          <span className="text-[12px] text-neutral-400 font-semibold">{new Date(s.created_at).toLocaleString('es-PE', {hour12:true, day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit'})}</span>
                          <span className="text-blue-600 font-bold text-[13px] flex items-center">Ver Items <ArrowRight className="w-3.5 h-3.5 ml-1"/></span>
                       </div>
                    </div>
                 ))}
               </div>

               {/* VISTA ESCRITORIO (Tabla Rígida Densa) */}
               <div className="hidden md:block bg-white/90 backdrop-blur-xl border border-neutral-200/80 rounded-3xl overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-neutral-50/80 border-b border-neutral-200">
                        <th className="py-4 pl-6 font-extrabold text-[12px] uppercase text-neutral-400 tracking-wider">TKT</th>
                        <th className="py-4 font-extrabold text-[12px] uppercase text-neutral-400 tracking-wider">Fecha Autorización</th>
                        <th className="py-4 font-extrabold text-[12px] uppercase text-neutral-400 tracking-wider flex items-center gap-1.5"><User className="w-4 h-4"/> Agente Responsable</th>
                        <th className="py-4 font-extrabold text-[12px] uppercase text-neutral-400 tracking-wider">Método de Arqueo</th>
                        <th className="py-4 font-extrabold text-[12px] uppercase text-neutral-400 tracking-wider text-right">Volumen Bruto</th>
                        <th className="py-4 pr-6 font-extrabold text-[12px] uppercase text-neutral-400 tracking-wider text-right">Auditar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sales.map((s) => (
                         <tr key={s.id} className="border-b border-neutral-100 hover:bg-blue-50/30 transition-colors group cursor-pointer" onClick={() => getSaleDetails(s)}>
                            <td className="py-4 pl-6"><span className="px-2.5 py-1 bg-neutral-100 text-neutral-600 font-bold rounded-lg text-xs">#{s.id}</span></td>
                            <td className="py-4 font-bold text-neutral-600 text-[14px]">
                               {new Date(s.created_at).toLocaleDateString('es-PE', {day:'numeric', month:'short', year:'numeric'})} <span className="text-neutral-400 ml-2">{new Date(s.created_at).toLocaleTimeString('es-PE', {hour:'2-digit', minute:'2-digit'})}</span>
                            </td>
                            <td className="py-4 font-bold text-neutral-800 text-[15px]">{s.user_name || 'Desconocido'}</td>
                            <td className="py-4">
                               <div className="flex flex-wrap items-center gap-1.5">
                                  {s.payments_raw ? s.payments_raw.split('|').map((pay: string, i: number) => {
                                      const [method] = pay.split(':');
                                      return (
                                       <span key={i} className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold uppercase tracking-widest border border-white/50 shadow-sm ${method === 'efectivo' ? 'bg-green-50 text-green-600' : method === 'yape' ? 'bg-purple-50 text-purple-600' : method === 'plin' ? 'bg-blue-50 text-blue-600' : method === 'tarjeta' ? 'bg-indigo-50 text-indigo-600' : 'bg-neutral-100 text-neutral-600'}`}>
                                          {method==='efectivo'?<Banknote className="w-3.5 h-3.5"/> : method==='tarjeta'?<CreditCard className="w-3.5 h-3.5"/> : <Banknote className="w-3.5 h-3.5"/>}
                                          {method}
                                       </span>
                                      );
                                  }) : <span className="text-[11px] uppercase text-neutral-400 font-bold">SN</span>}
                               </div>
                            </td>
                            <td className="py-4 text-right font-black text-green-700 text-[16px]">S/ {parseFloat(s.total).toFixed(2)}</td>
                            <td className="py-4 pr-6 text-right">
                               <Button variant="ghost" className="h-10 text-blue-600 rounded-xl hover:bg-blue-100 opacity-0 group-hover:opacity-100 transition-opacity">Ver Ticket</Button>
                            </td>
                         </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
             </>
           )}
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
           <div className="flex justify-center md:justify-end items-center gap-4 mt-6">
              <Button disabled={page === 1} onClick={() => setPage(p=>p-1)} variant="outline" className="h-12 w-12 rounded-2xl bg-white border-0 ring-1 ring-neutral-200">
                 <ChevronLeft className="w-5 h-5"/>
              </Button>
              <div className="font-bold text-neutral-500 text-[14px]">
                 Página <span className="text-neutral-900 font-black">{page}</span> de {totalPages}
              </div>
              <Button disabled={page === totalPages} onClick={() => setPage(p=>p+1)} variant="outline" className="h-12 w-12 rounded-2xl bg-white border-0 ring-1 ring-neutral-200">
                 <ChevronRight className="w-5 h-5"/>
              </Button>
           </div>
        )}

      </div>

      {/* MODAL DETALLES DEL RECIBO */}
      <Dialog open={!!selectedSale} onOpenChange={() => setSelectedSale(null)}>
        <DialogContent className="w-[95vw] md:max-w-2xl border-0 rounded-[32px] p-0 bg-white shadow-2xl overflow-hidden flex flex-col">
          {selectedSale && (
            <>
              <div className="bg-neutral-900 p-6 md:p-8 text-white">
                 <div className="flex justify-between items-start">
                    <div>
                       <div className="text-neutral-400 font-bold text-sm tracking-widest uppercase mb-1">Copia Contable Recibo</div>
                       <h2 className="text-3xl font-black">TKT-{selectedSale.id}</h2>
                    </div>
                    <div className="text-right">
                       <div className="text-neutral-400 font-bold text-sm mb-1">{new Date(selectedSale.created_at).toLocaleDateString('es-PE')}</div>
                       <div className="text-green-400 font-black text-2xl">S/ {parseFloat(selectedSale.total).toFixed(2)}</div>
                    </div>
                 </div>
              </div>

              <div className="p-6 md:p-8 bg-neutral-50/50 flex-1 max-h-[60vh] overflow-y-auto custom-scrollbar">
                 <h3 className="text-[12px] font-extrabold uppercase tracking-widest text-neutral-400 mb-4 flex items-center"><PackageOpen className="w-4 h-4 mr-2"/> Cesta de Productos Transada</h3>
                 
                 {detailsLoading ? (
                    <div className="py-10 text-center font-bold text-neutral-500">Trayendo detalles criptográficos...</div>
                 ) : (
                    <div className="flex flex-col gap-3">
                       {saleDetails.map((detail, idx) => (
                          <div key={idx} className="bg-white p-4 rounded-2xl border border-neutral-100 flex justify-between items-center shadow-sm">
                             <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center font-black text-neutral-500 text-sm">{detail.quantity}x</div>
                                <div>
                                   <div className="font-bold text-[15px] text-neutral-800 leading-tight">{detail.product_name || 'Producto Eliminado'}</div>
                                   <div className="text-[12px] text-neutral-400 font-bold mt-0.5">{detail.barcode || 'S/N Barcode'}</div>
                                </div>
                             </div>
                             <div className="text-right flex flex-col">
                                <span className="font-black text-neutral-700 text-[16px]">S/ {parseFloat(detail.subtotal).toFixed(2)}</span>
                                <span className="text-[11px] text-neutral-400 font-bold">@ S/{parseFloat(detail.unit_price).toFixed(2)} c/u</span>
                             </div>
                          </div>
                       ))}
                    </div>
                 )}
                 
                 <div className="mt-8 flex flex-col gap-4">
                    <div className="h-[1px] bg-neutral-200 w-full" />
                    
                    <div className="font-mono text-[14px] bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm space-y-1">
                       <div className="flex justify-between font-black border-b border-dashed border-neutral-300 pb-3 mb-3 text-[16px] text-neutral-800">
                          <span>TOTAL:</span>
                          <span>S/ {parseFloat(selectedSale.total).toFixed(2)}</span>
                       </div>
                       
                       <div className="text-xs font-bold text-neutral-400 mb-2 uppercase tracking-widest font-sans">Detalle de Pago</div>
                       {salePayments.length > 0 ? (
                           salePayments.map((p: any, idx: number) => (
                              <div key={idx} className="flex justify-between items-center text-neutral-600">
                                 <span className="capitalize">{p.method}:</span>
                                 <span>S/ {parseFloat(p.amount).toFixed(2)} {p.reference_code ? <span className="text-[11px] text-neutral-400 font-sans ml-1">(Ref: {p.reference_code})</span> : ''}</span>
                              </div>
                           ))
                       ) : (
                           <div className="flex justify-between items-center text-neutral-600">
                               <span>Efectivo (Heredado):</span>
                               <span>S/ {parseFloat(selectedSale.total).toFixed(2)}</span>
                           </div>
                       )}
                    </div>
                 </div>

                 <div className="mt-8 flex justify-between items-center bg-white p-5 rounded-2xl ring-1 ring-blue-100">
                    <div>
                       <div className="text-[11px] text-neutral-400 font-extrabold uppercase tracking-widest">Agente de Caja</div>
                       <div className="font-bold text-[15px] text-blue-900 mt-1">{selectedSale.user_name || 'Agente Genérico'}</div>
                    </div>
                    <div className="text-right">
                       <div className="text-[11px] text-neutral-400 font-extrabold uppercase tracking-widest">Procedencia</div>
                       <div className="font-bold text-[15px] text-neutral-600 mt-1">
                           {salePayments.length > 0 ? 'Múltiples Vías' : 'Caja Efectiva (Antigua)'}
                       </div>
                    </div>
                 </div>
              </div>

              <div className="p-6 bg-white border-t border-neutral-100 text-right">
                 <Button onClick={() => setSelectedSale(null)} className="h-12 px-8 rounded-xl font-bold bg-neutral-200 text-neutral-700 hover:bg-neutral-300">Cerrar Visor</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
