import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { ShoppingCart } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/login', { email, password });
      localStorage.setItem('jwt_token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/pos');
    } catch (err: any) {
      if (err.response && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Error conectando al servidor (Posible fallo de CORS o DB)');
        console.error("🔍 Debug Error:", { status: err.response?.status, data: err.response?.data, endpoint: err.config?.url });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-4 bg-gradient-to-br from-neutral-200 to-neutral-300">
      <div className="w-full max-w-md bg-white/70 backdrop-blur-2xl rounded-[32px] shadow-2xl p-8 md:p-10 border border-white/50 relative overflow-hidden">
        {/* Adorno visual */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-green-400 rounded-full blur-[80px] opacity-40"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-400 rounded-full blur-[80px] opacity-40"></div>
        
        <div className="relative z-10 flex flex-col items-center">
            <div className="w-20 h-20 bg-neutral-900 rounded-3xl flex justify-center items-center shadow-lg shadow-neutral-900/20 mb-6">
                <ShoppingCart className="text-white w-10 h-10" />
            </div>

            <h2 className="text-3xl font-extrabold text-neutral-900 tracking-tight text-center mb-2">¡Hola, equipo!</h2>
            <p className="text-neutral-500 font-medium text-center mb-8">Ingresa tus datos operativos para aperturar caja.</p>

            <form onSubmit={handleLogin} className="space-y-5 w-full">
            {error && (
                <div className="p-4 bg-red-100 border border-red-200 text-red-700 text-[15px] font-bold rounded-2xl text-center shadow-sm">
                {error}
                </div>
            )}
            
            <div className="space-y-4">
               <div>
                  <label className="text-[13px] uppercase tracking-wider font-extrabold text-neutral-500 ml-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-14 mt-1 border-0 ring-1 ring-neutral-200 rounded-2xl shadow-sm px-4 focus:ring-2 focus:ring-neutral-900 font-semibold text-[16px] bg-white transition-shadow"
                    placeholder="supervisor@tienda.com"
                    required
                  />
               </div>
               
               <div>
                  <label className="text-[13px] uppercase tracking-wider font-extrabold text-neutral-500 ml-1">Clave de Acceso</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-14 mt-1 border-0 ring-1 ring-neutral-200 rounded-2xl shadow-sm px-4 focus:ring-2 focus:ring-neutral-900 font-semibold text-[16px] bg-white transition-shadow tracking-widest"
                    placeholder="••••••••"
                    required
                  />
               </div>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full h-16 mt-4 bg-neutral-900 text-white font-extrabold text-lg rounded-2xl tracking-wide shadow-xl shadow-neutral-900/20 hover:bg-neutral-800 disabled:opacity-50 transition-all active:scale-95"
            >
                {loading ? 'Validando...' : 'Iniciar Turno Seguro'}
            </button>
            </form>
        </div>
      </div>
    </div>
  );
}
