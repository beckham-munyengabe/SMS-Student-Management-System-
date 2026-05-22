import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { User, Mail, Shield, Lock, Eye, EyeOff, Save, GraduationCap, MapPin, Phone, Users } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();
  const [studentProfile, setStudentProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPwd, setShowPwd] = useState({ current: false, new: false, confirm: false });
  const [saving, setSaving] = useState(false);
  const [marks, setMarks] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState(null);

  const roleStyle = {
    administrator: { bg: 'bg-purple-600/20 border-purple-500/30 text-purple-300', label: 'Administrator', icon: Shield },
    teacher: { bg: 'bg-blue-600/20 border-blue-500/30 text-blue-300', label: 'Teacher', icon: Users },
    student: { bg: 'bg-emerald-600/20 border-emerald-500/30 text-emerald-300', label: 'Student', icon: GraduationCap },
  };
  const rs = roleStyle[user.role] || roleStyle.student;
  const RoleIcon = rs.icon;

  useEffect(() => {
    if (user.role === 'student' && user.studentId) {
      setLoading(true);
      Promise.all([
        api.get(`/students/${user.studentId}`),
        api.get('/marks'),
        api.get(`/attendance/summary/${user.studentId}`),
      ]).then(([profileRes, marksRes, attRes]) => {
        setStudentProfile(profileRes.data);
        setMarks(marksRes.data || []);
        setAttendanceSummary(attRes.data);
      }).catch(() => {}).finally(() => setLoading(false));
    }
  }, [user]);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword) return toast.error('All fields required');
    if (passwordForm.newPassword.length < 6) return toast.error('New password must be at least 6 characters');
    if (passwordForm.newPassword !== passwordForm.confirmPassword) return toast.error('Passwords do not match');
    setSaving(true);
    try {
      await api.put('/users/me/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally { setSaving(false); }
  };

  const GRADE_COLORS = { 'A+': 'text-emerald-400', A: 'text-green-400', B: 'text-blue-400', C: 'text-yellow-400', D: 'text-orange-400', F: 'text-red-400' };
  const avgMark = marks.length ? (marks.reduce((s, m) => s + m.marks, 0) / marks.length).toFixed(1) : '—';

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="font-display text-3xl text-white">My Profile</h1>
        <p className="text-slate-400 text-sm mt-1">Your account information and settings</p>
      </div>

      {/* Profile Card */}
      <div className="card p-6">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className={`w-20 h-20 rounded-2xl border flex items-center justify-center flex-shrink-0 ${rs.bg}`}>
            <span className="font-display text-4xl">{user.name.charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-2xl text-white">{user.name}</h2>
            <div className="flex items-center gap-1.5 mt-1 text-slate-400">
              <Mail className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="text-sm">{user.email}</span>
            </div>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className={`badge border flex items-center gap-1.5 ${rs.bg}`}>
                <RoleIcon className="w-3 h-3" /> {rs.label}
              </span>
              <span className="badge bg-green-500/10 text-green-400">Active Account</span>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/5">
          {[
            { icon: User, label: 'Full Name', value: user.name },
            { icon: Mail, label: 'Email', value: user.email },
            { icon: Shield, label: 'Role', value: rs.label },
            { icon: RoleIcon, label: 'Account Status', value: 'Active' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-3 p-3 rounded-xl bg-white/3">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-slate-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">{label}</p>
                <p className="text-sm text-white font-medium mt-0.5">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Student-specific stats */}
      {user.role === 'student' && (
        <div className="space-y-4">
          {loading ? (
            <div className="card p-6 flex items-center justify-center h-32">
              <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {studentProfile?.student && (
                <div className="card p-6">
                  <h3 className="font-display text-xl text-white mb-4 flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-brand-400" /> Student Information
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {[
                      { icon: GraduationCap, label: 'Class', value: studentProfile.student.class },
                      { icon: Users, label: 'Gender', value: studentProfile.student.gender },
                      { icon: MapPin, label: 'Address', value: studentProfile.student.address },
                      { icon: Phone, label: 'Phone', value: studentProfile.student.phone || '—' },
                      { icon: User, label: 'Parent / Guardian', value: studentProfile.student.parentName || '—' },
                      { icon: Shield, label: 'Enrollment', value: new Date(studentProfile.student.enrollmentDate || studentProfile.student.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) },
                    ].map(({ icon: Icon, label, value }) => (
                      <div key={label} className="flex items-start gap-3 p-3 rounded-xl bg-white/3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-4 h-4 text-slate-400" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wider">{label}</p>
                          <p className="text-sm text-white font-medium mt-0.5">{value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Academic summary */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Average Score', value: `${avgMark}${avgMark !== '—' ? '%' : ''}`, color: 'brand' },
                  { label: 'Attendance Rate', value: attendanceSummary ? `${attendanceSummary.rate}%` : '—', color: 'emerald' },
                  { label: 'Exams Taken', value: marks.length, color: 'cyan' },
                ].map(({ label, value, color }) => {
                  const c = { brand: 'text-brand-400', emerald: 'text-emerald-400', cyan: 'text-cyan-400' };
                  return (
                    <div key={label} className="card p-4 text-center">
                      <p className={`text-3xl font-display ${c[color]}`}>{value}</p>
                      <p className="text-xs text-slate-400 mt-1">{label}</p>
                    </div>
                  );
                })}
              </div>

              {/* Recent marks */}
              {marks.length > 0 && (
                <div className="card p-6">
                  <h3 className="font-display text-xl text-white mb-4">Recent Marks</h3>
                  <div className="space-y-2">
                    {marks.slice(0, 6).map(m => (
                      <div key={m._id} className="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/5">
                        <div>
                          <p className="text-sm font-semibold text-white">{m.subject}</p>
                          <p className="text-xs text-slate-400">{m.examType} · {m.term || 'No term'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-mono font-bold text-white">{m.marks}</p>
                          <p className={`text-xs font-semibold ${GRADE_COLORS[m.grade] || 'text-slate-400'}`}>{m.grade}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Change Password */}
      <div className="card p-6">
        <h3 className="font-display text-xl text-white mb-1 flex items-center gap-2">
          <Lock className="w-5 h-5 text-brand-400" /> Change Password
        </h3>
        <p className="text-slate-400 text-sm mb-5">Update your login credentials</p>

        <form onSubmit={handleChangePassword} className="space-y-4">
          {[
            { field: 'currentPassword', label: 'Current Password', key: 'current' },
            { field: 'newPassword', label: 'New Password', key: 'new' },
            { field: 'confirmPassword', label: 'Confirm New Password', key: 'confirm' },
          ].map(({ field, label, key }) => (
            <div key={field}>
              <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">{label}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showPwd[key] ? 'text' : 'password'}
                  value={passwordForm[field]}
                  onChange={e => setPasswordForm(prev => ({ ...prev, [field]: e.target.value }))}
                  className="input-field pl-10 pr-10"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPwd(prev => ({ ...prev, [key]: !prev[key] }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPwd[key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}

          <div className="flex justify-end pt-2">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              <Save className="w-4 h-4" />
              {saving ? 'Saving…' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
