import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Search, Plus, Minus, Trash2, Camera, Receipt, Banknote, QrCode, CreditCard, Variable, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { toast } from 'sonner';

export default function POS() {
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  
  // Mixed Payments State
  const [payments, setPayments] = useState<{id: number, method: string, amount: number, reference: string}[]>([]);
  const [currentPayment, setCurrentPayment] = useState({ method: 'efectivo', amount: '', reference: '' });

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      setProducts(res.data.data || []);
    } catch (e: any) { console.error("🔍 Debug Error:", { status: e.response?.status, data: e.response?.data, endpoint: e.config?.url }); }
  };

  const addToCart = (product: any) => {
    if (product.stock <= 0) {
      toast.warning('Imposible agregar: Producto Agotado Físicamente');
      return;
    }
    setCart((prev) => {
      const exists = prev.find((item) => item.product_id === product.id);
      if (exists) {
        if (exists.quantity + 1 > product.stock) return prev; 
        return prev.map((item) => item.product_id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product_id: product.id, name: product.name, unit_price: product.price, quantity: 1, stockOriginal: product.stock }];
    });
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart((prev) => prev.map((item) => {
        if (item.product_id === id) {
          const newQty = item.quantity + delta;
          if (newQty > item.stockOriginal) return item; 
          return newQty > 0 ? { ...item, quantity: newQty } : item;
        }
        return item;
    }));
  };

  const removeFromCart = (id: number) => {
    setCart((prev) => prev.filter((item) => item.product_id !== id));
  };

  // Payment Calculation logic
  const cartTotal = cart.reduce((acc, i) => acc + i.unit_price * i.quantity, 0);
  const cartItemsCount = cart.reduce((a,c)=>a+c.quantity, 0);
  const paymentsTotal = payments.reduce((acc, p) => acc + p.amount, 0);
  
  const balance = cartTotal - paymentsTotal;
  const isPaid = paymentsTotal >= cartTotal && cartTotal > 0;

  // Set the default current payment amount to the remaining balance
  useEffect(() => {
     if (balance > 0 && currentPayment.amount === '') {
         setCurrentPayment(prev => ({...prev, amount: balance.toFixed(2)}));
     }
  }, [balance, currentPayment.amount, cartTotal]);

  const addPaymentLine = () => {
     const amt = parseFloat(currentPayment.amount);
     if (isNaN(amt) || amt <= 0) {
        toast.warning('El monto a abonar debe ser mayor a 0');
        return;
     }
     setPayments([...payments, { id: Date.now(), method: currentPayment.method, amount: amt, reference: currentPayment.reference }]);
     setCurrentPayment({ method: 'efectivo', amount: '', reference: '' });
  };

  const removePaymentLine = (id: number) => {
     setPayments(payments.filter(p => p.id !== id));
  };

  const checkout = async () => {
    if (cart.length === 0 || !isPaid) return;
    
    // We adjust the last payment to only match the total if there is change returned (efectivo usually).
    // Or we simply pass them to the backend as is, for simplicity we send exactly what is mapped.
    try {
      await api.post('/sales', { total: cartTotal, payments: payments, details: cart });
      toast.success(`Venta completada. Total S/ ${cartTotal.toFixed(2)}.`);
      setCart([]);
      setPayments([]);
      setCurrentPayment({ method: 'efectivo', amount: '', reference: '' });
      fetchProducts();
    } catch (e: any) {
      console.error("🔍 Debug Error:", { status: e.response?.status, data: e.response?.data, endpoint: e.config?.url });
      toast.error('Hubo un percance interno procesando el pago mixto.');
    }
  };

  const filteredProducts = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || (p.barcode && p.barcode.includes(search)));

  const CartContent = () => (
    <div className="flex flex-col h-full bg-white md:bg-transparent">
        <div className="flex-1 overflow-auto p-4 space-y-3 pb-8 custom-scrollbar">
          {/* PRODUCTOS DEL CARRITO */}
          {cart.map(item => (
            <div key={item.product_id} className="flex flex-col gap-3 p-4 bg-white rounded-2xl shadow-sm border border-neutral-100 group relative">
              <div className="flex justify-between items-start pr-6">
                <span className="font-bold text-[15px] leading-tight flex-1 text-neutral-800">{item.name}</span>
                <span className="font-black text-lg ml-3 text-neutral-900">S/ {(item.unit_price * item.quantity).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <div className="flex items-center bg-neutral-100 rounded-xl p-1 gap-1">
                  <Button variant="ghost" size="icon" className="h-10 w-10 md:h-8 md:w-8 rounded-lg bg-white shadow-sm" onClick={() => updateQuantity(item.product_id, -1)}>
                    <Minus className="w-5 h-5 md:w-4 md:h-4 text-neutral-700" />
                  </Button>
                  <span className="text-[15px] font-black w-8 text-center select-none text-neutral-800">{item.quantity}</span>
                  <Button variant="ghost" size="icon" className="h-10 w-10 md:h-8 md:w-8 rounded-lg bg-white shadow-sm" onClick={() => updateQuantity(item.product_id, 1)}>
                    <Plus className="w-5 h-5 md:w-4 md:h-4 text-neutral-700" />
                  </Button>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="absolute top-2 right-2 w-10 h-10 md:w-8 md:h-8 text-neutral-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors" onClick={() => removeFromCart(item.product_id)}>
                  <Trash2 className="w-5 h-5 md:w-4 md:h-4" />
              </Button>
            </div>
          ))}
          {cart.length === 0 && (
             <div className="flex flex-col items-center justify-center text-neutral-300 gap-4 mt-6">
                <Receipt className="w-16 h-16 stroke-1"/>
                <p className="text-[14px] font-bold">Carrito vacío.</p>
             </div>
          )}

          {/* LÍNEAS DE PAGO MIXTOS */}
          {cart.length > 0 && (
             <div className="mt-8 pt-4 border-t border-neutral-200">
                <h4 className="text-[12px] font-black uppercase text-neutral-400 tracking-widest mb-3">Líneas de Pago</h4>
                
                {payments.map(p => (
                   <div key={p.id} className="flex justify-between items-center bg-neutral-50 px-3 py-2 rounded-xl mb-2">
                      <div className="flex flex-col">
                         <span className="font-bold text-[13px] uppercase text-neutral-800">{p.method}</span>
                         {p.reference && <span className="text-[11px] text-neutral-500 font-semibold">Ref: {p.reference}</span>}
                      </div>
                      <div className="flex items-center gap-3">
                         <span className="font-black text-[15px] text-neutral-800">S/ {p.amount.toFixed(2)}</span>
                         <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:bg-red-100" onClick={() => removePaymentLine(p.id)}><Trash2 className="w-3.5 h-3.5"/></Button>
                      </div>
                   </div>
                ))}

                {!isPaid && (
                   <div className="bg-blue-50/50 border border-blue-100 p-3 rounded-2xl space-y-3 mt-3">
                      <div className="grid grid-cols-5 gap-1">
                         <button onClick={()=>setCurrentPayment({...currentPayment, method: 'efectivo'})} className={`flex flex-col items-center justify-center p-1.5 rounded-lg transition border-2 ${currentPayment.method==='efectivo'?'border-green-500 bg-green-50 text-green-700':'border-transparent bg-white shadow-sm filter grayscale text-neutral-500'}`}>
                            <Banknote className="w-4 h-4 mb-1"/>
                            <span className="text-[9px] font-black tracking-widest uppercase truncate max-w-full">Cash</span>
                         </button>
                         <button onClick={()=>setCurrentPayment({...currentPayment, method: 'yape'})} className={`flex flex-col items-center justify-center p-1.5 rounded-lg transition border-2 ${currentPayment.method==='yape'?'border-purple-500 bg-purple-50 text-purple-700':'border-transparent bg-white shadow-sm filter grayscale text-neutral-500'}`}>
                            <QrCode className="w-4 h-4 mb-1"/>
                            <span className="text-[9px] font-black tracking-widest uppercase truncate max-w-full">Yape</span>
                         </button>
                         <button onClick={()=>setCurrentPayment({...currentPayment, method: 'plin'})} className={`flex flex-col items-center justify-center p-1.5 rounded-lg transition border-2 ${currentPayment.method==='plin'?'border-blue-400 bg-blue-50 text-blue-600':'border-transparent bg-white shadow-sm filter grayscale text-neutral-500'}`}>
                            <QrCode className="w-4 h-4 mb-1"/>
                            <span className="text-[9px] font-black tracking-widest uppercase truncate max-w-full">Plin</span>
                         </button>
                         <button onClick={()=>setCurrentPayment({...currentPayment, method: 'tarjeta'})} className={`flex flex-col items-center justify-center p-1.5 rounded-lg transition border-2 ${currentPayment.method==='tarjeta'?'border-indigo-500 bg-indigo-50 text-indigo-700':'border-transparent bg-white shadow-sm filter grayscale text-neutral-500'}`}>
                            <CreditCard className="w-4 h-4 mb-1"/>
                            <span className="text-[9px] font-black tracking-widest uppercase truncate max-w-full">POS</span>
                         </button>
                         <button onClick={()=>setCurrentPayment({...currentPayment, method: 'otros'})} className={`flex flex-col items-center justify-center p-1.5 rounded-lg transition border-2 ${currentPayment.method==='otros'?'border-neutral-800 bg-neutral-200 text-neutral-900':'border-transparent bg-white shadow-sm filter grayscale text-neutral-500'}`}>
                            <Variable className="w-4 h-4 mb-1"/>
                            <span className="text-[9px] font-black tracking-widest uppercase truncate max-w-full">Otro</span>
                         </button>
                      </div>
                      
                      <div className="flex gap-2 relative">
                         <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-neutral-500 text-sm">S/</span>
                            <Input type="number" step="0.01" value={currentPayment.amount} onChange={e => setCurrentPayment({...currentPayment, amount: e.target.value})} className="pl-8 bg-white border-blue-200 font-bold" placeholder="Monto" />
                         </div>
                         {(currentPayment.method === 'yape' || currentPayment.method === 'plin' || currentPayment.method === 'tarjeta') && (
                            <Input type="text" value={currentPayment.reference} onChange={e => setCurrentPayment({...currentPayment, reference: e.target.value})} className="flex-1 bg-white border-blue-200 text-xs font-bold" placeholder="N° Ref (Opcional)" />
                         )}
                         <Button onClick={addPaymentLine} className="bg-blue-600 hover:bg-blue-700 text-white font-black px-4"><PlusCircle className="w-4 h-4"/></Button>
                      </div>
                   </div>
                )}
             </div>
          )}
        </div>
        
        <div className="p-5 md:p-6 pb-bottom-safe border-t border-neutral-200 bg-white/90 backdrop-blur-xl shrink-0 z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
          <div className="space-y-1 mb-6">
            <div className="flex justify-between items-center text-sm">
              <span className="text-neutral-500 font-bold uppercase tracking-wider text-[12px]">Pzas x{cartItemsCount}</span>
              <span className="font-extrabold text-neutral-700">Total S/ {cartTotal.toFixed(2)}</span>
            </div>
            {paymentsTotal > 0 && (
               <div className="flex justify-between items-center text-sm mt-1">
                 <span className="text-green-600 font-bold uppercase tracking-wider text-[12px]">Abonado</span>
                 <span className="font-extrabold text-green-700">S/ {paymentsTotal.toFixed(2)}</span>
               </div>
            )}
            
            <div className="pt-2 mt-2 border-t border-neutral-100 flex justify-between items-end">
              <span className={`font-black text-xl ${balance > 0 ? 'text-red-500' : 'text-neutral-900'}`}>{balance > 0 ? 'Faltan' : balance < 0 ? 'Cambio' : 'Restante'}</span>
              <span className={`font-black text-4xl tracking-tighter ${balance > 0 ? 'text-red-500' : balance < 0 ? 'text-orange-500' : 'text-neutral-300'}`}>
                <span className="text-2xl mr-1">S/</span>{Math.abs(balance).toFixed(2)}
              </span>
            </div>
          </div>

          <Button size="lg" className={`w-full font-black text-[18px] md:text-[20px] h-[72px] md:h-[80px] rounded-[24px] shadow-2xl active:scale-[0.98] transition-all border ${isPaid ? 'shadow-green-600/30 bg-gradient-to-r from-green-500 to-green-600 text-white border-green-400 hover:to-green-500' : 'bg-neutral-100 text-neutral-400 border-transparent shadow-none pointer-events-none'}`} disabled={!isPaid} onClick={checkout}>
            Finalizar Venta
          </Button>
        </div>
    </div>
  );

  return (
    <div className="h-screen md:h-full flex flex-col md:flex-row p-0 md:p-4 gap-4 overflow-hidden relative pb-[84px] md:pb-0 bg-neutral-100">
      
      {/* 1. SECCIÓN: PRODUCTOS */}
      <section className="flex-1 flex flex-col h-full overflow-hidden relative">
        <div className="p-3 md:p-0 md:mb-4 bg-transparent shrink-0">
          <div className="relative flex gap-3">
             <div className="relative flex-1">
                <Search className="w-6 h-6 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <Input 
                  className="pl-12 h-14 md:h-16 rounded-2xl text-[16px] md:text-[18px] font-bold shadow-sm border-0 ring-1 ring-neutral-200 bg-white placeholder:text-neutral-400/80 w-full" 
                  placeholder="Buscar ítem o SKU..." 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
             </div>
             <Button className="h-14 md:h-16 w-14 md:w-16 rounded-2xl shrink-0 bg-white border border-neutral-200 text-neutral-600 shadow-sm hover:bg-neutral-50 p-0">
                <Camera className="w-6 h-6"/>
             </Button>
          </div>
        </div>

        <div className="flex-1 overflow-x-hidden overflow-y-auto px-3 md:px-1 pb-20 md:pb-0 min-h-0 custom-scrollbar">
           <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-4 content-start">
            {filteredProducts.map(p => (
              <div 
                key={p.id} 
                className={`bg-white rounded-3xl p-4 md:p-5 flex flex-col border border-neutral-200/50 shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-95 select-none relative
                  ${p.stock <= 0 ? 'opacity-40 grayscale pointer-events-none' : ''}`
                } 
                onClick={() => addToCart(p)}
              >
                  {p.stock <= 0 && <div className="absolute top-3 right-3 bg-red-100 text-red-600 font-bold text-[10px] uppercase px-2 py-1 rounded-lg">Agotado</div>}
                  
                  {p.images && p.images.length > 0 && (
                      <div className="-mx-4 md:-mx-5 -mt-4 md:-mt-5 mb-3 rounded-t-3xl overflow-hidden h-32 relative">
                         <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                  )}

                  <div className="text-[16px] md:text-[18px] font-extrabold line-clamp-3 leading-tight mb-4 min-h-[60px] text-neutral-800">{p.name}</div>
                  <div className="mt-auto flex justify-between items-end">
                     <div className="bg-neutral-100 text-neutral-500 font-bold text-xs px-2.5 py-1 rounded-lg">{p.stock} u.</div>
                     <span className="font-black text-xl md:text-2xl text-green-700 tracking-tight">S/{parseFloat(p.price).toFixed(2)}</span>
                  </div>
              </div>
            ))}
            {filteredProducts.length === 0 && (
              <div className="col-span-full py-20 text-center text-neutral-400 font-medium text-lg">Cero coincidencias.</div>
            )}
          </div>
        </div>
      </section>

      {/* 2. SECCIÓN: TICKET (Desktop) */}
      <section className="hidden md:flex shrink-0 w-[420px] bg-white/80 backdrop-blur-3xl rounded-3xl shadow-sm border border-neutral-200 flex-col overflow-hidden relative">
          <div className="px-6 py-5 border-b border-neutral-100 flex justify-between items-center bg-white/50">
            <h2 className="font-extrabold text-xl flex items-center gap-2 text-neutral-800">Caja Múltiple</h2>
            <div className="bg-green-100 text-green-700 font-bold text-sm px-3 py-1 rounded-full">Activa</div>
          </div>
          <CartContent />
      </section>

      {/* 3. MÓVIL FAB */}
      <div className="md:hidden fixed bottom-[90px] left-0 right-0 px-4 z-40 pointer-events-none">
          <Sheet>
            <SheetTrigger className="w-full h-16 rounded-2xl bg-neutral-900 text-white shadow-2xl flex justify-between px-6 pointer-events-auto hover:bg-neutral-800 group items-center">
                  <div className="flex items-center gap-3">
                     <div className="bg-white/20 p-2 rounded-xl text-sm font-bold w-10 h-10 flex items-center justify-center">
                        {cartItemsCount}
                     </div>
                     <span className="font-bold text-lg">Cobrar Ticket</span>
                  </div>
                  <span className="font-black text-2xl group-active:scale-110 transition-transform">S/ {cartTotal.toFixed(2)}</span>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[90vh] rounded-t-[32px] p-0 flex flex-col bg-neutral-100 gap-0 outline-none border-t-0 shadow-2xl">
               <SheetHeader className="p-6 bg-white border-b border-neutral-200 shrink-0 text-left rounded-t-[32px]">
                 <SheetTitle className="font-extrabold text-2xl w-full text-center tracking-tight">Cobro en Caja</SheetTitle>
               </SheetHeader>
               <div className="flex-1 overflow-hidden min-h-0 bg-[#f2f4f7]">
                  <CartContent />
               </div>
            </SheetContent>
          </Sheet>
      </div>

    </div>
  );
}
