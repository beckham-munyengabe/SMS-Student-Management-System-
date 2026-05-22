import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import { BookOpen, Plus, Edit2, Trash2 } from 'lucide-react';

const INIT_FORM = { courseName: '', courseCode: '', description: '', teacher: '', class: '', credits: 3 };

export default function CoursesPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(INIT_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCourses();
    if (user.role === 'administrator') {
      api.get('/users/teachers').then(r => setTeachers(r.data)).catch(() => {});
    }
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await api.get('/courses');
      setCourses(res.data);
    } catch { toast.error('Failed to load courses'); }
    finally { setLoading(false); }
  };

  const openCreate = () => { setForm(INIT_FORM); setEditing(null); setIsModalOpen(true); };
  const openEdit = (c) => {
    setForm({ courseName: c.courseName, courseCode: c.courseCode, description: c.description || '', teacher: c.teacher?._id || '', class: c.class || '', credits: c.credits });
    setEditing(c);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.courseName || !form.courseCode) return toast.error('Name and code are required');
    setSaving(true);
    try {
      if (editing) {
        const res = await api.put(`/courses/${editing._id}`, form);
        setCourses(prev => prev.map(c => c._id === editing._id ? res.data : c));
        toast.success('Course updated');
      } else {
        const res = await api.post('/courses', form);
        setCourses(prev => [res.data, ...prev]);
        toast.success('Course created');
      }
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this course?')) return;
    try {
      await api.delete(`/courses/${id}`);
      setCourses(prev => prev.filter(c => c._id !== id));
      toast.success('Course deleted');
    } catch { toast.error('Delete failed'); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-white">Courses</h1>
          <p className="text-slate-400 text-sm mt-1">{courses.length} courses available</p>
        </div>
        {user.role === 'administrator' && (
          <button onClick={openCreate} className="btn-primary">
            <Plus className="w-4 h-4" /> Add Course
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map(c => (
            <div key={c._id} className="card p-5 hover:border-white/10 transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 rounded-xl bg-brand-600/15 border border-brand-500/20 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5 text-brand-400" />
                </div>
                {user.role === 'administrator' && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(c)} className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(c._id)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
              <h3 className="font-semibold text-white text-base">{c.courseName}</h3>
              <p className="text-xs text-brand-400 font-mono mt-0.5">{c.courseCode}</p>
              {c.description && <p className="text-sm text-slate-400 mt-2 line-clamp-2">{c.description}</p>}
              <div className="flex items-center gap-2 mt-4 flex-wrap">
                {c.class && <span className="badge bg-brand-600/10 text-brand-400">{c.class}</span>}
                <span className="badge bg-white/5 text-slate-400">{c.credits} credits</span>
                {c.teacher && <span className="badge bg-cyan-600/10 text-cyan-400">{c.teacher.name}</span>}
              </div>
            </div>
          ))}
          {courses.length === 0 && (
            <div className="col-span-3 text-center py-16 text-slate-500">
              <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>No courses yet</p>
            </div>
          )}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editing ? 'Edit Course' : 'Add Course'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Course Name *</label>
              <input value={form.courseName} onChange={e => setForm({ ...form, courseName: e.target.value })} className="input-field" placeholder="e.g. Advanced Mathematics" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Course Code *</label>
              <input value={form.courseCode} onChange={e => setForm({ ...form, courseCode: e.target.value })} className="input-field" placeholder="MATH301" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Class</label>
              <input value={form.class} onChange={e => setForm({ ...form, class: e.target.value })} className="input-field" placeholder="Grade 10" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Teacher</label>
              <select value={form.teacher} onChange={e => setForm({ ...form, teacher: e.target.value })} className="input-field">
                <option value="">Unassigned</option>
                {teachers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Credits</label>
              <input type="number" min="1" max="10" value={form.credits} onChange={e => setForm({ ...form, credits: Number(e.target.value) })} className="input-field" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input-field resize-none h-20" placeholder="Course description..." />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {editing ? 'Update' : 'Create Course'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
