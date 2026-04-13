import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);
  
  const [form, setForm] = useState({ name: '', ruc: '', phone: '', email: '', address: '' });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/suppliers');
      setSuppliers(res.data.data || []);
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  const openNewDialog = () => {
    setIsEditing(false);
    setCurrentId(null);
    setForm({ name: '', ruc: '', phone: '', email: '', address: '' });
    setIsDialogOpen(true);
  };

  const openEditDialog = (s: any) => {
    setIsEditing(true);
    setCurrentId(s.id);
    setForm({ name: s.name, ruc: s.ruc || '', phone: s.phone || '', email: s.email || '', address: s.address || '' });
    setIsDialogOpen(true);
  };

  const saveSupplier = async () => {
    try {
      if (isEditing && currentId) {
        await api.put(`/suppliers/${currentId}`, form);
        toast.success('Proveedor actualizado.');
      } else {
        await api.post('/suppliers', form);
        toast.success('Proveedor registrado con éxito.');
      }
      setIsDialogOpen(false);
      fetchSuppliers();
    } catch (e: any) { 
      console.error(e);
      toast.error('Hubo un problema al guardar los datos del proveedor.'); 
    }
  };

  const deleteSupplier = async (id: number) => {
    if (!window.confirm("¿Seguro que deseas eliminar este proveedor? Sus productos quedarán vinculados a nulo.")) return;
    try {
      await api.delete(`/suppliers/${id}`);
      toast.success('Proveedor eliminado exitosamente.');
      fetchSuppliers();
    } catch (e) { 
        console.error(e);
        toast.error('Tuvimos un percance borrando el proveedor.'); 
    }
  };

  return (
    <div className="flex-1 p-4 md:p-8 overflow-y-auto">
      <div className="max-w-[1400px] mx-auto w-full space-y-6">
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4 md:mb-8">
          <div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-neutral-900 flex items-center gap-4">
              Proveedores
            </h1>
            <p className="text-neutral-500 font-semibold mt-1.5 text-sm md:text-lg">Entidades de reposición y manufactura.</p>
          </div>
          <Button onClick={openNewDialog} className="w-full md:w-auto h-14 rounded-2xl font-black md:px-8 text-[15px] bg-neutral-900 text-white shadow-lg shadow-neutral-900/10">
            <Plus className="w-5 h-5 mr-2"/> Nuevo Proveedor
          </Button>
        </div>

        <Card className="bg-white/80 backdrop-blur-xl rounded-[32px] p-2 md:p-6 shadow-sm border border-neutral-200/60 flex flex-col">
          <CardContent className="p-0 overflow-x-auto custom-scrollbar">
            <Table>
              <TableHeader>
                <TableRow className="border-neutral-100 hover:bg-transparent">
                  <TableHead className="font-extrabold text-neutral-400 uppercase tracking-widest pl-4 md:pl-6 text-[12px]">Empresa</TableHead>
                  <TableHead className="font-extrabold text-neutral-400 uppercase tracking-widest text-[12px]">Contacto</TableHead>
                  <TableHead className="font-extrabold text-neutral-400 uppercase tracking-widest text-[12px] hidden md:table-cell">Reg. Fiscal</TableHead>
                  <TableHead className="text-right font-extrabold text-neutral-400 uppercase tracking-widest pr-4 md:pr-6 text-[12px]"><span className="sr-only">Acciones</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map((s) => (
                  <TableRow key={s.id} className="border-neutral-100 hover:bg-neutral-50/50 transition-colors group">
                    <TableCell className="pl-4 md:pl-6 py-5">
                       <div className="font-black text-neutral-800 text-[16px] md:text-[18px]">{s.name}</div>
                       <div className="md:hidden text-[13px] font-semibold text-neutral-400 mt-1">{s.ruc || 'S/N RUC'}</div>
                    </TableCell>
                    <TableCell className="text-neutral-500 font-semibold text-[14px]">
                        <div className="font-bold text-neutral-800">{s.phone || 'S/N Teléfono'}</div>
                        <div className="text-[12px]">{s.email}</div>
                    </TableCell>
                    <TableCell className="text-neutral-500 font-semibold text-[14px] truncate hidden md:table-cell">
                        {s.ruc || '-'}
                    </TableCell>
                    <TableCell className="text-right pr-4 md:pr-6">
                       <div className="flex justify-end gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                         <Button variant="ghost" size="icon" className="h-10 w-10 md:h-12 md:w-12 rounded-2xl bg-white shadow-sm border border-neutral-100 hover:bg-neutral-50" onClick={() => openEditDialog(s)}>
                           <Edit2 className="w-5 h-5 text-blue-600" />
                         </Button>
                         <Button variant="ghost" size="icon" className="h-10 w-10 md:h-12 md:w-12 rounded-2xl bg-white shadow-sm border border-neutral-100 hover:bg-red-50" onClick={() => deleteSupplier(s.id)}>
                             <Trash2 className="w-5 h-5 text-red-600" />
                         </Button>
                       </div>
                    </TableCell>
                  </TableRow>
                ))}
                {suppliers.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={4} className="h-40 text-center text-neutral-500 font-medium">Bases de datos de proveedores vacía.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[95vw] md:max-w-xl border-0 rounded-[32px] p-6 md:p-8 bg-white/95 backdrop-blur-2xl shadow-2xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-black text-center md:text-left">{isEditing ? 'Editar Proveedor' : 'Nuevo Suministrador'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 grid grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-2">
              <label className="text-[13px] font-extrabold uppercase tracking-widest text-neutral-400 ml-1">Razón Social</label>
              <Input value={form.name} onChange={r => setForm({...form, name: r.target.value})} placeholder="Ej: Distribuidora SAC..." className="h-14 rounded-2xl text-[16px] font-bold border-0 ring-1 ring-neutral-200 bg-white" />
            </div>
            <div className="space-y-1.5 col-span-1">
              <label className="text-[13px] font-extrabold uppercase tracking-widest text-neutral-400 ml-1">Reg Fiscal (RUC)</label>
              <Input value={form.ruc} onChange={r => setForm({...form, ruc: r.target.value})} placeholder="Num Tributario..." className="h-14 rounded-2xl text-[16px] font-bold border-0 ring-1 ring-neutral-200 bg-white" />
            </div>
            <div className="space-y-1.5 col-span-1">
              <label className="text-[13px] font-extrabold uppercase tracking-widest text-neutral-400 ml-1">Teléfono C.</label>
              <Input value={form.phone} onChange={r => setForm({...form, phone: r.target.value})} placeholder="+51 900..." className="h-14 rounded-2xl text-[16px] font-bold border-0 ring-1 ring-neutral-200 bg-white" />
            </div>
            <div className="space-y-1.5 col-span-2">
              <label className="text-[13px] font-extrabold uppercase tracking-widest text-neutral-400 ml-1">Email (Corporativo)</label>
              <Input type="email" value={form.email} onChange={r => setForm({...form, email: r.target.value})} placeholder="venta@proveedor.com" className="h-14 rounded-2xl text-[16px] font-bold border-0 ring-1 ring-neutral-200 bg-white" />
            </div>
          </div>
          <DialogFooter className="mt-8 gap-3">
            <Button variant="ghost" className="h-14 rounded-2xl font-bold text-[15px] px-8 text-neutral-500" onClick={() => setIsDialogOpen(false)}>Descartar</Button>
            <Button className="h-14 rounded-2xl font-black text-[15px] px-8 bg-neutral-900 shadow-xl shadow-neutral-900/10 flex-1 md:flex-none" onClick={saveSupplier} disabled={!form.name}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
