import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, CartesianGrid, Legend
} from 'recharts';
import { BarChart3, Download, Users, Award, ClipboardList, TrendingUp, FileText, Filter } from 'lucide-react';

const COLORS = ['#6366f1', '#22d3ee', '#f59e0b', '#ef4444', '#10b981', '#f97316'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-slate-900 border border-white/10 rounded-xl px-4 py-3 shadow-2xl">
        <p className="text-slate-300 text-xs mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="font-semibold text-white text-sm" style={{ color: p.color }}>
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ReportsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [studentReport, setStudentReport] = useState(null);
  const [allMarks, setAllMarks] = useState([]);
  const [allAttendance, setAllAttendance] = useState([]);
  const [classFilter, setClassFilter] = useState('');
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedStudent) loadStudentReport(selectedStudent);
    else setStudentReport(null);
  }, [selectedStudent]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [studentsRes, marksRes, attendanceRes, classesRes] = await Promise.all([
        api.get('/students?limit=300'),
        api.get('/marks'),
        api.get('/attendance'),
        api.get('/students/classes'),
      ]);
      setStudents(studentsRes.data.students || []);
      setAllMarks(marksRes.data || []);
      setAllAttendance(attendanceRes.data || []);
      setClasses(classesRes.data || []);
    } catch { toast.error('Failed to load report data'); }
    finally { setLoading(false); }
  };

  const loadStudentReport = async (id) => {
    try {
      const res = await api.get(`/students/${id}`);
      setStudentReport(res.data);
    } catch { toast.error('Failed to load student report'); }
  };

  // Filter by class
  const filteredStudents = classFilter ? students.filter(s => s.class === classFilter) : students;
  const filteredStudentIds = new Set(filteredStudents.map(s => s._id));
  const filteredMarks = classFilter ? allMarks.filter(m => filteredStudentIds.has(m.studentId?._id)) : allMarks;
  const filteredAttendance = classFilter ? allAttendance.filter(a => filteredStudentIds.has(a.studentId?._id)) : allAttendance;

  // Subject average chart
  const subjectMap = {};
  filteredMarks.forEach(m => {
    if (!subjectMap[m.subject]) subjectMap[m.subject] = [];
    subjectMap[m.subject].push(m.marks);
  });
  const subjectData = Object.entries(subjectMap).map(([subject, marks]) => ({
    subject: subject.length > 12 ? subject.slice(0, 12) + '…' : subject,
    average: +(marks.reduce((a, b) => a + b, 0) / marks.length).toFixed(1),
    count: marks.length,
  })).sort((a, b) => b.average - a.average);

  // Grade distribution
  const gradeMap = {};
  filteredMarks.forEach(m => { gradeMap[m.grade] = (gradeMap[m.grade] || 0) + 1; });
  const gradeData = Object.entries(gradeMap).map(([grade, count]) => ({ grade, count }))
    .sort((a, b) => ['A+','A','B','C','D','F'].indexOf(a.grade) - ['A+','A','B','C','D','F'].indexOf(b.grade));

  // Attendance breakdown
  const attMap = { Present: 0, Absent: 0, Late: 0, Excused: 0 };
  filteredAttendance.forEach(a => { attMap[a.status] = (attMap[a.status] || 0) + 1; });
  const attData = Object.entries(attMap).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));
  const totalAtt = attData.reduce((s, d) => s + d.value, 0);
  const attRate = totalAtt > 0 ? ((attMap.Present / totalAtt) * 100).toFixed(1) : 0;

  // Student performance ranking (top 10)
  const studentPerf = {};
  filteredMarks.forEach(m => {
    const sid = m.studentId?._id;
    const name = m.studentId?.studentName;
    if (!sid || !name) return;
    if (!studentPerf[sid]) studentPerf[sid] = { name, marks: [], class: m.studentId?.class || '' };
    studentPerf[sid].marks.push(m.marks);
  });
  const topStudents = Object.values(studentPerf)
    .map(s => ({ ...s, average: +(s.marks.reduce((a, b) => a + b, 0) / s.marks.length).toFixed(1) }))
    .sort((a, b) => b.average - a.average).slice(0, 10);

  const gradeColor = (g) => ({ 'A+': '#10b981', A: '#34d399', B: '#6366f1', C: '#f59e0b', D: '#f97316', F: '#ef4444' }[g] || '#94a3b8');

  const printReport = () => window.print();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-white">Analytics & Reports</h1>
          <p className="text-slate-400 text-sm mt-1">Comprehensive academic performance insights</p>
        </div>
        <button onClick={printReport} className="btn-secondary">
          <Download className="w-4 h-4" /> Export Report
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <Filter className="w-4 h-4 text-slate-500" />
        <select value={classFilter} onChange={e => setClassFilter(e.target.value)} className="input-field w-auto">
          <option value="">All Classes</option>
          {classes.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)} className="input-field w-auto flex-1 min-w-48">
          <option value="">— Overall Report —</option>
          {filteredStudents.map(s => <option key={s._id} value={s._id}>{s.studentName} ({s.class})</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : selectedStudent && studentReport ? (
        /* Individual Student Report */
        <StudentDetailReport report={studentReport} />
      ) : (
        /* Overall Analytics */
        <>
          {/* KPI Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Users, label: 'Students Tracked', value: filteredStudents.length, color: 'brand' },
              { icon: Award, label: 'Avg. Score', value: filteredMarks.length ? `${(filteredMarks.reduce((s, m) => s + m.marks, 0) / filteredMarks.length).toFixed(1)}%` : '—', color: 'emerald' },
              { icon: ClipboardList, label: 'Attendance Rate', value: `${attRate}%`, color: 'cyan' },
              { icon: TrendingUp, label: 'Exams Recorded', value: filteredMarks.length, color: 'purple' },
            ].map(({ icon: Icon, label, value, color }) => {
              const c = { brand: 'bg-brand-600/10 text-brand-400', emerald: 'bg-emerald-600/10 text-emerald-400', cyan: 'bg-cyan-600/10 text-cyan-400', purple: 'bg-purple-600/10 text-purple-400' };
              return (
                <div key={label} className="card p-4 flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${c[color]}`}>
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

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Subject Performance */}
            <div className="card p-6">
              <h2 className="font-display text-xl text-white mb-5 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-brand-400" /> Subject Averages
              </h2>
              {subjectData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={subjectData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="average" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={48} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <EmptyChart />}
            </div>

            {/* Grade Distribution */}
            <div className="card p-6">
              <h2 className="font-display text-xl text-white mb-5 flex items-center gap-2">
                <Award className="w-5 h-5 text-brand-400" /> Grade Distribution
              </h2>
              {gradeData.length > 0 ? (
                <div className="flex items-center gap-6">
                  <ResponsiveContainer width={160} height={160}>
                    <PieChart>
                      <Pie data={gradeData} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={2} dataKey="count" nameKey="grade">
                        {gradeData.map((d, i) => <Cell key={i} fill={gradeColor(d.grade)} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 flex-1">
                    {gradeData.map(d => (
                      <div key={d.grade} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: gradeColor(d.grade) }} />
                          <span className="text-sm text-slate-300">Grade {d.grade}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${(d.count / filteredMarks.length) * 100}%`, background: gradeColor(d.grade) }} />
                          </div>
                          <span className="text-sm font-mono text-white w-8 text-right">{d.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : <EmptyChart />}
            </div>

            {/* Attendance Breakdown */}
            <div className="card p-6">
              <h2 className="font-display text-xl text-white mb-5 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-brand-400" /> Attendance Summary
              </h2>
              {attData.length > 0 ? (
                <div className="space-y-3">
                  <div className="text-center mb-4">
                    <p className="text-5xl font-display text-brand-400">{attRate}%</p>
                    <p className="text-slate-400 text-sm mt-1">Overall Attendance Rate</p>
                  </div>
                  {attData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-3">
                      <span className="text-sm text-slate-300 w-20">{d.name}</span>
                      <div className="flex-1 h-2.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${(d.value / totalAtt) * 100}%`, background: COLORS[i] }} />
                      </div>
                      <span className="text-sm font-mono font-semibold text-white w-8 text-right">{d.value}</span>
                      <span className="text-xs text-slate-500 w-10 text-right">{((d.value / totalAtt) * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              ) : <EmptyChart />}
            </div>

            {/* Top Performers */}
            <div className="card p-6">
              <h2 className="font-display text-xl text-white mb-5 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-brand-400" /> Top Performers
              </h2>
              {topStudents.length > 0 ? (
                <div className="space-y-2">
                  {topStudents.map((s, i) => (
                    <div key={s.name} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/3 transition-colors">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i === 0 ? 'bg-yellow-500/20 text-yellow-300' : i === 1 ? 'bg-slate-400/20 text-slate-300' : i === 2 ? 'bg-orange-500/20 text-orange-300' : 'bg-white/5 text-slate-400'}`}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{s.name}</p>
                        <p className="text-xs text-slate-400">{s.class}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-base font-mono font-bold text-white">{s.average}</p>
                        <p className="text-xs text-slate-500">{s.marks.length} exams</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <EmptyChart />}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StudentDetailReport({ report }) {
  const { student, marks, attendance, report: r } = report;
  const GRADE_COLORS = { 'A+': 'text-emerald-400 bg-emerald-500/10', A: 'text-green-400 bg-green-500/10', B: 'text-blue-400 bg-blue-500/10', C: 'text-yellow-400 bg-yellow-500/10', D: 'text-orange-400 bg-orange-500/10', F: 'text-red-400 bg-red-500/10' };

  const subjectChartData = r.subjectAverages?.map(s => ({ subject: s.subject.slice(0, 10), average: +s.average })) || [];
  const recentMarks = marks?.slice(0, 10) || [];

  return (
    <div className="space-y-6">
      {/* Student Header */}
      <div className="card p-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center flex-shrink-0">
            <span className="font-display text-2xl text-brand-300">{student.studentName.charAt(0)}</span>
          </div>
          <div className="flex-1">
            <h2 className="font-display text-2xl text-white">{student.studentName}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="badge bg-brand-600/10 text-brand-400">{student.class}</span>
              <span className="badge bg-white/5 text-slate-300">{student.gender}</span>
              <span className="text-slate-400 text-sm">📍 {student.address}</span>
            </div>
          </div>
          <div className="hidden sm:grid grid-cols-3 gap-4 text-center">
            {[
              { label: 'Avg Score', value: `${r.overallAverage}%`, color: 'text-brand-400' },
              { label: 'Attendance', value: `${r.attendanceRate}%`, color: 'text-emerald-400' },
              { label: 'Exams', value: marks?.length || 0, color: 'text-cyan-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="px-4">
                <p className={`text-2xl font-display ${color}`}>{value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Subject Performance */}
        <div className="card p-6">
          <h3 className="font-display text-xl text-white mb-4">Subject Performance</h3>
          {subjectChartData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={subjectChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={({ active, payload, label }) => active && payload?.length ? (
                    <div className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm">
                      <p className="text-white font-semibold">{label}: {payload[0].value}%</p>
                    </div>
                  ) : null} />
                  <Bar dataKey="average" radius={[4, 4, 0, 0]} fill="#6366f1" maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {r.subjectAverages?.map(s => (
                  <div key={s.subject} className="flex items-center gap-3">
                    <span className="text-sm text-slate-300 flex-1 truncate">{s.subject}</span>
                    <div className="flex-1 h-1.5 bg-white/5 rounded-full max-w-32">
                      <div className="h-full bg-brand-500 rounded-full" style={{ width: `${s.average}%` }} />
                    </div>
                    <span className="text-sm font-mono text-white w-10 text-right font-semibold">{s.average}</span>
                  </div>
                ))}
              </div>
            </>
          ) : <EmptyChart />}
        </div>

        {/* Attendance Detail */}
        <div className="card p-6">
          <h3 className="font-display text-xl text-white mb-4">Attendance Detail</h3>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { label: 'Present', value: r.presentDays, color: 'text-emerald-400 bg-emerald-500/10' },
              { label: 'Absent', value: r.totalDays - r.presentDays, color: 'text-red-400 bg-red-500/10' },
              { label: 'Total Days', value: r.totalDays, color: 'text-slate-300 bg-white/5' },
              { label: 'Rate', value: `${r.attendanceRate}%`, color: 'text-brand-400 bg-brand-600/10' },
            ].map(({ label, value, color }) => (
              <div key={label} className={`rounded-xl p-3 ${color.split(' ')[1]}`}>
                <p className={`text-xl font-display ${color.split(' ')[0]}`}>{value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
          {/* Recent attendance */}
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {attendance?.slice(0, 15).map(a => (
              <div key={a._id} className="flex items-center justify-between text-sm py-1.5 border-b border-white/5 last:border-0">
                <span className="text-slate-400">{new Date(a.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                {a.subject && <span className="text-slate-500 text-xs">{a.subject}</span>}
                <span className={`badge text-xs ${a.status === 'Present' ? 'bg-emerald-500/10 text-emerald-400' : a.status === 'Absent' ? 'bg-red-500/10 text-red-400' : a.status === 'Late' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-blue-500/10 text-blue-400'}`}>
                  {a.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Marks Table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5">
          <h3 className="font-display text-xl text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-400" /> Full Marks Record
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-white/5">
              <tr>
                {['Subject', 'Marks', 'Grade', 'Exam Type', 'Term', 'Remarks', 'Date'].map(h => (
                  <th key={h} className="table-header text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {recentMarks.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-slate-500 text-sm">No marks recorded</td></tr>
              ) : recentMarks.map(m => {
                const gc = GRADE_COLORS[m.grade] || 'text-slate-400 bg-white/5';
                return (
                  <tr key={m._id} className="hover:bg-white/2 transition-colors">
                    <td className="table-cell font-semibold text-white">{m.subject}</td>
                    <td className="table-cell font-mono font-bold text-white">{m.marks}<span className="text-slate-500 text-xs">/{m.maxMarks}</span></td>
                    <td className="table-cell"><span className={`badge ${gc}`}>{m.grade}</span></td>
                    <td className="table-cell text-slate-400">{m.examType}</td>
                    <td className="table-cell text-slate-400">{m.term || '—'}</td>
                    <td className="table-cell text-slate-400 text-xs max-w-32 truncate">{m.remarks || '—'}</td>
                    <td className="table-cell text-slate-400 text-xs">{new Date(m.createdAt).toLocaleDateString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex items-center justify-center h-40 text-slate-500">
      <div className="text-center">
        <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-40" />
        <p className="text-sm">No data available</p>
      </div>
    </div>
  );
}
