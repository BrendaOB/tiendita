import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { History, Activity } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Kardex() {
  const [entries, setEntries] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [filterProduct, setFilterProduct] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
    fetchKardex('all');
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      setProducts(res.data.data || []);
    } catch (e) {}
  };

  const fetchKardex = async (prodId: string) => {
    try {
      setLoading(true);
      const url = prodId === 'all' ? '/kardex' : `/kardex?product_id=${prodId}`;
      const res = await api.get(url);
      setEntries(res.data.data || []);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = (v: string) => {
    setFilterProduct(v);
    fetchKardex(v);
  }

  return (
    <div className="flex-1 p-4 md:p-8 overflow-y-auto">
      <div className="max-w-[1400px] mx-auto w-full space-y-6">
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4 md:mb-8">
          <div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-neutral-900 flex items-center gap-4">
              Libro Kardex <History className="w-8 h-8 text-neutral-400 hidden md:block" />
            </h1>
            <p className="text-neutral-500 font-semibold mt-1.5 text-sm md:text-lg">Trazabilidad incorruptible de stocks.</p>
          </div>
          
          <div className="w-full md:w-72">
             <Select value={filterProduct} onValueChange={(v) => handleFilter(v || "")}>
               <SelectTrigger className="h-14 rounded-2xl text-[16px] font-bold border-0 ring-1 ring-neutral-200 bg-white">
                 <SelectValue placeholder="Todos los productos" />
               </SelectTrigger>
               <SelectContent className="rounded-2xl">
                 <SelectItem value="all" className="font-bold">Todos los movimientos</SelectItem>
                 {products.map(p => (
                   <SelectItem key={p.id} value={p.id.toString()} className="font-bold">{p.name}</SelectItem>
                 ))}
               </SelectContent>
             </Select>
          </div>
        </div>

        <Card className="bg-white/80 backdrop-blur-xl rounded-[32px] p-2 md:p-6 shadow-sm border border-neutral-200/60 flex flex-col">
          <CardContent className="p-0 overflow-x-auto custom-scrollbar">
            <Table>
              <TableHeader>
                <TableRow className="border-neutral-100 hover:bg-transparent">
                  <TableHead className="font-extrabold text-neutral-400 uppercase tracking-widest pl-4 md:pl-6 text-[12px]">Registro / Fecha</TableHead>
                  <TableHead className="font-extrabold text-neutral-400 uppercase tracking-widest text-[12px]">Artículo Afectado</TableHead>
                  <TableHead className="text-center font-extrabold text-neutral-400 uppercase tracking-widest text-[12px]">Delta (Q)</TableHead>
                  <TableHead className="text-right font-extrabold text-neutral-400 uppercase tracking-widest text-[12px] pr-4 md:pr-6">Motivo & Operador</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((e) => (
                  <TableRow key={e.id} className="border-neutral-100 hover:bg-neutral-50/50 transition-colors group">
                    <TableCell className="pl-4 md:pl-6 py-5 whitespace-nowrap">
                       <div className="font-black text-neutral-800 text-[14px] md:text-[16px]">{new Date(e.created_at).toLocaleDateString()}</div>
                       <div className="text-[12px] font-bold text-neutral-400 mt-1">{new Date(e.created_at).toLocaleTimeString()}</div>
                    </TableCell>
                    <TableCell>
                        <div className="font-bold text-neutral-800 text-[15px]">{e.product_name}</div>
                    </TableCell>
                    <TableCell className="text-center">
                       <span className={`inline-block px-3 py-1.5 rounded-xl text-[14px] font-black tracking-wide ${
                         e.tipo_movimiento === 'entrada' ? 'bg-green-100 text-green-700' :
                         e.tipo_movimiento === 'salida' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
                       }`}>
                         {e.tipo_movimiento === 'entrada' ? '+' : '-'}{e.cantidad}
                       </span>
                       <div className="text-[11px] font-bold text-neutral-400 mt-1 tracking-widest uppercase">Stock {e.stock_resultante}</div>
                    </TableCell>
                    <TableCell className="text-right pr-4 md:pr-6">
                       <div className="font-bold text-neutral-600 text-[14px]">{e.motivo || '-'}</div>
                       <div className="text-[12px] font-bold text-blue-500 mt-1 flex items-center justify-end gap-1"><Activity className="w-3 h-3"/> @{e.user_name}</div>
                    </TableCell>
                  </TableRow>
                ))}
                {entries.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={4} className="h-40 text-center text-neutral-500 font-medium">Kardex virgen. No hay transacciones logueadas.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
