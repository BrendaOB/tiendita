import { useState, useEffect } from 'react';
import api from '@/lib/api'; // Usando tu instancia de api personalizada
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pencil, Trash2, UserPlus } from "lucide-react";
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

type User = {
  id: number;
  name: string;
  email: string;
  role: "admin" | "cashier";
};

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Siguiendo la lógica de 'form' que usaste en proveedores
  const [form, setForm] = useState({
    id: null as number | null,
    name: '',
    email: '',
    role: 'cashier' as "admin" | "cashier",
    password: ''
  });

  // Usuario logueado para validaciones de seguridad local
  const loggedUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users');
      // Ajuste según tu backend que devuelve { data: [...] }
      setUsers(res.data.data || []);
    } catch (e) {
      console.error(e);
      toast.error("Error al cargar la lista de usuarios.");
    } finally {
      setLoading(false);
    }
  };

  const openNewDialog = () => {
    setIsEditing(false);
    setForm({ id: null, name: '', email: '', role: 'cashier', password: '' });
    setIsDialogOpen(true);
  };

  const openEditDialog = (u: User) => {
    setIsEditing(true);
    setForm({ id: u.id, name: u.name, email: u.email, role: u.role, password: '' });
    setIsDialogOpen(true);
  };

  const saveUser = async () => {
    try {
      if (isEditing && form.id) {
        await api.put(`/users/${form.id}`, form);
        toast.success('Usuario actualizado correctamente.');
      } else {
        await api.post('/users', form);
        toast.success('Usuario creado con éxito.');
      }
      setIsDialogOpen(false);
      fetchUsers();
    } catch (e: any) {
      console.error(e);
      toast.error(e.response?.data?.message || 'Hubo un error al procesar la solicitud.');
    }
  };

  const deleteUser = async (id: number) => {
    if (id === loggedUser.id) {
      toast.warning("No puedes eliminar tu propia cuenta.");
      return;
    }

    if (!window.confirm("¿Seguro que deseas eliminar este usuario? Esta acción no se puede deshacer.")) return;

    try {
      await api.delete(`/users/${id}`);
      toast.success('Usuario eliminado.');
      fetchUsers();
    } catch (e) {
      console.error(e);
      toast.error('Error al intentar eliminar el usuario.');
    }
  };

  const handleRoleToggle = async (user: User) => {
    const newRole = user.role === "admin" ? "cashier" : "admin";

    if (user.id === loggedUser.id && newRole !== "admin") {
      toast.warning("No puedes revocar tus propios permisos de administrador.");
      return;
    }

    try {
      await api.put(`/users/${user.id}`, { ...user, role: newRole });
      toast.success(`Rol actualizado a ${newRole}`);
      fetchUsers();
    } catch (e) {
      console.error(e);
      toast.error("No se pudo cambiar el rol.");
    }
  };

  return (
    <div className="flex-1 p-4 md:p-8 overflow-y-auto">
      <div className="max-w-[1400px] mx-auto w-full space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-neutral-900">
              Usuarios
            </h1>
            <p className="text-neutral-500 font-semibold mt-1.5 text-sm md:text-lg">
              Gestión de accesos y permisos del personal.
            </p>
          </div>
          <Button
            onClick={openNewDialog}
            className="w-full md:w-auto h-14 rounded-2xl font-black md:px-8 text-[15px] bg-neutral-900 text-white shadow-lg shadow-neutral-900/10"
          >
            <UserPlus className="w-5 h-5 mr-2" /> Nuevo Usuario
          </Button>
        </div>

        {/* Tabla de Usuarios */}
        <Card className="bg-white/80 backdrop-blur-xl rounded-[32px] p-2 md:p-6 shadow-sm border border-neutral-200/60 flex flex-col">
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-neutral-100 hover:bg-transparent">
                  <TableHead className="font-extrabold text-neutral-400 uppercase tracking-widest pl-4 text-[12px]">Personal</TableHead>
                  <TableHead className="font-extrabold text-neutral-400 uppercase tracking-widest text-[12px]">Email</TableHead>
                  <TableHead className="font-extrabold text-neutral-400 uppercase tracking-widest text-[12px]">Rol</TableHead>
                  <TableHead className="text-right font-extrabold text-neutral-400 uppercase tracking-widest pr-4 text-[12px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id} className="border-neutral-100 hover:bg-neutral-50/50 transition-colors group">
                    <TableCell className="pl-4 py-5">
                      <div className="font-black text-neutral-800 text-[16px]">{u.name}</div>
                    </TableCell>
                    <TableCell className="text-neutral-500 font-semibold text-[14px]">
                      {u.email}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={u.role}
                        onValueChange={() => handleRoleToggle(u)}
                      >
                        <SelectTrigger className="w-[130px] h-9 rounded-xl font-bold text-xs border-neutral-200 bg-white shadow-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-neutral-200">
                          <SelectItem value="admin" className="font-bold text-blue-600">Administrador</SelectItem>
                          <SelectItem value="cashier" className="font-bold">Cajero</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      <div className="flex justify-end gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 rounded-xl bg-white shadow-sm border border-neutral-100 hover:bg-blue-50"
                          onClick={() => openEditDialog(u)}
                        >
                          <Pencil className="w-4 h-4 text-blue-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 rounded-xl bg-white shadow-sm border border-neutral-100 hover:bg-red-50 disabled:opacity-20"
                          onClick={() => deleteUser(u.id)}
                          disabled={u.id === loggedUser.id}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {users.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={4} className="h-40 text-center text-neutral-500 font-medium">No hay usuarios registrados.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Formulario */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[95vw] md:max-w-md border-0 rounded-[32px] p-6 md:p-8 bg-white shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-neutral-900">
              {isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold uppercase tracking-widest text-neutral-400 ml-1">Nombre Completo</label>
              <Input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Nombre del trabajador"
                className="h-12 rounded-xl font-bold border-neutral-200 focus:ring-2 focus:ring-neutral-900"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold uppercase tracking-widest text-neutral-400 ml-1">Correo Electrónico</label>
              <Input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="correo@empresa.com"
                className="h-12 rounded-xl font-bold border-neutral-200"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold uppercase tracking-widest text-neutral-400 ml-1">
                Contraseña {isEditing && "(Opcional)"}
              </label>
              <Input
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="h-12 rounded-xl font-bold border-neutral-200"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold uppercase tracking-widest text-neutral-400 ml-1">Rol en Sistema</label>
              <Select
                value={form.role}
                // Cambiamos el tipo del parámetro 'val' para incluir null
                onValueChange={(val: "admin" | "cashier" | null) => {
                  if (val) setForm({ ...form, role: val });
                }}
              >
                <SelectTrigger className="h-12 rounded-xl font-bold border-neutral-200">
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="admin" className="font-bold">Administrador</SelectItem>
                  <SelectItem value="cashier" className="font-bold">Cajero</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="mt-8 gap-3">
            <Button
              variant="ghost"
              className="h-12 rounded-xl font-bold text-neutral-500"
              onClick={() => setIsDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              className="h-12 rounded-xl font-black bg-neutral-900 text-white flex-1"
              onClick={saveUser}
              disabled={!form.name || !form.email || (!isEditing && !form.password)}
            >
              Guardar Usuario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}