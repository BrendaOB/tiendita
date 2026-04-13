import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import { Upload, Plus, Edit2, Trash2, Camera, Barcode, Tag, DollarSign, Package, AlertTriangle, Box, RefreshCw, X, GripVertical } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, horizontalListSortingStrategy, arrayMove, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableItem = ({ id, url, onRemove }: { id: string, url: string, onRemove: (id: string) => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="relative group w-[100px] h-[100px] shrink-0 touch-none">
      <div {...attributes} {...listeners} className="w-full h-full cursor-grab active:cursor-grabbing rounded-2xl overflow-hidden ring-1 ring-neutral-200">
         <img src={url} className="w-full h-full object-cover" alt="img" />
         <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
            <GripVertical className="text-white w-6 h-6" />
         </div>
      </div>
      <button type="button" onClick={() => onRemove(id)} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-sm z-10 w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
         <X className="w-3 h-3" />
      </button>
    </div>
  );
};

export default function Inventory() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photosInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'admin';

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);

  const [form, setForm] = useState({
    barcode: '', name: '', description: '', category_id: 'none', supplier_id: 'none',
    cost: '', price: '', stock: '0', min_stock: '5'
  });
  
  const [formError, setFormError] = useState<string[]>([]);
  
  // Images Upload State
  const [images, setImages] = useState<{id: string, url: string}[]>([]);
  const [isUploadingImgs, setIsUploadingImgs] = useState(false);

  useEffect(() => {
    fetchProducts(); fetchCategories(); fetchSuppliers();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      setProducts(res.data.data || []);
    } catch (e: any) { console.error("🔍 Debug Error:", { status: e.response?.status, data: e.response?.data, endpoint: e.config?.url }); } finally { setLoading(false); }
  };
  const fetchCategories = async () => {
    try { const res = await api.get('/categories'); setCategories(res.data.data || []); } catch (e: any) { console.error("🔍 Debug Error:", { status: e.response?.status, data: e.response?.data, endpoint: e.config?.url }); }
  };
  const fetchSuppliers = async () => {
    try { const res = await api.get('/suppliers'); setSuppliers(res.data.data || []); } catch (e: any) { console.error("🔍 Debug Error:", { status: e.response?.status, data: e.response?.data, endpoint: e.config?.url }); }
  };

  const handleUploadCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    try {
      setLoading(true);
      const res = await api.post('/products/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(`Importación exitosa. ${res.data.inserted_rows} registros grabados.`);
      fetchProducts();
    } catch (err: any) { 
      toast.error('Tuvimos un problema durante la importación.'); 
      console.error("🔍 Debug Error:", { status: err.response?.status, data: err.response?.data, endpoint: err.config?.url });
    }
    finally { if (fileInputRef.current) fileInputRef.current.value = ''; setLoading(false); }
  };

  const handlePhotosUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsUploadingImgs(true);
    const formData = new FormData();
    for (let i = 0; i < e.target.files.length; i++) {
       formData.append('images[]', e.target.files[i]);
    }
    
    try {
       const res = await api.post('/products/upload-images', formData, { headers: { 'Content-Type': 'multipart/form-data' }});
       const urls = res.data.urls || [];
       const newImgs = urls.map((u: string) => ({ id: Math.random().toString(36).substr(2, 9), url: u }));
       setImages(prev => [...prev, ...newImgs]);
       toast.success('Fotos cargadas con éxito.');
    } catch (err: any) {
       toast.error('Error subiendo las fotos físicas.');
       console.error("🔍 Debug Error:", { status: err.response?.status, data: err.response?.data, endpoint: err.config?.url });
    } finally {
       setIsUploadingImgs(false);
       if (photosInputRef.current) photosInputRef.current.value = '';
    }
  };

  const openNewDialog = () => {
    setIsEditing(false);
    setCurrentId(null);
    setFormError([]);
    setImages([]);
    setForm({ barcode: '', name: '', description: '', category_id: 'none', supplier_id: 'none', cost: '', price: '', stock: '0', min_stock: '5' });
    setIsDialogOpen(true);
    setTimeout(() => nameInputRef.current?.focus(), 100);
  };

  const openEditDialog = (p: any) => {
    setIsEditing(true);
    setCurrentId(p.id);
    setFormError([]);
    setImages((p.images || []).map((u: string) => ({ id: Math.random().toString(36).substr(2, 9), url: u })));
    setForm({
      barcode: p.barcode || '', name: p.name, description: p.description || '',
      category_id: p.category_id ? p.category_id.toString() : 'none',
      supplier_id: p.supplier_id ? p.supplier_id.toString() : 'none',
      cost: p.cost, price: p.price, stock: p.stock, min_stock: p.min_stock
    });
    setIsDialogOpen(true);
    setTimeout(() => nameInputRef.current?.focus(), 100);
  };

  const validateForm = () => {
    const errors: string[] = [];
    if (!form.name.trim()) errors.push("name");
    if (!form.price || parseFloat(form.price) < 0) errors.push("price");
    if (!form.cost || parseFloat(form.cost) < 0) errors.push("cost");
    setFormError(errors);
    return errors.length === 0;
  }

  const saveProduct = async () => {
    if (!validateForm()) return;
    try {
      const payload = {
         ...form, 
         category_id: form.category_id !== 'none' ? form.category_id : null,
         supplier_id: form.supplier_id !== 'none' ? form.supplier_id : null,
         images: images.map(img => img.url) // Ordered Array! The first is automatically is_main=true in controller logic
      };
      if (isEditing && currentId) {
        await api.put(`/products/${currentId}`, payload);
        toast.success('¡Listo! El producto se actualizó correctamente.');
      } else {
        await api.post('/products', payload);
        toast.success('¡Listo! El producto se guardó correctamente.');
      }
      setIsDialogOpen(false);
      fetchProducts();
    } catch (e: any) { 
      toast.error('Hubo un pequeño problema al guardar.'); 
      console.error("🔍 Debug Error:", { status: e.response?.status, data: e.response?.data, endpoint: e.config?.url });
    }
  };

  const generateBarcode = () => {
      const randomCode = "GEN-" + Math.random().toString(36).substring(2, 8).toUpperCase() + Math.floor(Math.random() * 100);
      setForm({...form, barcode: randomCode});
  };

  const deleteProduct = async (id: number) => {
    if (!window.confirm("¿Seguro que deseas eliminar DE FORMA PERMANENTE este producto?")) return;
    try { 
      await api.delete(`/products/${id}`); 
      toast.success('El producto ha sido eliminado del sistema.');
      fetchProducts(); 
    } 
    catch (e: any) { 
      toast.error('No tienes permisos suficientes o ocurrió un error al eliminar.'); 
      console.error("🔍 Debug Error:", { status: e.response?.status, data: e.response?.data, endpoint: e.config?.url });
    }
  };

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setImages((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const removeImage = (id: string) => { setImages(images.filter(i => i.id !== id)); };

  return (
    <div className="flex-1 p-4 md:p-8 overflow-y-auto bg-neutral-100">
      <div className="max-w-[1400px] mx-auto w-full space-y-6">
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4 md:mb-8">
          <div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-neutral-900 flex items-center gap-4">Directorio Maestro</h1>
            <p className="text-neutral-500 font-semibold mt-1.5 text-sm md:text-lg">Gestión de Catálogo e Imágenes.</p>
          </div>
          <div className="flex flex-wrap gap-2 md:gap-3 w-full md:w-auto">
             {isAdmin && (
                <div className="flex-1 md:flex-none">
                   <Button variant="outline" className="w-full md:w-auto h-14 rounded-2xl font-bold bg-white text-neutral-700 md:px-6 shadow-sm ring-1 ring-neutral-200" onClick={() => fileInputRef.current?.click()} disabled={loading}>
                      <Upload className="w-5 h-5 mr-3"/> Subir CSV
                   </Button>
                   <input type="file" ref={fileInputRef} accept=".csv" onChange={handleUploadCSV} className="hidden" />
                </div>
             )}
             <Button onClick={openNewDialog} className="flex-1 md:flex-none h-14 rounded-2xl font-black md:px-6 text-[15px] bg-neutral-900 text-white shadow-xl hover:-translate-y-1 transition duration-200">
                <Plus className="w-5 h-5 mr-2"/> Cargar Elemento
             </Button>
          </div>
        </div>

        <Card className="bg-white/80 backdrop-blur-xl rounded-[32px] p-2 md:p-6 shadow-sm border border-neutral-200/60">
          <CardContent className="p-0 overflow-x-auto custom-scrollbar">
             <Table>
               <TableHeader>
                 <TableRow className="border-neutral-100">
                   <TableHead className="font-extrabold text-neutral-400 uppercase tracking-widest pl-4 md:pl-6 text-[12px]">Foto</TableHead>
                   <TableHead className="font-extrabold text-neutral-400 uppercase tracking-widest text-[12px]">Variante / Categoría</TableHead>
                   <TableHead className="font-extrabold text-neutral-400 uppercase tracking-widest text-[12px] hidden md:table-cell">Proveedor</TableHead>
                   {isAdmin && <TableHead className="text-right font-extrabold text-neutral-400 uppercase tracking-widest text-[12px]">Costo</TableHead> }
                   <TableHead className="text-right font-extrabold text-neutral-400 uppercase tracking-widest text-[12px]">Precio</TableHead>
                   <TableHead className="text-center font-extrabold text-neutral-400 uppercase tracking-widest text-[12px]">Stock</TableHead>
                   <TableHead className="text-right"><span className="sr-only">Acciones</span></TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {products.map((p) => (
                   <TableRow key={p.id} className="border-neutral-100 hover:bg-neutral-50/50 transition-colors group">
                     <TableCell className="pl-4 md:pl-6">
                         {p.images && p.images.length > 0 ? (
                            <img src={p.images[0]} alt={p.name} className="w-16 h-16 rounded-2xl object-cover border border-neutral-200 bg-white" onError={(e) => e.currentTarget.style.display = 'none'} />
                         ) : (
                            <div className="w-16 h-16 rounded-2xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-400"><Camera className="w-6 h-6"/></div>
                         )}
                     </TableCell>
                     <TableCell>
                       <div className="font-black text-neutral-800 text-[15px]">{p.name}</div>
                       <div className="text-[12px] font-bold text-neutral-500 mt-1 flex items-center gap-1.5"><Barcode className="w-3.5 h-3.5"/> {p.barcode || 'S/N Barcode'}</div>
                     </TableCell>
                     <TableCell className="text-neutral-500 font-bold text-[13px] hidden md:table-cell">
                        {p.supplier_name || '-'}
                     </TableCell>
                     {isAdmin && (
                        <TableCell className="text-right text-neutral-400 font-extrabold text-[15px]">S/ {parseFloat(p.cost).toFixed(2)}</TableCell>
                     )}
                     <TableCell className="text-right text-green-700 font-black text-[16px]">S/ {parseFloat(p.price).toFixed(2)}</TableCell>
                     <TableCell className="text-center">
                       <span className={`inline-block px-3 py-1.5 rounded-xl text-[13px] font-black tracking-wide ${p.stock <= p.min_stock ? 'bg-red-50 text-red-600 ring-1 ring-red-200' : 'bg-green-50 text-green-700 ring-1 ring-green-100'}`}>
                         {p.stock}
                       </span>
                     </TableCell>
                     <TableCell className="text-right pr-4 md:pr-6">
                       <div className="flex justify-end gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                         <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl hover:bg-neutral-100 bg-white shadow-sm border border-neutral-100" onClick={() => openEditDialog(p)}>
                           <Edit2 className="w-5 h-5 text-blue-600" />
                         </Button>
                         {isAdmin && (
                           <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl hover:bg-red-50 bg-white shadow-sm border border-neutral-100" onClick={() => deleteProduct(p.id)}>
                               <Trash2 className="w-5 h-5 text-red-600" />
                           </Button>
                         )}
                       </div>
                     </TableCell>
                   </TableRow>
                 ))}
                 {products.length === 0 && !loading && (
                   <TableRow>
                     <TableCell colSpan={7} className="h-40 text-center text-neutral-500 font-medium">No hay productos en el inventario.</TableCell>
                   </TableRow>
                 )}
               </TableBody>
             </Table>
          </CardContent>
        </Card>
      </div>

      {/* MODAL EDICION */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[95vw] md:max-w-4xl border-0 rounded-[32px] p-0 md:p-0 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          
          <div className="bg-neutral-900 px-6 py-5 md:px-8 flex justify-between items-center text-white shrink-0">
             <DialogTitle className="text-2xl md:text-3xl font-black">
                 {isEditing ? 'Archivador / Edición de Ficha' : 'Nueva Ficha de Inventario'}
             </DialogTitle>
          </div>

          <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1">
             <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                
                {/* COLUMNA 1: INFO Y MEDIOS */}
                <div className="space-y-6">
                   <div className="bg-neutral-50/80 rounded-3xl p-6 border border-neutral-100 space-y-5">
                       <h3 className="font-extrabold text-neutral-400 text-sm tracking-widest uppercase flex items-center"><Tag className="w-4 h-4 mr-2"/> 1. Información Esencial</h3>
                       
                       <div className="space-y-2">
                         <label className="text-[13px] font-black uppercase text-neutral-700">Nombre Variante <span className="text-red-500">*</span></label>
                         <Input ref={nameInputRef} value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Detergente Liquido Ariel 5L..." 
                            className={`h-14 rounded-2xl text-[16px] font-bold bg-white ${formError.includes('name') ? 'ring-2 ring-red-500 border-transparent' : 'ring-1 ring-neutral-200 border-0'}`} />
                       </div>

                       <div className="space-y-2">
                         <label className="text-[13px] font-black uppercase text-neutral-700">Código de Barras Universal</label>
                         <div className="flex gap-2">
                            <div className="relative flex-1">
                               <Barcode className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5"/>
                               <Input value={form.barcode} onChange={e => setForm({...form, barcode: e.target.value})} placeholder="84102...." 
                                 className="h-14 rounded-2xl text-[16px] font-bold pl-12 bg-white ring-1 ring-neutral-200 border-0" />
                            </div>
                            <Button onClick={generateBarcode} type="button" variant="outline" className="h-14 rounded-2xl px-4 ring-1 ring-neutral-200 border-0 hover:bg-neutral-100 bg-white" title="Autogenerar">
                               <RefreshCw className="w-5 h-5 text-neutral-500" />
                            </Button>
                         </div>
                       </div>
                       
                       <div className="space-y-2">
                         <label className="text-[13px] font-black uppercase text-neutral-700">Imágenes (Drag & Drop)</label>
                         <div className="p-4 bg-white ring-1 ring-neutral-200 rounded-2xl form-group">
                             <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                <SortableContext items={images.map(i=>i.id)} strategy={horizontalListSortingStrategy}>
                                   <div className="flex gap-3 overflow-x-auto pb-2 min-h-[100px] touch-pan-y custom-scrollbar">
                                      {images.map((img) => (
                                         <SortableItem key={img.id} id={img.id} url={img.url} onRemove={removeImage} />
                                      ))}
                                      {images.length === 0 && (
                                         <div className="flex-1 flex items-center justify-center text-neutral-300 font-bold text-sm">Ninguna foto almacenada.</div>
                                      )}
                                   </div>
                                </SortableContext>
                             </DndContext>
                             <div className="mt-3 text-center">
                                <Button type="button" variant="secondary" className="font-bold text-xs bg-neutral-100 text-neutral-700" onClick={() => photosInputRef.current?.click()} disabled={isUploadingImgs}>
                                   {isUploadingImgs ? 'Subiendo físicos...' : '+ Adjuntar Recursos'}
                                </Button>
                                <input type="file" multiple accept="image/*" className="hidden" ref={photosInputRef} onChange={handlePhotosUpload} />
                             </div>
                             <p className="text-[10px] text-center text-neutral-400 font-bold mt-2 leading-none uppercase">La imagen 1 (izquierda) será la miniatura destacada.</p>
                         </div>
                       </div>
                   </div>

                   <div className="bg-neutral-50/80 rounded-3xl p-6 border border-neutral-100 space-y-5">
                       <h3 className="font-extrabold text-neutral-400 text-sm tracking-widest uppercase flex items-center"><Package className="w-4 h-4 mr-2"/> 3. Logística y Categorización</h3>
                       
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2 col-span-2 md:col-span-1">
                            <label className="text-[13px] font-black uppercase text-neutral-700">Categoría</label>
                            <Select value={form.category_id} onValueChange={v => setForm({...form, category_id: v || ""})}>
                              <SelectTrigger className="h-14 rounded-2xl text-[16px] font-bold bg-white ring-1 ring-neutral-200 border-0">
                                <SelectValue placeholder="Sin Categoría" />
                              </SelectTrigger>
                              <SelectContent className="rounded-2xl">
                                <SelectItem value="none" className="font-bold">Libre</SelectItem>
                                {categories.map(c => <SelectItem key={c.id} value={c.id.toString()} className="font-bold">{c.name}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2 col-span-2 md:col-span-1">
                            <label className="text-[13px] font-black uppercase text-blue-600">Proveedor</label>
                            <Select value={form.supplier_id} onValueChange={v => setForm({...form, supplier_id: v || ""})}>
                              <SelectTrigger className="h-14 rounded-2xl text-[16px] font-bold bg-blue-50/50 ring-1 ring-blue-200 border-0 text-blue-900">
                                <SelectValue placeholder="Proveedor Nulo" />
                              </SelectTrigger>
                              <SelectContent className="rounded-2xl">
                                <SelectItem value="none" className="font-bold">Sin Suministrador</SelectItem>
                                {suppliers.map(s => <SelectItem key={s.id} value={s.id.toString()} className="font-bold">{s.name}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                       </div>
                   </div>
                </div>

                {/* COLUMNA 2: PRECIOS Y STOCK */}
                <div className="space-y-6">
                   <div className="bg-green-50/50 rounded-3xl p-6 border border-green-100 space-y-5">
                       <h3 className="font-extrabold text-green-700 text-sm tracking-widest uppercase flex items-center"><DollarSign className="w-4 h-4 mr-2"/> 2. Facturación y Precios</h3>
                       
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2 col-span-2 md:col-span-1">
                            <label className="text-[13px] font-black uppercase text-neutral-500">Costo Base / Compra <span className="text-red-500">*</span></label>
                            <div className="relative">
                               <div className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-neutral-400">S/</div>
                               <Input type="number" step="0.01" value={form.cost} onChange={e => setForm({...form, cost: e.target.value})} 
                                 className={`h-16 rounded-2xl text-[20px] font-black pl-10 bg-white ${formError.includes('cost') ? 'ring-2 ring-red-500 border-transparent' : 'ring-1 ring-neutral-200 border-0'} text-neutral-700`} disabled={!isAdmin} />
                            </div>
                          </div>

                          <div className="space-y-2 col-span-2 md:col-span-1">
                            <label className="text-[13px] font-black uppercase text-green-700">Precio Público (Venta) <span className="text-red-500">*</span></label>
                            <div className="relative">
                               <div className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-green-600">S/</div>
                               <Input type="number" step="0.01" value={form.price} onChange={e => setForm({...form, price: e.target.value})} 
                                 className={`h-16 rounded-2xl text-[22px] font-black pl-10 bg-green-50 text-green-800 ${formError.includes('price') ? 'ring-2 ring-red-500 border-transparent' : 'ring-1 ring-green-300 border-0'}`} />
                            </div>
                          </div>
                       </div>
                   </div>

                   <div className="bg-orange-50/50 rounded-3xl p-6 border border-orange-100 space-y-5">
                       <h3 className="font-extrabold text-orange-700 text-sm tracking-widest uppercase flex items-center"><Box className="w-4 h-4 mr-2"/> 4. Control de Inventarios</h3>
                       
                       <p className="text-xs text-orange-600/80 font-bold leading-relaxed -mt-2">Todo cambio en el Inventario maestro inserta logueros contables directamente al Kardex como medida anti-robo.</p>

                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2 col-span-1">
                            <label className="text-[13px] font-black uppercase text-neutral-700">Cajones / Stock Actual</label>
                            <Input type="number" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} className="h-16 rounded-2xl text-[20px] font-black text-center bg-white ring-1 ring-neutral-200 border-0" />
                          </div>

                          <div className="space-y-2 col-span-1">
                            <label className="text-[13px] font-black uppercase text-red-600 flex items-center gap-1"><AlertTriangle className="w-4 h-4"/> Alarma Mínima</label>
                            <Input type="number" value={form.min_stock} onChange={e => setForm({...form, min_stock: e.target.value})} className="h-16 rounded-2xl text-[20px] font-black text-center bg-red-50 text-red-700 ring-1 ring-red-200 border-0" />
                          </div>
                       </div>
                   </div>

                </div>

             </div>
          </div>

          <div className="p-6 md:p-8 bg-neutral-50/80 border-t border-neutral-100 shrink-0 flex flex-col md:flex-row gap-3 md:justify-end">
            <Button variant="outline" className="h-14 rounded-2xl font-bold text-[15px] px-8 text-neutral-600 bg-white ring-1 ring-neutral-200 border-0 w-full md:w-auto" onClick={() => setIsDialogOpen(false)}>Cancelar Ficha</Button>
            <Button className="h-14 rounded-2xl font-black text-[15px] px-10 bg-neutral-900 text-white shadow-xl hover:-translate-y-1 transition duration-200 w-full md:w-auto" onClick={saveProduct} disabled={loading}>
               {isEditing ? 'Guardar Cambios y Trazar en Kardex' : 'Emitir Creación y Sellar'}
            </Button>
          </div>

        </DialogContent>
      </Dialog>
    </div>
  );
}
