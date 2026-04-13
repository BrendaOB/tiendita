import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, PackageSearch, Layers, LogOut, AlertCircle, Building, History, Menu, ChevronLeft, ChevronRight, PackageOpen, UploadCloud, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Toaster } from 'sonner';

export default function AppLayout() {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isAdmin = user?.role === 'admin';
  const navigate = useNavigate();

  const [isCollapsed, setIsCollapsed] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const menuItems = [
    { to: "/pos", icon: <ShoppingCart className="w-5 h-5" />, label: "Caja (POS)" },
    { to: "/inventory", icon: <PackageSearch className="w-5 h-5" />, label: "Inventario" },
    { to: "/categories", icon: <Layers className="w-5 h-5" />, label: "Categorías" }
  ];

  const adminItems = [
    { to: "/dashboard", icon: <LayoutDashboard className="w-5 h-5" />, label: "Métricas" },
    { to: "/users", icon: <Users className="w-5 h-5" />, label: "Usuarios" },
    { to: "/purchasing", icon: <AlertCircle className="w-5 h-5" />, label: "Suministros" },
    { to: "/suppliers", icon: <Building className="w-5 h-5" />, label: "Proveedores" },
    { to: "/kardex", icon: <History className="w-5 h-5" />, label: "Kardex" },
    { to: "/sales-history", icon: <History className="w-5 h-5" />, label: "Reportes" },
    { to: "/bulk-upload", icon: <UploadCloud className="w-5 h-5" />, label: "Carga Masiva" }
  ];

  // Tooltip customizado usando Group Hover
  const NavItem = ({ to, icon, label, collapsed }: any) => (
    <NavLink 
      to={to} 
      onClick={() => setMobileMenuOpen(false)}
      className={({ isActive }) => 
        `relative group flex items-center gap-3 p-3 rounded-2xl transition-all font-semibold select-none
        ${isActive 
          ? 'text-white bg-gradient-to-r from-blue-600 to-blue-500 shadow-lg shadow-blue-500/30' 
          : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100/80'}
        ${collapsed ? 'justify-center w-12 h-12 mx-auto px-0' : 'w-full px-4'}
        `
      }
    >
      {({ isActive }) => (
        <>
          <div className={`${isActive ? 'text-white' : 'text-neutral-500 group-hover:text-neutral-900'} shrink-0`}>
             {icon}
          </div>
          
          {/* Label normal (Oculto en collapsed) */}
          {!collapsed && (
            <motion.span 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="text-[15px] whitespace-nowrap overflow-hidden"
            >
              {label}
            </motion.span>
          )}

          {/* Custom Tooltip Flotante para Desktop Collapsed */}
          {collapsed && (
             <div className="absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2 px-3 py-1.5 bg-neutral-900 text-white text-[12px] font-bold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl pointer-events-none before:content-[''] before:absolute before:top-1/2 before:-left-1 before:-translate-y-1/2 before:border-4 before:border-transparent before:border-r-neutral-900">
               {label}
             </div>
          )}
        </>
      )}
    </NavLink>
  );

  return (
    <div className="min-h-[100dvh] bg-[#f8f9fc] flex flex-col md:flex-row overflow-hidden font-sans">
      
      {/* ---------------- MOBILE TOP NAVBAR ---------------- */}
      <header className="md:hidden sticky top-0 bg-white/90 backdrop-blur-3xl border-b border-neutral-200/50 px-4 py-3 z-30 flex justify-between items-center shadow-sm">
         <div className="flex items-center gap-3">
             <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                <ShoppingCart className="text-white w-4 h-4"/>
             </div>
             <h1 className="font-extrabold text-xl tracking-tight text-neutral-900">TPOS</h1>
         </div>
         
         <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger className="flex items-center justify-center h-10 w-10 rounded-xl bg-neutral-50 border border-neutral-200 focus:outline-none hover:bg-neutral-100 transition-colors">
               <Menu className="w-5 h-5 text-neutral-700"/>
            </SheetTrigger>
            <SheetContent side="left" className="w-[85vw] max-w-[320px] p-0 flex flex-col bg-white border-r-0 rounded-r-[32px] overflow-hidden">
               <SheetTitle className="sr-only">Menú Navigacional</SheetTitle>
               
               <div className="p-6 bg-neutral-50/50 border-b border-neutral-100 flex items-center gap-3 shrink-0">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-neutral-200">
                     <PackageOpen className="w-6 h-6 text-blue-600"/>
                  </div>
                  <div>
                    <h2 className="font-extrabold text-lg text-neutral-900">TiendaPaul</h2>
                    <p className="text-xs font-bold text-neutral-400 capitalize">{user?.role}</p>
                  </div>
               </div>

               <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 custom-scrollbar">
                  <div>
                     <p className="px-4 text-[11px] font-black uppercase tracking-widest text-neutral-400 mb-3">Operativa</p>
                     <nav className="space-y-1.5">
                        {menuItems.map(item => <NavItem key={item.to} {...item} collapsed={false} />)}
                     </nav>
                  </div>

                  {isAdmin && (
                    <div>
                       <p className="px-4 text-[11px] font-black uppercase tracking-widest text-neutral-400 mb-3">Gestión Directiva</p>
                       <nav className="space-y-1.5">
                          {adminItems.map(item => <NavItem key={item.to} {...item} collapsed={false} />)}
                       </nav>
                    </div>
                  )}
               </div>

               <div className="p-6 border-t border-neutral-100 shrink-0">
                  <button onClick={handleLogout} className="w-full h-14 bg-red-50 text-red-600 font-extrabold rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform">
                     <LogOut className="w-5 h-5"/> Cerrar Sesión
                  </button>
               </div>
            </SheetContent>
         </Sheet>
      </header>


      {/* ---------------- DESKTOP SIDEBAR ---------------- */}
      <motion.aside 
         initial={false}
         animate={{ width: isCollapsed ? 88 : 260 }}
         transition={{ type: "spring", stiffness: 300, damping: 30 }}
         className="hidden md:flex flex-col bg-white border-r border-neutral-200/60 z-20 shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)] relative"
      >
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3.5 top-8 w-7 h-7 bg-white border border-neutral-200 rounded-full flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:scale-110 shadow-sm transition-all z-50 focus:outline-none"
        >
           {isCollapsed ? <ChevronRight className="w-4 h-4"/> : <ChevronLeft className="w-4 h-4"/>}
        </button>

        <div className={`flex items-center ${isCollapsed ? 'justify-center mx-1' : 'px-6'} h-[88px] shrink-0 overflow-hidden`}>
          <div className="flex items-center gap-3 w-[260px]">
             <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex shrink-0 items-center justify-center shadow-lg shadow-blue-500/20">
                <ShoppingCart className="text-white w-5 h-5"/>
             </div>
             {!isCollapsed && (
                <motion.h1 
                   initial={{ opacity: 0 }} 
                   animate={{ opacity: 1 }}
                   className="font-black text-xl tracking-tight text-neutral-900 shrink-0"
                >
                   TiendaPaul
                </motion.h1>
             )}
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto px-4 custom-scrollbar py-4 overflow-x-hidden space-y-6">
           <div>
              {!isCollapsed && <p className="px-4 text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2">Operativa</p>}
              <nav className="space-y-1.5 flex flex-col items-center">
                 {menuItems.map(item => <NavItem key={item.to} {...item} collapsed={isCollapsed} />)}
              </nav>
           </div>

           {isAdmin && (
             <div>
                {!isCollapsed && <p className="px-4 text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2">Administración</p>}
                <nav className="space-y-1.5 flex flex-col items-center">
                   {adminItems.map(item => <NavItem key={item.to} {...item} collapsed={isCollapsed} />)}
                </nav>
             </div>
           )}
        </div>

        <div className="px-4 pb-6 pt-4 shrink-0 overflow-hidden text-center bg-white">
           {!isCollapsed && (
             <div className="bg-neutral-50 p-4 rounded-3xl mb-3 text-center border border-neutral-100">
               <div className="font-bold text-sm text-neutral-900 line-clamp-1">{user?.name}</div>
               <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-0.5">{user?.role}</div>
             </div>
           )}
           <button onClick={handleLogout} title={isCollapsed ? "Cerrar Sesión" : ""} className={`w-full flex items-center justify-center h-12 bg-white border border-neutral-200/80 text-red-600 font-bold ${isCollapsed ? 'rounded-2xl px-0' : 'rounded-2xl gap-2 px-4'} hover:bg-red-50 transition-colors cursor-pointer`}>
             <LogOut className="w-5 h-5 shrink-0" /> 
             {!isCollapsed && <span className="text-[14px]">Salir</span>}
           </button>
        </div>
      </motion.aside>

      {/* ---------------- STICKY MAIN CONTENT ---------------- */}
      <main className="flex-1 relative flex flex-col z-10 h-[calc(100dvh-60px)] md:h-[100dvh] overflow-y-auto custom-scrollbar">
         <AnimatePresence mode="popLayout">
           <motion.div
             initial={{ opacity: 0, y: 5 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.2 }}
             className="flex-1 flex flex-col min-h-0"
           >
              <Outlet />
           </motion.div>
         </AnimatePresence>
      </main>
      <Toaster richColors position="top-right" />
    </div>
  );
}
