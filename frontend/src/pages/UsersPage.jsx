import { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import { Users, Plus, Edit2, Trash2, Mail, Shield, UserCheck, GraduationCap, Search } from 'lucide-react';

const ROLES = ['administrator', 'teacher', 'student'];
const INIT_FORM = { name: '', email: '', password: '', role: 'teacher', isActive: true };

const roleStyle = {
  administrator: { bg: 'bg-purple-500/15 text-purple-300 border-purple-500/20', icon: Shield },
  teacher: { bg: 'bg-blue-500/15 text-blue-300 border-blue-500/20', icon: UserCheck },
  student: { bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20', icon: GraduationCap },
};

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(INIT_FORM);
  const [saving, setSaving] = useState(false);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [students, setStudents] = useState([]);

  useEffect(() => {
    fetchUsers();
    api.get('/students?limit=300').then(r => setStudents(r.data.students || [])).catch(() => {});
  }, [roleFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = roleFilter ? `?role=${roleFilter}` : '';
      const res = await api.get(`/users${params}`);
      setUsers(res.data.users || []);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  const filtered = users.filter(u =>
    !search ||
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => { setForm(INIT_FORM); setEditing(null); setIsModalOpen(true); };
  const openEdit = (u) => {
    setForm({ name: u.name, email: u.email, password: '', role: u.role, isActive: u.isActive !== false, studentId: u.studentId?._id || '' });
    setEditing(u);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.email) return toast.error('Name and email required');
    if (!editing && !form.password) return toast.error('Password required for new users');
    if (form.password && form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setSaving(true);
    try {
      const data = { ...form };
      if (!data.password) delete data.password;
      if (data.role !== 'student') delete data.studentId;
      if (editing) {
        const res = await api.put(`/users/${editing._id}`, data);
        setUsers(prev => prev.map(u => u._id === editing._id ? res.data : u));
        toast.success('User updated');
      } else {
        const res = await api.post('/users', data);
        setUsers(prev => [res.data, ...prev]);
        toast.success('User created');
      }
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this user? This cannot be undone.')) return;
    try {
      await api.delete(`/users/${id}`);
      setUsers(prev => prev.filter(u => u._id !== id));
      toast.success('User deleted');
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  const counts = {
    total: users.length,
    administrator: users.filter(u => u.role === 'administrator').length,
    teacher: users.filter(u => u.role === 'teacher').length,
    student: users.filter(u => u.role === 'student').length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-white">User Management</h1>
          <p className="text-slate-400 text-sm mt-1">Manage system accounts and permissions</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: counts.total, icon: Users, color: 'brand' },
          { label: 'Administrators', value: counts.administrator, icon: Shield, color: 'purple' },
          { label: 'Teachers', value: counts.teacher, icon: UserCheck, color: 'blue' },
          { label: 'Students', value: counts.student, icon: GraduationCap, color: 'emerald' },
        ].map(({ label, value, icon: Icon, color }) => {
          const colorMap = {
            brand: 'bg-brand-600/10 text-brand-400', purple: 'bg-purple-600/10 text-purple-400',
            blue: 'bg-blue-600/10 text-blue-400', emerald: 'bg-emerald-600/10 text-emerald-400'
          };
          return (
            <div key={label} className="card p-4 flex items-center gap-3">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${colorMap[color]}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400">{label}</p>
                <p className="text-2xl font-display text-white">{value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search users..." className="input-field pl-9 py-2.5" />
        </div>
        <div className="flex gap-2">
          {['', ...ROLES].map(r => (
            <button key={r} onClick={() => setRoleFilter(r)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${roleFilter === r ? 'bg-brand-600 text-white' : 'bg-white/5 text-slate-400 hover:text-white border border-white/10'}`}>
              {r ? r.charAt(0).toUpperCase() + r.slice(1) : 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-white/5">
              <tr>
                {['User', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                  <th key={h} className="table-header text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12">
                  <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-14 text-slate-500">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No users found</p>
                </td></tr>
              ) : filtered.map(u => {
                const rs = roleStyle[u.role] || roleStyle.student;
                const RoleIcon = rs.icon;
                return (
                  <tr key={u._id} className="hover:bg-white/2 transition-colors">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${rs.bg}`}>
                          <span className="font-semibold text-sm">{u.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <span className="font-semibold text-white">{u.name}</span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="text-sm">{u.email}</span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className={`badge border ${rs.bg} flex items-center gap-1.5 w-fit`}>
                        <RoleIcon className="w-3 h-3" />
                        {u.role}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${u.isActive !== false ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        {u.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="table-cell text-slate-400 text-sm">
                      {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(u)} className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(u._id)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editing ? 'Edit User' : 'Create New User'}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Full Name *</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="Full name" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Email Address *</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input-field" placeholder="user@school.edu" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">
              Password {editing ? '(leave blank to keep current)' : '*'}
            </label>
            <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="input-field" placeholder={editing ? 'New password (optional)' : 'Minimum 6 characters'} />
          </div>
          <div>
            <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Role *</label>
            <div className="grid grid-cols-3 gap-2">
              {ROLES.map(r => {
                const rs = roleStyle[r];
                const RIcon = rs.icon;
                return (
                  <button key={r} type="button" onClick={() => setForm({ ...form, role: r })}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${form.role === r ? `${rs.bg} border-current` : 'bg-white/3 border-white/10 text-slate-400 hover:text-white'}`}>
                    <RIcon className="w-4 h-4" />
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </button>
                );
              })}
            </div>
          </div>
          {form.role === 'student' && (
            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Link to Student Profile</label>
              <select value={form.studentId || ''} onChange={e => setForm({ ...form, studentId: e.target.value })} className="input-field">
                <option value="">Select student...</option>
                {students.map(s => <option key={s._id} value={s._id}>{s.studentName} — {s.class}</option>)}
              </select>
            </div>
          )}
          {editing && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/5">
              <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })}
                className="w-4 h-4 accent-brand-500 rounded" />
              <label htmlFor="isActive" className="text-sm text-slate-300">Account is active</label>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {editing ? 'Update User' : 'Create User'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
