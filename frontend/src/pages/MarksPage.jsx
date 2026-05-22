import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import { Award, Plus, Edit2, Trash2 } from 'lucide-react';

const EXAM_TYPES = ['Quiz', 'Midterm', 'Final', 'Assignment', 'Project'];
const GRADE_COLORS = { 'A+': 'text-emerald-400 bg-emerald-500/10', A: 'text-green-400 bg-green-500/10', B: 'text-blue-400 bg-blue-500/10', C: 'text-yellow-400 bg-yellow-500/10', D: 'text-orange-400 bg-orange-500/10', F: 'text-red-400 bg-red-500/10' };

const INIT_FORM = { studentId: '', subject: '', marks: '', examType: 'Final', term: '', academicYear: '', remarks: '' };

export default function MarksPage() {
  const { user } = useAuth();
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(INIT_FORM);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState({ studentId: '', subject: '', examType: '' });

  useEffect(() => {
    fetchMarks();
    if (user.role !== 'student') {
      api.get('/students?limit=200').then(r => setStudents(r.data.students)).catch(() => {});
    }
  }, [filter]);

  const fetchMarks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.studentId) params.append('studentId', filter.studentId);
      if (filter.subject) params.append('subject', filter.subject);
      if (filter.examType) params.append('examType', filter.examType);
      const res = await api.get(`/marks?${params}`);
      setMarks(res.data);
    } catch {
      toast.error('Failed to load marks');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => { setForm(INIT_FORM); setEditing(null); setIsModalOpen(true); };
  const openEdit = (m) => {
    setForm({ studentId: m.studentId?._id || '', subject: m.subject, marks: m.marks, examType: m.examType, term: m.term || '', academicYear: m.academicYear || '', remarks: m.remarks || '' });
    setEditing(m);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.studentId || !form.subject || form.marks === '') return toast.error('Student, subject and marks are required');
    const marksVal = Number(form.marks);
    if (marksVal < 0 || marksVal > 100) return toast.error('Marks must be between 0 and 100');
    setSaving(true);
    try {
      if (editing) {
        const res = await api.put(`/marks/${editing._id}`, { ...form, marks: marksVal });
        setMarks(prev => prev.map(m => m._id === editing._id ? res.data : m));
        toast.success('Marks updated');
      } else {
        const res = await api.post('/marks', { ...form, marks: marksVal });
        setMarks(prev => [res.data, ...prev]);
        toast.success('Marks added');
      }
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this marks record?')) return;
    try {
      await api.delete(`/marks/${id}`);
      setMarks(prev => prev.filter(m => m._id !== id));
      toast.success('Deleted');
    } catch { toast.error('Delete failed'); }
  };

  const avg = marks.length ? (marks.reduce((s, m) => s + m.marks, 0) / marks.length).toFixed(1) : '—';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-white">{user.role === 'student' ? 'My Marks' : 'Marks'}</h1>
          <p className="text-slate-400 text-sm mt-1">{marks.length} records · Average: <span className="text-brand-400 font-semibold">{avg}</span></p>
        </div>
        {user.role !== 'student' && (
          <button onClick={openCreate} className="btn-primary">
            <Plus className="w-4 h-4" /> Add Marks
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        {user.role !== 'student' && (
          <select value={filter.studentId} onChange={e => setFilter({ ...filter, studentId: e.target.value })} className="input-field w-auto flex-1 min-w-48">
            <option value="">All Students</option>
            {students.map(s => <option key={s._id} value={s._id}>{s.studentName} ({s.class})</option>)}
          </select>
        )}
        <select value={filter.examType} onChange={e => setFilter({ ...filter, examType: e.target.value })} className="input-field w-auto">
          <option value="">All Exam Types</option>
          {EXAM_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
        <button onClick={() => setFilter({ studentId: '', subject: '', examType: '' })} className="btn-secondary py-2">Clear</button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-white/5">
              <tr>
                {['Student', 'Subject', 'Marks', 'Grade', 'Exam Type', 'Term', 'Recorded By', ...(user.role !== 'student' ? ['Actions'] : [])].map(h => (
                  <th key={h} className="table-header text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={8} className="text-center py-10">
                  <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
                </td></tr>
              ) : marks.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-slate-500">
                  <Award className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No marks recorded</p>
                </td></tr>
              ) : marks.map(m => (
                <tr key={m._id} className="hover:bg-white/2 transition-colors">
                  <td className="table-cell font-semibold text-white">{m.studentId?.studentName || '—'}</td>
                  <td className="table-cell text-slate-300">{m.subject}</td>
                  <td className="table-cell">
                    <span className="font-mono font-bold text-white text-base">{m.marks}</span>
                    <span className="text-slate-500 text-xs">/{m.maxMarks}</span>
                  </td>
                  <td className="table-cell">
                    <span className={`badge ${GRADE_COLORS[m.grade] || 'text-slate-400 bg-slate-700/30'}`}>{m.grade}</span>
                  </td>
                  <td className="table-cell text-slate-400">{m.examType}</td>
                  <td className="table-cell text-slate-400">{m.term || '—'}</td>
                  <td className="table-cell text-slate-400 text-xs">{m.recordedBy?.name || '—'}</td>
                  {user.role !== 'student' && (
                    <td className="table-cell">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(m)} className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {user.role === 'administrator' && (
                          <button onClick={() => handleDelete(m._id)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editing ? 'Edit Marks' : 'Add Marks'}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Student *</label>
            <select value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value })} className="input-field">
              <option value="">Select student...</option>
              {students.map(s => <option key={s._id} value={s._id}>{s.studentName} — {s.class}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Subject *</label>
              <input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="input-field" placeholder="e.g. Mathematics" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Marks (0–100) *</label>
              <input type="number" min="0" max="100" value={form.marks} onChange={e => setForm({ ...form, marks: e.target.value })} className="input-field" placeholder="75" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Exam Type</label>
              <select value={form.examType} onChange={e => setForm({ ...form, examType: e.target.value })} className="input-field">
                {EXAM_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Term</label>
              <input value={form.term} onChange={e => setForm({ ...form, term: e.target.value })} className="input-field" placeholder="e.g. Term 1" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Remarks</label>
            <input value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} className="input-field" placeholder="Optional remarks" />
          </div>
          <div className="flex justify-end gap-3 mt-2">
            <button onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {editing ? 'Update' : 'Add Marks'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
