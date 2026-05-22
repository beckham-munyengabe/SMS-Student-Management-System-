import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import { Users, Plus, Search, Edit2, Trash2, Eye, X } from 'lucide-react';

const INITIAL_FORM = {
  studentName: '', gender: 'Male', class: '', address: '',
  dateOfBirth: '', phone: '', parentName: ''
};

export default function StudentsPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [classes, setClasses] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [viewStudent, setViewStudent] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchStudents();
    api.get('/students/classes').then(r => setClasses(r.data)).catch(() => {});
  }, [page, classFilter]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (classFilter) params.append('class', classFilter);
      if (search) params.append('search', search);
      const res = await api.get(`/students?${params}`);
      setStudents(res.data.students);
      setTotalPages(res.data.pages);
    } catch (err) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchStudents();
  };

  const openCreate = () => {
    setForm(INITIAL_FORM);
    setEditingStudent(null);
    setIsModalOpen(true);
  };

  const openEdit = (student) => {
    setForm({
      studentName: student.studentName,
      gender: student.gender,
      class: student.class,
      address: student.address,
      dateOfBirth: student.dateOfBirth?.split('T')[0] || '',
      phone: student.phone || '',
      parentName: student.parentName || ''
    });
    setEditingStudent(student);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.studentName || !form.class || !form.address) {
      return toast.error('Name, class and address are required');
    }
    setSaving(true);
    try {
      if (editingStudent) {
        const res = await api.put(`/students/${editingStudent._id}`, form);
        setStudents(prev => prev.map(s => s._id === editingStudent._id ? res.data : s));
        toast.success('Student updated');
      } else {
        const res = await api.post('/students', form);
        setStudents(prev => [res.data, ...prev]);
        toast.success('Student created');
      }
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this student?')) return;
    try {
      await api.delete(`/students/${id}`);
      setStudents(prev => prev.filter(s => s._id !== id));
      toast.success('Student removed');
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const viewDetails = async (student) => {
    try {
      const res = await api.get(`/students/${student._id}`);
      setViewStudent(res.data);
    } catch (err) {
      toast.error('Could not load student details');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-white">Students</h1>
          <p className="text-slate-400 text-sm mt-1">Manage enrolled students</p>
        </div>
        {user.role === 'administrator' && (
          <button onClick={openCreate} className="btn-primary">
            <Plus className="w-4 h-4" /> Add Student
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card p-4">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search students..."
              className="input-field pl-9 py-2"
            />
          </div>
          <select
            value={classFilter}
            onChange={e => { setClassFilter(e.target.value); setPage(1); }}
            className="input-field w-auto"
          >
            <option value="">All Classes</option>
            {classes.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button type="submit" className="btn-primary py-2">Search</button>
        </form>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-white/5">
              <tr>
                {['Name', 'Gender', 'Class', 'Address', 'Parent', 'Actions'].map(h => (
                  <th key={h} className="table-header text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-400">
                  <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
                </td></tr>
              ) : students.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-500">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No students found</p>
                </td></tr>
              ) : students.map(s => (
                <tr key={s._id} className="hover:bg-white/2 transition-colors">
                  <td className="table-cell font-semibold text-white">{s.studentName}</td>
                  <td className="table-cell">
                    <span className={`badge ${s.gender === 'Male' ? 'bg-blue-500/15 text-blue-300' : s.gender === 'Female' ? 'bg-pink-500/15 text-pink-300' : 'bg-slate-500/15 text-slate-300'}`}>
                      {s.gender}
                    </span>
                  </td>
                  <td className="table-cell">
                    <span className="badge bg-brand-600/10 text-brand-400">{s.class}</span>
                  </td>
                  <td className="table-cell text-slate-400 max-w-32 truncate">{s.address}</td>
                  <td className="table-cell text-slate-400">{s.parentName || '—'}</td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <button onClick={() => viewDetails(s)} className="p-1.5 text-slate-400 hover:text-brand-400 hover:bg-brand-600/10 rounded-lg transition-all">
                        <Eye className="w-4 h-4" />
                      </button>
                      {user.role === 'administrator' && (
                        <>
                          <button onClick={() => openEdit(s)} className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(s._id)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t border-white/5">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary py-1.5 px-3 disabled:opacity-40">Prev</button>
            <span className="text-slate-400 text-sm">{page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="btn-secondary py-1.5 px-3 disabled:opacity-40">Next</button>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
        title={editingStudent ? 'Edit Student' : 'Add New Student'} size="lg">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Full Name *</label>
            <input value={form.studentName} onChange={e => setForm({ ...form, studentName: e.target.value })} className="input-field" placeholder="Student full name" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Gender *</label>
            <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })} className="input-field">
              <option>Male</option><option>Female</option><option>Other</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Class *</label>
            <input value={form.class} onChange={e => setForm({ ...form, class: e.target.value })} className="input-field" placeholder="e.g. Grade 10A" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Address *</label>
            <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="input-field" placeholder="Home address" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Date of Birth</label>
            <input type="date" value={form.dateOfBirth} onChange={e => setForm({ ...form, dateOfBirth: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Phone</label>
            <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="input-field" placeholder="Phone number" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Parent / Guardian Name</label>
            <input value={form.parentName} onChange={e => setForm({ ...form, parentName: e.target.value })} className="input-field" placeholder="Parent name" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
            {saving ? 'Saving...' : (editingStudent ? 'Update Student' : 'Add Student')}
          </button>
        </div>
      </Modal>

      {/* View Student Modal */}
      <Modal isOpen={!!viewStudent} onClose={() => setViewStudent(null)} title="Student Details" size="lg">
        {viewStudent && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center flex-shrink-0">
                <span className="text-brand-300 font-display text-2xl">{viewStudent.student?.studentName?.charAt(0)}</span>
              </div>
              <div>
                <h3 className="font-display text-2xl text-white">{viewStudent.student?.studentName}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="badge bg-brand-600/10 text-brand-400">{viewStudent.student?.class}</span>
                  <span className="badge bg-slate-700/50 text-slate-300">{viewStudent.student?.gender}</span>
                </div>
              </div>
            </div>

            {/* Report summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="card p-4 text-center">
                <p className="font-display text-2xl text-brand-400">{viewStudent.report?.attendanceRate}%</p>
                <p className="text-xs text-slate-400 mt-1">Attendance Rate</p>
              </div>
              <div className="card p-4 text-center">
                <p className="font-display text-2xl text-green-400">{viewStudent.report?.overallAverage}</p>
                <p className="text-xs text-slate-400 mt-1">Avg Score</p>
              </div>
              <div className="card p-4 text-center">
                <p className="font-display text-2xl text-cyan-400">{viewStudent.marks?.length || 0}</p>
                <p className="text-xs text-slate-400 mt-1">Total Exams</p>
              </div>
            </div>

            {/* Subject averages */}
            {viewStudent.report?.subjectAverages?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-slate-300 mb-3">Subject Performance</h4>
                <div className="space-y-2">
                  {viewStudent.report.subjectAverages.map(s => (
                    <div key={s.subject} className="flex items-center gap-3">
                      <span className="text-sm text-slate-300 w-32 truncate">{s.subject}</span>
                      <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-500 rounded-full" style={{ width: `${s.average}%` }} />
                      </div>
                      <span className="text-sm font-mono font-semibold text-white w-10 text-right">{s.average}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
