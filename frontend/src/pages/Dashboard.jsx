import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

import {
  Users,
  UserCheck,
  BookOpen,
  TrendingUp,
  Award,
  ClipboardList,
  Calendar,
  ChevronRight,
  BarChart3,
  Shield,
} from 'lucide-react';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts';

const COLORS = ['#6366f1', '#ef4444', '#f59e0b', '#22d3ee'];

function StatCard({ icon: Icon, label, value, color, link }) {
  const colorMap = {
    brand: 'bg-brand-600/10 text-brand-400',
    blue: 'bg-blue-600/10 text-blue-400',
    cyan: 'bg-cyan-600/10 text-cyan-400',
    purple: 'bg-purple-600/10 text-purple-400',
    green: 'bg-green-600/10 text-green-400',
    red: 'bg-red-600/10 text-red-400',
    emerald: 'bg-emerald-600/10 text-emerald-400',
  };

  const content = (
    <div className="card p-5 flex items-start gap-4 hover:border-white/10 transition-all">
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
          colorMap[color] || colorMap.brand
        }`}
      >
        <Icon className="w-5 h-5" />
      </div>

      <div>
        <p className="text-slate-400 text-xs font-medium">{label}</p>
        <p className="text-2xl font-display text-white mt-0.5">
          {value}
        </p>
      </div>
    </div>
  );

  return link ? <Link to={link}>{content}</Link> : content;
}

function Dashboard() {
  const { user } = useAuth();

  const [stats, setStats] = useState({});
  const [recentMarks, setRecentMarks] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      if (user.role === 'administrator') {
        const [studentsRes, usersRes, coursesRes, marksRes] =
          await Promise.all([
            api.get('/students?limit=1'),
            api.get('/users'),
            api.get('/courses'),
            api.get('/marks'),
          ]);

        setStats({
          students: studentsRes.data.total || 0,
          users: usersRes.data.total || 0,
          courses: coursesRes.data.length || 0,
          teachers: (usersRes.data.users || []).filter(
            (u) => u.role === 'teacher'
          ).length,
        });

        setRecentMarks((marksRes.data || []).slice(0, 5));
      }

      else if (user.role === 'teacher') {
        const [studentsRes, coursesRes, marksRes] =
          await Promise.all([
            api.get('/students?limit=1'),
            api.get('/courses'),
            api.get('/marks'),
          ]);

        setStats({
          students: studentsRes.data.total || 0,
          courses: coursesRes.data.length || 0,
        });

        setRecentMarks((marksRes.data || []).slice(0, 5));
      }

      else if (user.role === 'student' && user.studentId) {
        const [marksRes, attendRes] = await Promise.all([
          api.get('/marks'),
          api.get(`/attendance/summary/${user.studentId}`),
        ]);

        setRecentMarks((marksRes.data || []).slice(0, 5));
        setAttendanceSummary(attendRes.data);
      }
    }

    catch (err) {
      console.error('Dashboard load error:', err);
    }

    finally {
      setLoading(false);
    }
  };

  const GRADE_COLOR = {
    'A+': 'text-emerald-400',
    A: 'text-green-400',
    B: 'text-blue-400',
    C: 'text-yellow-400',
    D: 'text-orange-400',
    F: 'text-red-400',
  };

  const greeting = () => {
    const h = new Date().getHours();

    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';

    return 'Good evening';
  };

  const attPieData = attendanceSummary
    ? [
        {
          name: 'Present',
          value: attendanceSummary.present,
        },
        {
          name: 'Absent',
          value: attendanceSummary.absent,
        },
        {
          name: 'Late',
          value: attendanceSummary.late,
        },
        {
          name: 'Excused',
          value: attendanceSummary.excused,
        },
      ].filter((d) => d.value > 0)
    : [];

  const quickActions =
    user?.role === 'administrator'
      ? [
          {
            label: 'Add Student',
            to: '/students',
            icon: Users,
          },
          {
            label: 'Manage Courses',
            to: '/courses',
            icon: BookOpen,
          },
          {
            label: 'View Reports',
            to: '/reports',
            icon: BarChart3,
          },
          {
            label: 'Manage Users',
            to: '/users',
            icon: Shield,
          },
        ]
      : [
          {
            label: 'Record Attendance',
            to: '/attendance',
            icon: ClipboardList,
          },
          {
            label: 'Add Marks',
            to: '/marks',
            icon: Award,
          },
          {
            label: 'View Students',
            to: '/students',
            icon: Users,
          },
          {
            label: 'View Reports',
            to: '/reports',
            icon: TrendingUp,
          },
        ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Greeting */}
      <div>
        <h1 className="font-display text-3xl text-white">
          {greeting()},{' '}
          <span className="text-brand-400">
            {user?.name?.split(' ')[0]}
          </span>
        </h1>

        <p className="text-slate-400 mt-1 text-sm">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* Admin Stats */}
      {user.role === 'administrator' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Users}
            label="Total Students"
            value={stats.students}
            color="brand"
            link="/students"
          />

          <StatCard
            icon={UserCheck}
            label="Teachers"
            value={stats.teachers}
            color="blue"
            link="/teachers"
          />

          <StatCard
            icon={BookOpen}
            label="Courses"
            value={stats.courses}
            color="cyan"
            link="/courses"
          />

          <StatCard
            icon={Shield}
            label="System Users"
            value={stats.users}
            color="purple"
            link="/users"
          />
        </div>
      )}

      {/* Teacher Stats */}
      {user.role === 'teacher' && (
        <div className="grid grid-cols-2 gap-4 max-w-lg">
          <StatCard
            icon={Users}
            label="Total Students"
            value={stats.students}
            color="brand"
            link="/students"
          />

          <StatCard
            icon={BookOpen}
            label="Courses"
            value={stats.courses}
            color="cyan"
            link="/courses"
          />
        </div>
      )}

      {/* Student Stats */}
      {user.role === 'student' && attendanceSummary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={ClipboardList}
            label="Total Days"
            value={attendanceSummary.total}
            color="brand"
          />

          <StatCard
            icon={UserCheck}
            label="Present"
            value={attendanceSummary.present}
            color="emerald"
          />

          <StatCard
            icon={Calendar}
            label="Absent"
            value={attendanceSummary.absent}
            color="red"
          />

          <StatCard
            icon={TrendingUp}
            label="Attendance Rate"
            value={`${attendanceSummary.rate}%`}
            color="cyan"
          />
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">

        {/* Recent Marks */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-xl text-white">
              {user.role === 'student'
                ? 'My Recent Marks'
                : 'Recent Marks'}
            </h2>

            <Link
              to="/marks"
              className="text-brand-400 hover:text-brand-300 text-sm flex items-center gap-1 transition-colors"
            >
              View all
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {recentMarks.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              <Award className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No marks recorded yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentMarks.map((m) => (
                <div
                  key={m._id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/5"
                >
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {m.subject}
                    </p>

                    <p className="text-xs text-slate-400 mt-0.5">
                      {m.studentId?.studentName} · {m.examType}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-bold text-white font-mono">
                      {m.marks}
                    </p>

                    <p
                      className={`text-xs font-semibold ${
                        GRADE_COLOR[m.grade] || 'text-slate-400'
                      }`}
                    >
                      {m.grade}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div className="card p-6">

          {user.role === 'student' && attPieData.length > 0 ? (
            <>
              <h2 className="font-display text-xl text-white mb-5">
                Attendance Overview
              </h2>

              <div className="flex items-center gap-6">
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie
                      data={attPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      dataKey="value"
                    >
                      {attPieData.map((_, i) => (
                        <Cell
                          key={i}
                          fill={COLORS[i]}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                <div className="space-y-2 flex-1">
                  {attPieData.map((d, i) => (
                    <div
                      key={d.name}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{
                            background: COLORS[i],
                          }}
                        />

                        <span className="text-sm text-slate-300">
                          {d.name}
                        </span>
                      </div>

                      <span className="text-sm font-semibold text-white">
                        {d.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <h2 className="font-display text-xl text-white mb-5">
                Quick Actions
              </h2>

              <div className="grid grid-cols-2 gap-3">
                {quickActions.map(
                  ({ label, to, icon: Icon }) => (
                    <Link
                      key={label}
                      to={to}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/3 border border-white/5 hover:bg-white/6 transition-all"
                    >
                      <div className="w-10 h-10 rounded-xl bg-brand-600/10 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-brand-400" />
                      </div>

                      <span className="text-xs text-slate-300 font-medium text-center">
                        {label}
                      </span>
                    </Link>
                  )
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;