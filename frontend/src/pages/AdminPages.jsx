import React, { useState, useEffect } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarProvider,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter
} from "@/components/ui/sidebar";
import { useNavigate, Routes, Route, useLocation } from "react-router-dom";
import Dashboard from "./Dashboard";
import Mentees from "./Mentees";
import Mentors from "./Mentor";
import Cohort from "./Cohort";
import ServiceProviders from "./ServiceProviders";
import Events from "./Events";
import Parents from "./Parents";
import logo from '../logo/logo.png';
import API from '@/api';

import {
  LayoutDashboard,
  Users,
  Calendar,
  Building,
  LogOut,
  UserCircle,
  Heart,
  Bell,
  Search,
  Award
} from "lucide-react";

export default function AdminPages() {
  const navigate = useNavigate();
  const location = useLocation();
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get('token');
      if (urlToken) {
        localStorage.setItem('token', urlToken);
        window.history.replaceState({}, document.title, '/admin/dashboard');
      }
      const token = localStorage.getItem('token');
      if (!token) { setIsLoading(false); navigate('/login', { replace: true }); return; }
      const storedUserData = localStorage.getItem('userData');
      if (storedUserData) { setUserData(JSON.parse(storedUserData)); setIsLoading(false); return; }
      try {
        const response = await API.get('/auth/me');
        localStorage.setItem('userData', JSON.stringify(response.data));
        setUserData(response.data);
        setIsLoading(false);
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        setIsLoading(false);
        navigate('/login', { replace: true });
      }
    };
    initializeAuth();
  }, []);

  const menuItems = [
    { label: "Overview", icon: LayoutDashboard, path: "dashboard" },
    { label: "Candidate Mentees", icon: Users, path: "mentees" },
    { label: "Parents", icon: Heart, path: "parents" },
    { label: "Mentors", icon: UserCircle, path: "mentors" },
    { label: "Cohorts", icon: Users, path: "cohort" },
    { label: "Service Providers", icon: Building, path: "service-providers" },
    { label: "Calendar & Events", icon: Calendar, path: "events" }
  ];

  useEffect(() => {
    if (location.pathname === "/admin" || location.pathname === "/admin/") {
      navigate("/admin/dashboard");
    }
  }, [location.pathname, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userData");
    navigate("/login");
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#0A0A0A]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-14 h-14">
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#B8975A] animate-spin" />
            <div className="absolute inset-2 rounded-full border border-[#B8975A]/20" />
          </div>
          <p className="text-[#B8975A] font-black tracking-[0.3em] uppercase text-xs">Loading System</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-screen bg-[#F7F5F2] overflow-hidden font-sans">

        {/* Sidebar — deep black with gold accents */}
        <Sidebar className="w-72 border-r-0 shadow-2xl relative z-20"
          style={{ backgroundColor: '#0A0A0A', borderRight: '1px solid rgba(184,151,90,0.12)' }}>

          {/* Diamond pattern overlay */}
          <div className="absolute inset-0 opacity-[0.025] pointer-events-none"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 0l20 20-20 20L0 20z' fill='%23B8975A' fill-rule='evenodd'/%3E%3C/svg%3E")` }} />
          {/* Glow blob */}
          <div className="absolute top-0 left-0 w-full h-48 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(184,151,90,0.15) 0%, transparent 70%)' }} />

          <SidebarHeader className="px-8 pt-10 pb-8 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #B8975A, #D4B88C)' }}>
                <img src={logo} alt="Logo" className="h-7 w-7 object-contain brightness-0" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tighter text-white leading-none">DHAHABU</h1>
                <p className="text-[10px] font-black tracking-[0.25em] uppercase mt-0.5" style={{ color: '#B8975A' }}>Management</p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="px-4 relative z-10">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {menuItems.map((item) => {
                    const IconComponent = item.icon;
                    const isActive = location.pathname === `/admin/${item.path}`;
                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton
                          onClick={() => navigate(`/admin/${item.path}`)}
                          className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 relative group ${isActive ? '' : 'hover:bg-white/5'}`}
                          style={isActive ? {
                            background: 'linear-gradient(135deg, rgba(184,151,90,0.15), rgba(184,151,90,0.08))',
                            border: '1px solid rgba(184,151,90,0.25)'
                          } : {}}
                        >
                          <IconComponent
                            className="w-4 h-4 flex-shrink-0 transition-colors duration-300"
                            style={{ color: isActive ? '#B8975A' : 'rgba(255,255,255,0.35)' }}
                            strokeWidth={1.5}
                          />
                          <span className="text-sm font-bold tracking-tight transition-colors duration-300"
                            style={{ color: isActive ? '#fff' : 'rgba(255,255,255,0.4)' }}>
                            {item.label}
                          </span>
                          {isActive && (
                            <div className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: '#B8975A', boxShadow: '0 0 8px rgba(184,151,90,0.6)' }} />
                          )}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="p-6 relative z-10">
            <div className="h-px mb-6" style={{ background: 'linear-gradient(to right, transparent, rgba(184,151,90,0.2), transparent)' }} />
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group hover:bg-red-950/30"
              style={{ border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <LogOut className="w-4 h-4 text-white/25 group-hover:text-red-400 transition-colors" />
              <span className="text-xs font-black tracking-[0.15em] uppercase text-white/25 group-hover:text-red-400 transition-colors">Logout</span>
            </button>
          </SidebarFooter>
        </Sidebar>

        {/* Main content */}
        <div className="flex-1 flex flex-col relative z-10 h-screen overflow-hidden bg-[#F7F5F2]">
          {/* Subtle warm tint blobs */}
          <div className="fixed top-[-10%] right-[-5%] w-[40vw] h-[40vw] blur-[120px] opacity-30 rounded-full pointer-events-none"
            style={{ backgroundColor: '#EDE8DF' }} />

          {/* Header */}
          <header className="h-24 px-10 flex items-center justify-between shrink-0 relative z-10"
            style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
            <div>
              <h2 className="text-2xl font-black tracking-tighter text-stone-900">Administrator Console</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Portal v2.4.0 • Active</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="hidden xl:flex items-center gap-3 px-5 py-2.5 rounded-2xl border border-stone-200 bg-white shadow-sm">
                <Search className="w-4 h-4 text-stone-400" />
                <input type="text" placeholder="Quick search..." className="bg-transparent text-sm font-medium outline-none w-36 text-stone-700 placeholder:text-stone-400" />
                <div className="px-1.5 py-0.5 rounded border border-stone-100 bg-stone-50 text-[10px] font-black text-stone-400">⌘K</div>
              </div>

              {/* Bell */}
              <div className="relative">
                <div className="absolute top-0.5 right-0.5 w-2 h-2 bg-[#B8975A] rounded-full border-2 border-[#F7F5F2] z-10" />
                <button className="p-3 bg-white rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-all">
                  <Bell className="w-4 h-4 text-stone-600" />
                </button>
              </div>

              <div className="w-px h-8 bg-stone-200" />

              {/* User */}
              <div className="flex items-center gap-3">
                <div className="text-right hidden md:block">
                  <p className="text-sm font-black text-stone-900 leading-none">{userData?.name || "Admin"}</p>
                  <p className="text-[10px] font-black uppercase tracking-[0.15em] mt-0.5" style={{ color: '#B8975A' }}>Dhahabu HQ</p>
                </div>
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-black font-black text-base shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #B8975A, #D4B88C)' }}>
                  {userData?.name?.charAt(0) || "A"}
                </div>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto px-10 py-8">
            <div className="max-w-[1600px] mx-auto">
              <Routes>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="mentees" element={<Mentees />} />
                <Route path="parents" element={<Parents />} />
                <Route path="mentors" element={<Mentors />} />
                <Route path="cohort" element={<Cohort />} />
                <Route path="service-providers" element={<ServiceProviders />} />
                <Route path="events" element={<Events />} />
                <Route path="*" element={<Dashboard />} />
              </Routes>
            </div>
          </main>
        </div>

        <style>{`
          ::-webkit-scrollbar { width: 5px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: rgba(184,151,90,0.2); border-radius: 10px; }
          ::-webkit-scrollbar-thumb:hover { background: rgba(184,151,90,0.4); }
        `}</style>
      </div>
    </SidebarProvider>
  );
}