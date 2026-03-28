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
import Payments from "./Payments";
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
  Award,
  X,
  UserPlus,
  UserMinus,
  RefreshCw,
  Trash2,
  GraduationCap,
  ChevronRight,
  Wallet
} from "lucide-react";

export default function AdminPages() {
  const navigate = useNavigate();
  const location = useLocation();
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState({ mentees: [], cohorts: [] });
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [activities, setActivities] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastSeenAt] = useState(() => localStorage.getItem('lastSeenNotif') || null);

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

  // ── Global search ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!searchTerm.trim()) { setSearchResults({ mentees: [], cohorts: [] }); setSearchOpen(false); return; }
    const timeout = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const [menteesRes, cohortsRes] = await Promise.all([
          API.get('/mentees'),
          API.get('/cohorts'),
        ]);
        const term = searchTerm.toLowerCase();
        const mentees = menteesRes.data.filter(m =>
          m.name?.toLowerCase().includes(term) ||
          m.admissionNumber?.toLowerCase().includes(term) ||
          m.school?.toLowerCase().includes(term)
        ).slice(0, 5);
        const cohorts = cohortsRes.data.filter(c =>
          c.riika?.toLowerCase().includes(term) ||
          c.year?.toString().includes(term) ||
          c.residence?.toLowerCase().includes(term)
        ).slice(0, 4);
        setSearchResults({ mentees, cohorts });
        setSearchOpen(true);
      } catch (e) { console.error(e); }
      finally { setSearchLoading(false); }
    }, 350);
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  const fetchNotifications = async () => {
    setNotifLoading(true);
    try {
      const [activitiesRes, eventsRes] = await Promise.all([
        API.get('/activities?limit=15'),
        API.get('/events'),
      ]);
      const acts = activitiesRes.data.activities || [];
      setActivities(acts);
      const now = new Date();
      const upcoming = eventsRes.data
        .filter(e => new Date(e.EventDate) >= now)
        .sort((a, b) => new Date(a.EventDate) - new Date(b.EventDate))
        .slice(0, 5);
      setUpcomingEvents(upcoming);
      // Count activities since last seen
      const unseen = lastSeenAt
        ? acts.filter(a => new Date(a.createdAt) > new Date(lastSeenAt)).length
        : Math.min(acts.length, 9);
      setUnreadCount(unseen);
    } catch (e) { console.error(e); }
    finally { setNotifLoading(false); }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const handleOpenNotif = () => {
    setNotifOpen(v => !v);
    setSearchOpen(false);
    if (!notifOpen) {
      const now = new Date().toISOString();
      localStorage.setItem('lastSeenNotif', now);
      setUnreadCount(0);
    }
  };

  const getActivityIcon = (type) => {
    if (type?.includes('created')) return UserPlus;
    if (type?.includes('deleted')) return Trash2;
    if (type?.includes('updated')) return RefreshCw;
    return RefreshCw;
  };

  const getActivityColor = (type) => {
    if (type?.includes('created')) return { color: '#34d399', bg: 'rgba(52,211,153,0.1)' };
    if (type?.includes('deleted')) return { color: '#f87171', bg: 'rgba(248,113,113,0.1)' };
    return { color: '#B8975A', bg: 'rgba(184,151,90,0.1)' };
  };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const GOLD = '#B8975A';

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest('[data-search]') && !e.target.closest('[data-notif]')) {
        setSearchOpen(false);
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const menuItems = [
    { label: "Overview", icon: LayoutDashboard, path: "dashboard" },
    { label: "Candidate Mentees", icon: Users, path: "mentees" },
    { label: "Parents", icon: Heart, path: "parents" },
    { label: "Mentors", icon: UserCircle, path: "mentors" },
    { label: "Cohorts", icon: Users, path: "cohort" },
    { label: "Service Providers", icon: Building, path: "service-providers" },
    { label: "Calendar & Events", icon: Calendar, path: "events" },
    { label: "Payments", icon: Wallet, path: "payments" }
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
              <h2 className="text-2xl font-black tracking-tighter text-stone-900">Administrator</h2>
              <div className="flex items-center gap-2 mt-0.5">
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Global Search */}
              <div className="hidden xl:block relative" data-search>
                <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl border border-stone-200 bg-white shadow-sm">
                  <Search className="w-4 h-4 text-stone-400 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Search mentees, cohorts..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    onFocus={() => searchResults.mentees.length || searchResults.cohorts.length ? setSearchOpen(true) : null}
                    className="bg-transparent text-sm font-medium outline-none w-48 text-stone-700 placeholder:text-stone-400"
                  />
                  {searchTerm
                    ? <button onClick={() => { setSearchTerm(''); setSearchOpen(false); }} className="p-0.5 rounded-full hover:bg-stone-100"><X className="w-3.5 h-3.5 text-stone-400" /></button>
                    : <div className="px-1.5 py-0.5 rounded border border-stone-100 bg-stone-50 text-[10px] font-black text-stone-400">⌘K</div>
                  }
                </div>

                {/* Search dropdown */}
                {searchOpen && (searchResults.mentees.length > 0 || searchResults.cohorts.length > 0 || searchLoading) && (
                  <div className="absolute top-full mt-2 left-0 w-[420px] bg-white rounded-3xl border border-stone-100 shadow-2xl z-50 overflow-hidden">
                    <div className="h-0.5 w-full" style={{ background: `linear-gradient(to right, ${GOLD}, #D4B88C)` }} />
                    {searchLoading ? (
                      <div className="p-6 text-center text-xs text-stone-400 font-semibold">Searching...</div>
                    ) : (
                      <div className="p-3 max-h-[480px] overflow-y-auto">
                        {searchResults.mentees.length > 0 && (
                          <div className="mb-3">
                            <p className="text-[10px] font-black tracking-widest uppercase text-stone-400 px-2 mb-2">Candidates</p>
                            {searchResults.mentees.map(m => (
                              <button key={m._id}
                                onClick={() => { navigate('/admin/mentees'); setSearchOpen(false); setSearchTerm(''); }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-amber-50 transition-colors text-left group">
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-sm text-black"
                                  style={{ background: `linear-gradient(135deg, ${GOLD}, #D4B88C)` }}>
                                  {m.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-black text-stone-900 text-sm truncate">{m.name}</p>
                                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                    {m.admissionNumber && (
                                      <span className="text-[10px] font-mono font-semibold text-stone-400">{m.admissionNumber}</span>
                                    )}
                                    {m.schoolSystem && (
                                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(184,151,90,0.1)', color: GOLD }}>{m.schoolSystem}</span>
                                    )}
                                    {m.grade && <span className="text-[10px] text-stone-400 font-semibold">Gr. {m.grade}</span>}
                                    {m.school && <span className="text-[10px] text-stone-400 font-semibold truncate">{m.school}</span>}
                                  </div>
                                </div>
                                <ChevronRight className="w-3.5 h-3.5 text-stone-300 group-hover:text-stone-400 flex-shrink-0" />
                              </button>
                            ))}
                          </div>
                        )}
                        {searchResults.cohorts.length > 0 && (
                          <div>
                            <p className="text-[10px] font-black tracking-widest uppercase text-stone-400 px-2 mb-2">Cohorts</p>
                            {searchResults.cohorts.map(c => (
                              <button key={c._id}
                                onClick={() => { navigate('/admin/cohort'); setSearchOpen(false); setSearchTerm(''); }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-amber-50 transition-colors text-left group">
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                                  style={{ backgroundColor: 'rgba(184,151,90,0.1)' }}>
                                  <GraduationCap className="w-4 h-4" style={{ color: GOLD }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-black text-stone-900 text-sm">{c.riika}</p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(184,151,90,0.1)', color: GOLD }}>{c.year}</span>
                                    {c.residence && <span className="text-[10px] text-stone-400 font-semibold">{c.residence}</span>}
                                  </div>
                                </div>
                                <ChevronRight className="w-3.5 h-3.5 text-stone-300 group-hover:text-stone-400 flex-shrink-0" />
                              </button>
                            ))}
                          </div>
                        )}
                        {searchResults.mentees.length === 0 && searchResults.cohorts.length === 0 && (
                          <div className="p-6 text-center">
                            <p className="text-sm font-black text-stone-400">No results for "{searchTerm}"</p>
                            <p className="text-xs text-stone-300 mt-1">Try a different name or admission number</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Bell + Notifications Panel */}
              <div className="relative" data-notif>
                {unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-black text-white z-10 px-1"
                    style={{ backgroundColor: GOLD, boxShadow: '0 0 8px rgba(184,151,90,0.5)' }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </div>
                )}
                <button onClick={handleOpenNotif}
                  className="p-3 rounded-2xl shadow-md hover:shadow-lg transition-all relative"
                  style={notifOpen
                    ? { background: 'linear-gradient(135deg, #B8975A, #D4B88C)', border: 'none' }
                    : { background: 'linear-gradient(135deg, #1a1a1a, #2a2a2a)', border: '1px solid rgba(184,151,90,0.3)' }
                  }>
                  <Bell className="w-4 h-4" style={{ color: notifOpen ? '#000' : '#B8975A' }} />
                </button>

                {/* Notifications panel */}
                {notifOpen && (
                  <div className="absolute top-full mt-2 right-0 w-[380px] bg-white rounded-3xl border border-stone-100 shadow-2xl z-50 overflow-hidden flex flex-col" style={{ maxHeight: '520px' }}>
                    <div className="h-0.5 w-full flex-shrink-0" style={{ background: `linear-gradient(to right, ${GOLD}, #D4B88C)` }} />
                    <div className="p-5 pb-3 flex items-center justify-between flex-shrink-0" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                      <div>
                        <h3 className="font-black text-stone-900 text-sm">Notifications</h3>
                        <p className="text-[10px] text-stone-400 font-semibold mt-0.5">Recent activity & upcoming events</p>
                      </div>
                      <button onClick={() => setNotifOpen(false)} className="p-1.5 rounded-xl hover:bg-stone-100 transition-colors">
                        <X className="w-3.5 h-3.5 text-stone-400" />
                      </button>
                    </div>

                    <div className="overflow-y-auto flex-1 min-h-0">
                      {notifLoading ? (
                        <div className="p-8 text-center text-xs text-stone-400 font-semibold">Loading...</div>
                      ) : (
                        <>
                          {/* Upcoming Events */}
                          {upcomingEvents.length > 0 && (
                            <div className="p-4 pb-2">
                              <p className="text-[10px] font-black tracking-widest uppercase text-stone-400 mb-3">Upcoming Events</p>
                              <div className="space-y-2">
                                {upcomingEvents.map(e => (
                                  <div key={e._id} className="flex items-center gap-3 p-3 rounded-2xl"
                                    style={{ backgroundColor: 'rgba(184,151,90,0.06)', border: '1px solid rgba(184,151,90,0.12)' }}>
                                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                                      style={{ backgroundColor: 'rgba(184,151,90,0.15)' }}>
                                      <Calendar className="w-3.5 h-3.5" style={{ color: GOLD }} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-black text-stone-900 truncate">{e.EventType}</p>
                                      <p className="text-[10px] font-semibold text-stone-400 mt-0.5">
                                        {new Date(e.EventDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Recent Activity */}
                          {activities.length > 0 && (
                            <div className="p-4 pt-2">
                              <p className="text-[10px] font-black tracking-widest uppercase text-stone-400 mb-3">Recent Activity</p>
                              <div className="space-y-1">
                                {activities.map(a => {
                                  const Icon = getActivityIcon(a.type);
                                  const { color, bg } = getActivityColor(a.type);
                                  return (
                                    <div key={a._id} className="flex items-start gap-3 px-3 py-2.5 rounded-2xl hover:bg-stone-50 transition-colors">
                                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                                        style={{ backgroundColor: bg }}>
                                        <Icon className="w-3.5 h-3.5" style={{ color }} />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-stone-700 leading-snug">{a.description}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                          <span className="text-[10px] text-stone-400">{timeAgo(a.createdAt)}</span>
                                          {a.user && a.user !== 'System' && (
                                            <span className="text-[10px] font-semibold" style={{ color: GOLD }}>· {a.user}</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {activities.length === 0 && upcomingEvents.length === 0 && (
                            <div className="p-8 text-center">
                              <Bell className="w-8 h-8 mx-auto mb-3 text-stone-200" />
                              <p className="text-sm font-black text-stone-400">No notifications yet</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    <div className="p-3 flex-shrink-0" style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                      <button onClick={() => { navigate('/admin/dashboard'); setNotifOpen(false); }}
                        className="w-full py-2.5 rounded-2xl text-xs font-black transition-all hover:opacity-90 text-black"
                        style={{ background: `linear-gradient(135deg, ${GOLD}, #D4B88C)` }}>
                        View All Activity
                      </button>
                    </div>
                  </div>
                )}
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
                <Route path="payments" element={<Payments />} />
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