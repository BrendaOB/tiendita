import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function Categories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'admin';
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get('/categories');
      setCategories(res.data.data || []);
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  const openNewDialog = () => {
    setIsEditing(false);
    setCurrentId(null);
    setName('');
    setDescription('');
    setIsDialogOpen(true);
  };

  const openEditDialog = (cat: any) => {
    setIsEditing(true);
    setCurrentId(cat.id);
    setName(cat.name);
    setDescription(cat.description || '');
    setIsDialogOpen(true);
  };

  const saveCategory = async () => {
    try {
      if (isEditing && currentId) {
        await api.put(`/categories/${currentId}`, { name, description });
        toast.success('Categoría actualizada con éxito.');
      } else {
        await api.post('/categories', { name, description });
        toast.success('Categoría creada con éxito.');
      }
      setIsDialogOpen(false);
      fetchCategories();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error guardando la categoría.');
    }
  };

  const deleteCategory = async (id: number) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta categoría? Sus productos quedarán huérfanos.")) return;
    try {
      await api.delete(`/categories/${id}`);
      toast.success('Categoría eliminada correctamente.');
      fetchCategories();
    } catch (e) {
      toast.error('Error crítico de borrado. Administrador requerido.');
    }
  };

  return (
    <div className="flex-1 p-4 md:p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        
        {/* Header Superior App-like */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4 md:mb-8">
          <div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-neutral-900 flex items-center gap-4">
              Categorías 
            </h1>
            <p className="text-neutral-500 font-semibold mt-1.5 text-sm md:text-lg">Metadatos maestros de agrupamiento.</p>
          </div>
          <Button onClick={openNewDialog} className="w-full md:w-auto h-14 rounded-2xl font-black md:px-8 text-[15px] bg-neutral-900 text-white shadow-lg shadow-neutral-900/10">
            <Plus className="w-5 h-5 mr-2"/> Instanciar Categoría
          </Button>
        </div>

        <Card className="bg-white/80 backdrop-blur-xl rounded-[32px] p-2 md:p-6 shadow-sm border border-neutral-200/60 flex flex-col">
          <CardContent className="p-0 overflow-x-auto custom-scrollbar">
            <Table>
              <TableHeader>
                <TableRow className="border-neutral-100 hover:bg-transparent">
                  <TableHead className="font-extrabold text-neutral-400 uppercase tracking-widest pl-4 md:pl-6 text-[12px]">Tópico Nominal</TableHead>
                  <TableHead className="font-extrabold text-neutral-400 uppercase tracking-widest text-[12px] hidden md:table-cell">Descripción Relativa</TableHead>
                  <TableHead className="text-right font-extrabold text-neutral-400 uppercase tracking-widest pr-4 md:pr-6 text-[12px]"><span className="sr-only">Acciones</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((cat) => (
                  <TableRow key={cat.id} className="border-neutral-100 hover:bg-neutral-50/50 transition-colors group">
                    <TableCell className="pl-4 md:pl-6 py-5">
                       <div className="flex items-center gap-3">
                         <div className="bg-neutral-100 text-neutral-500 font-bold text-xs px-2.5 py-1 rounded-lg shrink-0">#{cat.id}</div>
                         <div className="font-black text-neutral-800 text-[16px] md:text-[18px]">{cat.name}</div>
                       </div>
                       <div className="md:hidden text-[13px] font-semibold text-neutral-400 mt-2 ml-12">{cat.description || '-'}</div>
                    </TableCell>
                    <TableCell className="text-neutral-500 font-semibold text-[14px] truncate max-w-[250px] hidden md:table-cell">
                        {cat.description || '-'}
                    </TableCell>
                    <TableCell className="text-right pr-4 md:pr-6">
                       <div className="flex justify-end gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                         <Button variant="ghost" size="icon" className="h-10 w-10 md:h-12 md:w-12 rounded-2xl bg-white shadow-sm border border-neutral-100 hover:bg-neutral-50" onClick={() => openEditDialog(cat)}>
                           <Edit2 className="w-5 h-5 text-blue-600" />
                         </Button>
                         {isAdmin && (
                           <Button variant="ghost" size="icon" className="h-10 w-10 md:h-12 md:w-12 rounded-2xl bg-white shadow-sm border border-neutral-100 hover:bg-red-50" onClick={() => deleteCategory(cat.id)}>
                               <Trash2 className="w-5 h-5 text-red-600" />
                           </Button>
                         )}
                       </div>
                    </TableCell>
                  </TableRow>
                ))}
                {categories.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={3} className="h-40 text-center text-neutral-500 font-medium">No hay directrices creadas.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[95vw] md:max-w-md border-0 rounded-[32px] p-6 md:p-8 bg-white/95 backdrop-blur-2xl shadow-2xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-black text-center md:text-left">{isEditing ? 'Renombrar Entorno' : 'Codificar Nueva Fila'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div className="space-y-1.5">
              <label className="text-[13px] font-extrabold uppercase tracking-widest text-neutral-400 ml-1">Título Jerárquico</label>
              <Input value={name} onChange={r => setName(r.target.value)} placeholder="Ej: Electrónicos..." className="h-14 rounded-2xl text-[16px] font-bold border-0 ring-1 ring-neutral-200 bg-white" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[13px] font-extrabold uppercase tracking-widest text-neutral-400 ml-1">Notas Cortas</label>
              <Input value={description} onChange={r => setDescription(r.target.value)} placeholder="Anotador descriptivo..." className="h-14 rounded-2xl text-[16px] font-bold border-0 ring-1 ring-neutral-200 bg-white" />
            </div>
          </div>
          <DialogFooter className="mt-8 gap-3">
            <Button variant="ghost" className="h-14 rounded-2xl font-bold text-[15px] px-8 text-neutral-500" onClick={() => setIsDialogOpen(false)}>Ignorar</Button>
            <Button className="h-14 rounded-2xl font-black text-[15px] px-8 bg-neutral-900 shadow-xl shadow-neutral-900/10 flex-1 md:flex-none" onClick={saveCategory} disabled={!name}>Sellar Datos</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
