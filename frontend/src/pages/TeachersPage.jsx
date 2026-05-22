import { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import { UserCheck, Plus, Edit2, Trash2, Mail } from 'lucide-react';

const INIT_FORM = { name: '', email: '', password: '', role: 'teacher' };

export default function TeachersPage() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(INIT_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchTeachers(); }, []);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users?role=teacher');
      setTeachers(res.data.users || []);
    } catch { toast.error('Failed to load teachers'); }
    finally { setLoading(false); }
  };

  const openCreate = () => { setForm(INIT_FORM); setEditing(null); setIsModalOpen(true); };
  const openEdit = (t) => {
    setForm({ name: t.name, email: t.email, password: '', role: 'teacher' });
    setEditing(t);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.email) return toast.error('Name and email are required');
    if (!editing && !form.password) return toast.error('Password is required');
    setSaving(true);
    try {
      const data = { ...form, role: 'teacher' };
      if (!data.password) delete data.password;
      if (editing) {
        const res = await api.put(`/users/${editing._id}`, data);
        setTeachers(prev => prev.map(t => t._id === editing._id ? res.data : t));
        toast.success('Teacher updated');
      } else {
        const res = await api.post('/users', data);
        setTeachers(prev => [res.data, ...prev]);
        toast.success('Teacher created');
      }
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this teacher?')) return;
    try {
      await api.delete(`/users/${id}`);
      setTeachers(prev => prev.filter(t => t._id !== id));
      toast.success('Teacher deleted');
    } catch { toast.error('Delete failed'); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-white">Teachers</h1>
          <p className="text-slate-400 text-sm mt-1">{teachers.length} teachers registered</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Teacher
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {teachers.map(t => (
            <div key={t._id} className="card p-5 hover:border-white/10 transition-all group">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-300 font-display text-xl">{t.name.charAt(0)}</span>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(t)} className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(t._id)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <h3 className="font-semibold text-white mt-3">{t.name}</h3>
              <div className="flex items-center gap-1.5 mt-1">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-sm text-slate-400 truncate">{t.email}</span>
              </div>
              <div className="mt-3">
                <span className={`badge ${t.isActive !== false ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                  {t.isActive !== false ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ))}
          {teachers.length === 0 && (
            <div className="col-span-3 text-center py-16 text-slate-500">
              <UserCheck className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>No teachers yet</p>
            </div>
          )}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editing ? 'Edit Teacher' : 'Add Teacher'}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Full Name *</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="Teacher name" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Email *</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input-field" placeholder="teacher@school.edu" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">
              Password {editing ? '(leave blank to keep)' : '*'}
            </label>
            <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="input-field" placeholder="••••••••" />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {editing ? 'Update' : 'Add Teacher'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
