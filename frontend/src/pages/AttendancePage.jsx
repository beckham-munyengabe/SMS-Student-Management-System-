import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { ClipboardList, Plus, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import Modal from '../components/Modal';

const statusConfig = {
  Present: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10' },
  Absent: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
  Late: { icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  Excused: { icon: AlertCircle, color: 'text-blue-400', bg: 'bg-blue-500/10' },
};

export default function AttendancePage() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [filter, setFilter] = useState({ date: '', studentId: '' });

  // Single record form
  const [form, setForm] = useState({ studentId: '', date: new Date().toISOString().split('T')[0], status: 'Present', subject: '', notes: '' });

  // Bulk attendance
  const [bulkDate, setBulkDate] = useState(new Date().toISOString().split('T')[0]);
  const [bulkSubject, setBulkSubject] = useState('');
  const [bulkRecords, setBulkRecords] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchRecords();
    if (user.role !== 'student') {
      api.get('/students?limit=200').then(r => {
        setStudents(r.data.students);
        setBulkRecords(r.data.students.map(s => ({ studentId: s._id, studentName: s.studentName, class: s.class, status: 'Present' })));
      }).catch(() => {});
    }
  }, [filter]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.date) params.append('date', filter.date);
      if (filter.studentId) params.append('studentId', filter.studentId);
      const res = await api.get(`/attendance?${params}`);
      setRecords(res.data);
    } catch (err) {
      toast.error('Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  const handleSingle = async () => {
    if (!form.studentId || !form.date) return toast.error('Student and date required');
    setSaving(true);
    try {
      await api.post('/attendance', { records: [{ ...form, class: students.find(s => s._id === form.studentId)?.class }] });
      toast.success('Attendance recorded');
      setIsModalOpen(false);
      fetchRecords();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const handleBulk = async () => {
    if (!bulkDate) return toast.error('Date required');
    setSaving(true);
    try {
      const records = bulkRecords.map(r => ({
        studentId: r.studentId, date: bulkDate, status: r.status,
        subject: bulkSubject, class: r.class
      }));
      await api.post('/attendance', { records });
      toast.success(`Attendance recorded for ${records.length} students`);
      setIsModalOpen(false);
      fetchRecords();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const updateBulkStatus = (studentId, status) => {
    setBulkRecords(prev => prev.map(r => r.studentId === studentId ? { ...r, status } : r));
  };

  const summary = {
    present: records.filter(r => r.status === 'Present').length,
    absent: records.filter(r => r.status === 'Absent').length,
    late: records.filter(r => r.status === 'Late').length,
    excused: records.filter(r => r.status === 'Excused').length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-white">
            {user.role === 'student' ? 'My Attendance' : 'Attendance'}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {user.role === 'student' ? 'View your attendance records' : 'Track and manage student attendance'}
          </p>
        </div>
        {user.role !== 'student' && (
          <button onClick={() => setIsModalOpen(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Record Attendance
          </button>
        )}
      </div>

      {/* Summary cards */}
      {records.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(summary).map(([key, val]) => {
            const cfg = statusConfig[key.charAt(0).toUpperCase() + key.slice(1)];
            return (
              <div key={key} className="card p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cfg?.bg}`}>
                  {cfg && <cfg.icon className={`w-5 h-5 ${cfg.color}`} />}
                </div>
                <div>
                  <p className="text-xs text-slate-400 capitalize">{key}</p>
                  <p className="text-2xl font-display text-white">{val}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <input type="date" value={filter.date} onChange={e => setFilter({ ...filter, date: e.target.value })}
          className="input-field w-auto" />
        {user.role !== 'student' && (
          <select value={filter.studentId} onChange={e => setFilter({ ...filter, studentId: e.target.value })}
            className="input-field w-auto flex-1 min-w-48">
            <option value="">All Students</option>
            {students.map(s => <option key={s._id} value={s._id}>{s.studentName} ({s.class})</option>)}
          </select>
        )}
        <button onClick={() => setFilter({ date: '', studentId: '' })} className="btn-secondary py-2">
          Clear
        </button>
      </div>

      {/* Records */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-white/5">
              <tr>
                {['Student', 'Class', 'Date', 'Subject', 'Status', 'Notes'].map(h => (
                  <th key={h} className="table-header text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-10">
                  <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
                </td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-500">
                  <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No records found</p>
                </td></tr>
              ) : records.map(r => {
                const cfg = statusConfig[r.status];
                return (
                  <tr key={r._id} className="hover:bg-white/2 transition-colors">
                    <td className="table-cell font-semibold text-white">{r.studentId?.studentName || '—'}</td>
                    <td className="table-cell">
                      <span className="badge bg-brand-600/10 text-brand-400">{r.studentId?.class || r.class}</span>
                    </td>
                    <td className="table-cell text-slate-300">{new Date(r.date).toLocaleDateString()}</td>
                    <td className="table-cell text-slate-400">{r.subject || '—'}</td>
                    <td className="table-cell">
                      <span className={`badge ${cfg?.bg} ${cfg?.color} flex items-center gap-1 w-fit`}>
                        {cfg && <cfg.icon className="w-3 h-3" />} {r.status}
                      </span>
                    </td>
                    <td className="table-cell text-slate-400 text-xs max-w-32 truncate">{r.notes || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
        title="Record Attendance" size={isBulkMode ? 'xl' : 'md'}>
        {/* Mode toggle */}
        <div className="flex rounded-xl border border-white/10 p-1 mb-5">
          {[{ label: 'Single Student', bulk: false }, { label: 'Bulk (Whole Class)', bulk: true }].map(({ label, bulk }) => (
            <button key={label} onClick={() => setIsBulkMode(bulk)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${isBulkMode === bulk ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'}`}>
              {label}
            </button>
          ))}
        </div>

        {!isBulkMode ? (
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
                <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Date *</label>
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Status *</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="input-field">
                  {Object.keys(statusConfig).map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Subject</label>
              <input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="input-field" placeholder="e.g. Mathematics" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Notes</label>
              <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="input-field" placeholder="Optional notes" />
            </div>
            <div className="flex justify-end gap-3 mt-2">
              <button onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleSingle} disabled={saving} className="btn-primary">
                {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Date *</label>
                <input type="date" value={bulkDate} onChange={e => setBulkDate(e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Subject</label>
                <input value={bulkSubject} onChange={e => setBulkSubject(e.target.value)} className="input-field" placeholder="Subject" />
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto space-y-2">
              {bulkRecords.map(r => (
                <div key={r.studentId} className="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/5">
                  <div>
                    <p className="text-sm font-semibold text-white">{r.studentName}</p>
                    <p className="text-xs text-slate-400">{r.class}</p>
                  </div>
                  <div className="flex gap-1">
                    {Object.keys(statusConfig).map(s => (
                      <button key={s} onClick={() => updateBulkStatus(r.studentId, s)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${r.status === s ? `${statusConfig[s].bg} ${statusConfig[s].color}` : 'text-slate-500 hover:text-slate-300'}`}>
                        {s.charAt(0)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleBulk} disabled={saving} className="btn-primary">
                {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                Save All ({bulkRecords.length})
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
