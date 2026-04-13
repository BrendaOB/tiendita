import React, { useState, useRef, useEffect } from 'react';
import api from '@/lib/api';
import { Download, Plus, Trash2, FileSpreadsheet, Box, Loader2, HardDriveUpload, CheckCircle2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function BulkUpload() {
  const [draftProducts, setDraftProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);

  // States para Drag & Drop y Validacion falsa
  const [isDragging, setIsDragging] = useState(false);
  const [isValidatingFile, setIsValidatingFile] = useState(false);

  useEffect(() => {
    api.get('/categories').then(res => setCategories(res.data.data || [])).catch(() => {});
    api.get('/suppliers').then(res => setSuppliers(res.data.data || [])).catch(() => {});
  }, []);

  const [manualForm, setManualForm] = useState({ 
    barcode: '', name: '', description: '', category_id: '', 
    price: '', cost: '', stock: '', min_stock: '', supplier_id: '' 
  });

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.name || !manualForm.price || !manualForm.cost) {
      toast.warning("Nombre, precio y costo son requeridos.");
      return;
    }
    const newItem = {
      id: Date.now(),
      barcode: manualForm.barcode || '',
      name: manualForm.name,
      description: manualForm.description || '',
      category_id: manualForm.category_id === 'none' ? '' : manualForm.category_id,
      price: manualForm.price,
      cost: manualForm.cost,
      stock: manualForm.stock || 0,
      min_stock: manualForm.min_stock || 0,
      supplier_id: manualForm.supplier_id === 'none' ? '' : manualForm.supplier_id
    };
    setDraftProducts(prev => [newItem, ...prev]);
    setManualForm({ barcode: '', name: '', description: '', category_id: '', price: '', cost: '', stock: '', min_stock: '', supplier_id: '' });
  };

  const updateCell = (id: number, field: string, value: string) => {
    setDraftProducts(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const removeDraft = (id: number) => {
    setDraftProducts(prev => prev.filter(p => p.id !== id));
  };

  const clearList = () => {
    if (draftProducts.length > 0 && window.confirm("¿Seguro que quieres vaciar todo el borrador temporal?")) {
      setDraftProducts([]);
      toast.info("Reseteo completado. Borrador limpio.");
    }
  };

  // ----------------------------------------------------
  // PARSER CSV & DROPZONE LOGIC
  // ----------------------------------------------------
  const processCSVFile = (file: File) => {
    setIsValidatingFile(true);
    // Simular retardo artificial para UX
    setTimeout(() => {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target?.result as string;
        if (!text) {
           setIsValidatingFile(false);
           return;
        }
        
        const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
        if (lines.length < 2) {
           toast.error("El CSV está vacío o le faltan líneas de datos.");
           setIsValidatingFile(false);
           return;
        }
        
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
        const newItems: any[] = [];
        
        for (let i = 1; i < lines.length; i++) {
           let line = lines[i];
           const regex = /(?:^|,)(?:"([^"]*)"|([^,]*))/g;
           let cols: string[] = [];
           let match;
           while (match = regex.exec(line)) {
              cols.push(match[1] !== undefined ? match[1] : match[2] || "");
           }
           
           const item: any = { id: Date.now() + i };
           headers.forEach((h, idx) => {
               item[h] = cols[idx] !== undefined ? cols[idx].trim() : "";
           });
           newItems.push(item);
        }
        
        setDraftProducts(prev => [...prev, ...newItems]);
        toast.success(`${newItems.length} registros cargados al borrador.`);
        setIsValidatingFile(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      };
      reader.readAsText(file, "UTF-8");
    }, 800); // 800ms Fake Validation Delay
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) processCSVFile(e.target.files[0]);
  };

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => { setIsDragging(false); };
  const onDrop = (e: React.DragEvent) => {
     e.preventDefault();
     setIsDragging(false);
     if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
       processCSVFile(e.dataTransfer.files[0]);
     }
  };

  // ----------------------------------------------------
  // EXPORT / TEMPLATE
  // ----------------------------------------------------
  const headersTemplate = ["barcode", "name", "description", "category_id", "price", "cost", "stock", "min_stock", "supplier_id"];
  
  const downloadBlob = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadTemplate = () => {
    const content = headersTemplate.join(",") + "\n";
    downloadBlob(content, "plantilla_masiva.csv");
  };

  const exportDraft = () => {
    if (draftProducts.length === 0) return toast.warning("Nada que exportar.");
    const escapeCsv = (str: any) => `"${String(str || '').replace(/"/g, '""')}"`;
    let content = headersTemplate.join(",") + "\n";
    draftProducts.forEach(p => {
       const row = headersTemplate.map(h => escapeCsv(p[h]));
       content += row.join(",") + "\n";
    });
    downloadBlob(content, "borrador_exportado.csv");
  };

  // ----------------------------------------------------
  // ENVÍO A BD (POST como FILE)
  // ----------------------------------------------------
  const confirmUpload = async () => {
    if (draftProducts.length === 0) {
       toast.warning("El borrador está vacío."); return;
    }
    
    if (!window.confirm(`Vas a importar ${draftProducts.length} productos hacia la base de datos (Transacción Estricta). ¿Confirmas?`)) {
       return;
    }
    
    setLoading(true);
    try {
       const escapeCsv = (str: any) => `"${String(str || '').replace(/"/g, '""')}"`;
       let content = headersTemplate.join(",") + "\n";
       draftProducts.forEach(p => {
          const row = headersTemplate.map(h => escapeCsv(p[h]));
          content += row.join(",") + "\n";
       });
       
       const blob = new Blob([content], { type: 'text/csv' });
       const file = new File([blob], "borrador_upload.csv", { type: "text/csv" });
       
       const formData = new FormData();
       formData.append('file', file);
       
       const res = await api.post('/products/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
       toast.success(`¡Migración completada! ${res.data.inserted_rows} registros salvados en DB.`);
       setDraftProducts([]);
    } catch (e: any) {
       console.error("🔍 Debug Error:", { status: e.response?.status, data: e.response?.data, endpoint: e.config?.url });
       toast.error(e.response?.data?.message || "Ocurrió un error transaccional de servidor. Revisa el borrador.");
    } finally {
       setLoading(false);
    }
  };

  // Lógica de alerta visual
  const isLossWarning = !!manualForm.price && !!manualForm.cost && parseFloat(manualForm.price) <= parseFloat(manualForm.cost);

  return (
    <div className="flex-1 p-4 md:p-8 overflow-y-auto bg-neutral-50/50">
      <div className="max-w-[1400px] mx-auto w-full space-y-8">
        
        {/* Cabecera Título Principal */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-neutral-900 flex items-center gap-3">
              Carga Inteligente <Box className="w-8 h-8 md:w-10 md:h-10 text-indigo-600" />
            </h1>
            <p className="text-neutral-500 font-semibold mt-2 md:text-lg">Herramienta profesional de migración e importación masiva de datos.</p>
          </div>
          <Button variant="ghost" onClick={downloadTemplate} className="text-indigo-700 bg-indigo-50 hover:bg-indigo-100 font-extrabold h-12 rounded-xl">
             <Download className="w-5 h-5 mr-2"/> Descargar Plantilla Mapeada
          </Button>
        </div>

        <div className="flex flex-col xl:flex-row gap-8">
            
            {/* LADO IZQUIERDO: Pasos 1 y 3 (Columnas estrechas) */}
            <div className="xl:w-[350px] space-y-6 shrink-0 flex flex-col">
                
                {/* ------------------- PASO 1: PREPARAR DATOS ------------------- */}
                <div className="bg-white border text-center md:text-left border-neutral-200 shadow-sm rounded-[32px] p-6 relative overflow-hidden flex-1 flex flex-col">
                    <div className="absolute top-4 left-6 py-1 px-3 bg-neutral-900 text-white rounded-full font-black text-sm shadow-md">1</div>
                    <h2 className="pl-12 font-extrabold text-xl text-neutral-800 mb-6 tracking-tight">Preparación Individual</h2>
                    
                    <form onSubmit={handleManualAdd} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2">
                                <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest pl-1 mb-1 block">Nombre Producto</label>
                                <Input placeholder="Ej: Jabón Dove" value={manualForm.name} onChange={e => setManualForm({...manualForm, name: e.target.value})} className="h-11 rounded-xl bg-neutral-50 border-neutral-200 font-bold" />
                            </div>
                            <div className="col-span-2">
                                <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest pl-1 mb-1 block">Código Barra / SKU</label>
                                <Input placeholder="Opcional (Auto)" value={manualForm.barcode} onChange={e => setManualForm({...manualForm, barcode: e.target.value})} className="h-11 rounded-xl bg-neutral-50 border-neutral-200 font-bold" />
                            </div>
                            <div className="col-span-1">
                                <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest pl-1 mb-1 block">Costo S/</label>
                                <Input type="number" step="0.01" placeholder="0.00" value={manualForm.cost} onChange={e => setManualForm({...manualForm, cost: e.target.value})} 
                                   className={`h-11 rounded-xl font-mono font-bold transition-colors ${isLossWarning ? 'bg-yellow-50 border-yellow-400 focus-visible:ring-yellow-400' : 'bg-neutral-50 border-neutral-200'}`} />
                            </div>
                            <div className="col-span-1">
                                <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest pl-1 mb-1 block">Precio S/</label>
                                <Input type="number" step="0.01" placeholder="0.00" value={manualForm.price} onChange={e => setManualForm({...manualForm, price: e.target.value})} 
                                    className={`h-11 rounded-xl font-mono font-black transition-colors ${isLossWarning ? 'bg-yellow-50 border-yellow-400 text-yellow-700 focus-visible:ring-yellow-400' : 'bg-neutral-50 border-neutral-200 text-indigo-700'}`} />
                            </div>
                            {isLossWarning && (
                               <div className="col-span-2 text-yellow-600 text-[11px] font-black leading-tight bg-yellow-50 p-2 rounded-xl border border-yellow-200 mt-1">
                                  ⚠️ Advertencia: El precio de venta no genera utilidad sobre el costo introducido.
                               </div>
                            )}

                            <div className="col-span-1">
                                <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest pl-1 mb-1 block">T. Stock</label>
                                <Input type="number" step="1" placeholder="0" value={manualForm.stock} onChange={e => setManualForm({...manualForm, stock: e.target.value})} className="h-11 rounded-xl bg-neutral-50 border-neutral-200 font-bold text-center" />
                            </div>
                            <div className="col-span-1">
                                <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest pl-1 mb-1 block">Min.</label>
                                <Input type="number" step="1" placeholder="0" value={manualForm.min_stock} onChange={e => setManualForm({...manualForm, min_stock: e.target.value})} className="h-11 rounded-xl bg-neutral-50 border-neutral-200 font-bold text-center" />
                            </div>

                            <div className="col-span-2 space-y-3 mt-1">
                                <Select value={manualForm.category_id} onValueChange={v => setManualForm({...manualForm, category_id: v || ""})}>
                                    <SelectTrigger className="h-10 rounded-full bg-indigo-50/50 border-indigo-100 text-indigo-800 font-bold hover:bg-indigo-100/50"><SelectValue placeholder="Seleccionar Categoría..."/></SelectTrigger>
                                    <SelectContent>
                                         <SelectItem value="none">Sin Categoría</SelectItem>
                                         {categories.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>

                                <Select value={manualForm.supplier_id} onValueChange={v => setManualForm({...manualForm, supplier_id: v || ""})}>
                                    <SelectTrigger className="h-10 rounded-full bg-green-50/50 border-green-100 text-green-800 font-bold hover:bg-green-100/50"><SelectValue placeholder="Seleccionar Proveedor..."/></SelectTrigger>
                                    <SelectContent>
                                         <SelectItem value="none">Sin Proveedor</SelectItem>
                                         {suppliers.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button type="submit" className="col-span-2 h-12 w-full bg-neutral-900 border-2 border-neutral-900 hover:bg-transparent hover:text-neutral-900 shadow-xl shadow-neutral-900/10 text-white rounded-xl mt-2 font-extrabold flex gap-2 active:scale-95 transition-all">
                                <Plus className="w-5 h-5"/> Enviar al Borrador
                            </Button>
                        </div>
                    </form>
                </div>

                {/* ------------------- PASO 3: ACCIÓN & DROPZONE ------------------- */}
                <div className="bg-white border border-neutral-200 shadow-sm rounded-[32px] p-6 relative overflow-hidden flex flex-col shrink-0">
                    <div className="absolute top-4 left-6 py-1 px-3 bg-neutral-900 text-white rounded-full font-black text-sm shadow-md">3</div>
                    <h2 className="pl-12 font-extrabold text-xl text-neutral-800 mb-6 tracking-tight">Carga de Datos CSV</h2>
                    
                    <div 
                       onDragOver={onDragOver} 
                       onDragLeave={onDragLeave} 
                       onDrop={onDrop}
                       onClick={() => fileInputRef.current?.click()}
                       className={`border-2 border-dashed ${isDragging ? 'border-blue-500 bg-blue-50/50' : 'border-neutral-300 bg-neutral-50/30'} ${isValidatingFile ? 'opacity-70 pointer-events-none' : 'cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30'} transition-all rounded-3xl h-[160px] flex flex-col items-center justify-center p-6 text-center select-none`}
                    >
                        {isValidatingFile ? (
                           <div className="flex flex-col items-center gap-2 text-indigo-600">
                              <Loader2 className="w-10 h-10 animate-spin" />
                              <p className="font-extrabold text-sm tracking-wide mt-2">Validando Estructuras...</p>
                           </div>
                        ) : (
                           <div className="flex flex-col items-center gap-2">
                              <HardDriveUpload className={`w-10 h-10 ${isDragging ? 'text-blue-600 scale-110' : 'text-neutral-400'} transition-transform duration-300`} />
                              <p className="font-bold text-[14px] text-neutral-700 mt-1">Haz clic o arrastra tu .csv aquí.</p>
                              <p className="font-bold text-[11px] text-neutral-400 capitalize">Reconoce listados exportados.</p>
                           </div>
                        )}
                        <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                    </div>
                </div>

            </div>

            {/* LADO DERECHO: Paso 2 (Tabla Masiva) */}
            <div className="bg-white border border-neutral-200 shadow-sm rounded-[32px] overflow-hidden flex-1 flex flex-col min-w-0 max-h-[850px] relative">
               
               {/* ------------------- PASO 2: REVISAR LISTA ------------------- */}
               <div className="px-6 py-5 border-b border-neutral-100 flex flex-col md:flex-row justify-between items-start md:items-center bg-white z-20 shrink-0 gap-4">
                 <div className="flex items-center">
                    <div className="mr-4 py-1 px-3 bg-neutral-900 text-white rounded-full font-black text-sm shadow-md">2</div>
                    <div>
                        <h2 className="font-extrabold text-xl text-neutral-800 tracking-tight">Revisión de Borrador</h2>
                        <p className="text-[13px] font-black text-neutral-400">Filas Listas: {draftProducts.length}</p>
                    </div>
                 </div>
                 
                 {draftProducts.length > 0 && (
                    <div className="flex flex-wrap md:flex-nowrap gap-2 w-full md:w-auto">
                      <Button variant="ghost" onClick={clearList} className="text-red-500 hover:text-red-700 hover:bg-red-50 font-bold shrink-0">
                         <Trash2 className="w-4 h-4 mr-1.5"/> Vaciar
                      </Button>
                      <Button variant="ghost" onClick={exportDraft} className="text-neutral-700 border border-neutral-200 font-bold shrink-0">
                         <Download className="w-4 h-4 mr-2"/> Exportar
                      </Button>
                      <Button onClick={confirmUpload} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl shadow-xl shadow-indigo-600/30 flex-1 md:flex-none">
                         {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2"/> : <CheckCircle2 className="w-5 h-5 mr-2"/>} Validar y Procesar a DB
                      </Button>
                    </div>
                 )}
               </div>

               <div className="p-0 overflow-auto custom-scrollbar flex-1 relative bg-white min-h-[300px]">
                 <Table className="min-w-[1200px]">
                    <TableHeader className="sticky top-0 z-30 bg-neutral-50 shadow-[0_4px_24px_-10px_rgba(0,0,0,0.1)]">
                       <TableRow className="border-neutral-200">
                         <TableHead className="font-black text-neutral-500 uppercase tracking-widest pl-6 text-[10px] w-[130px]">Código SKU</TableHead>
                         <TableHead className="font-black text-neutral-500 uppercase tracking-widest text-[10px] min-w-[200px]">Producto</TableHead>
                         <TableHead className="font-black text-neutral-500 uppercase tracking-widest text-[10px] w-[150px]">Categoría Badge</TableHead>
                         <TableHead className="font-black text-neutral-500 uppercase tracking-widest text-[10px] w-[100px]">Costo</TableHead>
                         <TableHead className="font-black text-neutral-500 uppercase tracking-widest text-[10px] w-[100px]">P. Venta</TableHead>
                         <TableHead className="font-black text-neutral-500 uppercase tracking-widest text-[10px] w-[90px]">Stk / Min</TableHead>
                         <TableHead className="font-black text-neutral-500 uppercase tracking-widest text-[10px] w-[150px]">Prov. Badge</TableHead>
                         <TableHead className="text-center font-black text-neutral-500 uppercase tracking-widest pr-6 text-[10px] w-[70px]">Borrar</TableHead>
                       </TableRow>
                    </TableHeader>
                    <TableBody>
                       {draftProducts.map((prod) => {
                          const badPrice = !!prod.price && !!prod.cost && parseFloat(prod.price) <= parseFloat(prod.cost);
                          return (
                          <TableRow key={prod.id} className={`border-neutral-100 hover:bg-indigo-50/20 transition-colors h-16 ${badPrice ? 'bg-yellow-50/10' : ''}`}>
                             <TableCell className="pl-6 py-2">
                               <Input value={prod.barcode} onChange={e => updateCell(prod.id, 'barcode', e.target.value)} className="h-9 font-bold bg-white focus:bg-white focus:ring-1 border-neutral-200 shadow-sm" placeholder="Autogenerado..." />
                             </TableCell>
                             <TableCell className="py-2">
                               <Input value={prod.name} onChange={e => updateCell(prod.id, 'name', e.target.value)} className="h-9 font-extrabold bg-white text-neutral-900 border-neutral-200 shadow-sm focus:ring-1" />
                             </TableCell>
                             <TableCell className="py-2">
                                <Select value={(prod.category_id && prod.category_id !== "none") ? prod.category_id.toString() : ""} onValueChange={v => updateCell(prod.id, 'category_id', v || "")}>
                                    <SelectTrigger className="h-9 rounded-full bg-indigo-50/80 border-indigo-100/50 hover:bg-indigo-100 text-indigo-700 font-bold focus:ring-1"><SelectValue placeholder="Cat..."/></SelectTrigger>
                                    <SelectContent>
                                         <SelectItem value="none">n/a</SelectItem>
                                         {categories.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                             </TableCell>
                             <TableCell className="py-2">
                               <Input type="number" step="0.01" value={prod.cost} onChange={e => updateCell(prod.id, 'cost', e.target.value)} className={`h-9 font-mono font-bold border-neutral-200 shadow-sm focus:ring-1 ${badPrice ? 'bg-yellow-100 border-yellow-300' : 'bg-white'}`} />
                             </TableCell>
                             <TableCell className="py-2">
                               <Input type="number" step="0.01" value={prod.price} onChange={e => updateCell(prod.id, 'price', e.target.value)} className={`h-9 font-mono font-black border-neutral-200 shadow-sm focus:ring-1 ${badPrice ? 'bg-yellow-100 border-yellow-400 text-yellow-800' : 'bg-white text-green-700'}`} />
                             </TableCell>
                             <TableCell className="py-2">
                               <div className="flex gap-1 items-center">
                                   <Input type="number" step="1" value={prod.stock} onChange={e => updateCell(prod.id, 'stock', e.target.value)} className="h-9 w-14 p-0 text-center font-mono font-black bg-white border-neutral-200 shadow-sm" />
                                   <span className="text-neutral-300 font-light text-[10px]">/</span>
                                   <Input type="number" step="1" value={prod.min_stock} onChange={e => updateCell(prod.id, 'min_stock', e.target.value)} className="h-8 w-10 p-0 text-center text-[10px] font-mono font-bold bg-neutral-50 border-transparent text-neutral-400 shadow-inner" />
                               </div>
                             </TableCell>
                             <TableCell className="py-2">
                                <Select value={(prod.supplier_id && prod.supplier_id !== "none") ? prod.supplier_id.toString() : ""} onValueChange={v => updateCell(prod.id, 'supplier_id', v || "")}>
                                    <SelectTrigger className="h-9 rounded-full bg-green-50/80 border-green-100/50 hover:bg-green-100 text-green-700 font-bold focus:ring-1"><SelectValue placeholder="Prov..."/></SelectTrigger>
                                    <SelectContent>
                                         <SelectItem value="none">n/a</SelectItem>
                                         {suppliers.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                             </TableCell>
                             <TableCell className="pr-6 text-center py-2">
                               <Button variant="ghost" size="icon" onClick={() => removeDraft(prod.id)} className="h-8 w-8 text-neutral-400 hover:text-white hover:bg-red-500 rounded-lg shadow-sm transition-colors group">
                                  <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform"/>
                               </Button>
                             </TableCell>
                          </TableRow>
                       )})}
                       
                       {draftProducts.length === 0 && (
                          <TableRow>
                             <TableCell colSpan={8} className="h-[400px] text-center">
                                <AnimatePresence>
                                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center text-neutral-300 gap-4">
                                     <FileSpreadsheet className="w-20 h-20 stroke-1 stroke-neutral-200" />
                                     <h3 className="text-lg font-black text-neutral-400">Borrador Vacío</h3>
                                     <p className="text-[13px] font-bold max-w-sm">No has agregado ni cargado ningún producto a la grilla perimetral.</p>
                                  </motion.div>
                                </AnimatePresence>
                             </TableCell>
                          </TableRow>
                       )}
                    </TableBody>
                 </Table>
               </div>
            </div>

        </div>
      </div>
    </div>
  );
}
