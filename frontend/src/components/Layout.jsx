import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  GraduationCap, LayoutDashboard, Users, UserCheck, BookOpen,
  ClipboardList, BarChart3, User, LogOut, ChevronRight, Menu, X, Award
} from 'lucide-react';

const navByRole = {
  administrator: [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/students', icon: Users, label: 'Students' },
    { to: '/teachers', icon: UserCheck, label: 'Teachers' },
    { to: '/users', icon: User, label: 'Users' },
    { to: '/courses', icon: BookOpen, label: 'Courses' },
    { to: '/marks', icon: Award, label: 'Marks' },
    { to: '/attendance', icon: ClipboardList, label: 'Attendance' },
    { to: '/reports', icon: BarChart3, label: 'Reports' },
    { to: '/profile', icon: User, label: 'Profile' },
  ],
  teacher: [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/students', icon: Users, label: 'Students' },
    { to: '/attendance', icon: ClipboardList, label: 'Attendance' },
    { to: '/marks', icon: Award, label: 'Marks' },
    { to: '/courses', icon: BookOpen, label: 'Courses' },
    { to: '/reports', icon: BarChart3, label: 'Reports' },
    { to: '/profile', icon: User, label: 'Profile' },
  ],
  student: [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/marks', icon: Award, label: 'My Marks' },
    { to: '/attendance', icon: ClipboardList, label: 'My Attendance' },
    { to: '/courses', icon: BookOpen, label: 'Courses' },
    { to: '/profile', icon: User, label: 'Profile' },
  ],
};

const roleColors = {
  administrator: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  teacher: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  student: 'bg-green-500/20 text-green-300 border-green-500/30',
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = navByRole[user?.role] || [];

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <h1 className="font-display text-xl text-white leading-none">EduSync</h1>
            <p className="text-xs text-slate-500 mt-0.5">Management System</p>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="p-4 mx-3 mt-4 rounded-xl bg-white/3 border border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-brand-600/30 border border-brand-500/30 flex items-center justify-center flex-shrink-0">
            <span className="text-brand-300 font-semibold text-sm">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
            <span className={`badge text-xs border ${roleColors[user?.role]}`}>
              {user?.role}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to + label}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-white/5">
        <button
          onClick={handleLogout}
          className="nav-item w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen mesh-bg flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 flex-col flex-shrink-0 bg-slate-950/80 border-r border-white/5">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-60 bg-slate-950 border-r border-white/5 flex flex-col">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center gap-4 px-4 py-3 border-b border-white/5 bg-slate-950/80">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-400 hover:text-white">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-brand-400" />
            <span className="font-display text-lg text-white">EduSync</span>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
