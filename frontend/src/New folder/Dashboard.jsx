import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Users, Briefcase, Clock, Award, User, ArrowRight, TrendingUp, Wallet, Activity, Star, ChevronRight } from "lucide-react";
import API from "@/api";

const GOLD = '#B8975A';
const GOLD_LIGHT = '#D4B88C';

// Animated counter hook
function useCountUp(target, duration = 1200, delay = 0) {
    const [value, setValue] = useState(0);
    useEffect(() => {
        if (target === 0) return;
        const timer = setTimeout(() => {
            const start = Date.now();
            const tick = () => {
                const elapsed = Date.now() - start;
                const progress = Math.min(elapsed / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                setValue(Math.round(eased * target));
                if (progress < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
        }, delay);
        return () => clearTimeout(timer);
    }, [target, duration, delay]);
    return value;
}

const JourneyStage = ({ label, sub, index, active }) => (
    <div className={`flex flex-col items-center gap-2 transition-all duration-500 ${active ? 'opacity-100' : 'opacity-40'}`}
        style={{ animationDelay: `${index * 150}ms` }}>
        <div className="relative">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all duration-300`}
                style={active
                    ? { background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})`, borderColor: GOLD, color: '#000', boxShadow: `0 0 20px rgba(184,151,90,0.4)` }
                    : { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.4)' }
                }>
                {index + 1}
            </div>
            {active && <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ backgroundColor: GOLD }} />}
        </div>
        <div className="text-center">
            <p className={`text-xs font-black tracking-wide ${active ? 'text-white' : 'text-white/30'}`}>{label}</p>
            <p className="text-[10px] text-white/25 font-medium mt-0.5 hidden md:block">{sub}</p>
        </div>
    </div>
);

export default function Dashboard() {
    const navigate = useNavigate();
    const [data, setData] = useState({
        cohorts: 0, candidates: 0, events: 0,
        serviceProviders: 0, mentors: 0, payments: null
    });
    const [activities, setActivities] = useState([]);
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [greeting, setGreeting] = useState('');
    const [visible, setVisible] = useState(false);

    const cohortCount      = useCountUp(data.cohorts, 1000, 300);
    const candidateCount   = useCountUp(data.candidates, 1000, 450);
    const mentorCount      = useCountUp(data.mentors, 1000, 600);
    const eventCount       = useCountUp(data.events, 1000, 750);
    const providerCount    = useCountUp(data.serviceProviders, 1000, 900);

    useEffect(() => {
        const h = new Date().getHours();
        if (h < 12) setGreeting('Good Morning');
        else if (h < 17) setGreeting('Good Afternoon');
        else setGreeting('Good Evening');
    }, []);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [cohorts, candidates, events, providers, mentors, activities, allEvents] = await Promise.all([
                    API.get('/cohorts/count'),
                    API.get('/mentees/count'),
                    API.get('/events/count'),
                    API.get('/service-providers/count'),
                    API.get('/mentors/count'),
                    API.get('/activities?limit=8'),
                    API.get('/events'),
                ]);
                setData({
                    cohorts: cohorts.data.total || 0,
                    candidates: candidates.data.count || 0,
                    events: events.data.count || 0,
                    serviceProviders: providers.data.count || 0,
                    mentors: mentors.data.count || 0,
                });
                setActivities(activities.data.activities || []);
                const now = new Date();
                setUpcomingEvents(
                    (allEvents.data || [])
                        .filter(e => new Date(e.EventDate) >= now)
                        .sort((a,b) => new Date(a.EventDate) - new Date(b.EventDate))
                        .slice(0, 3)
                );
                try {
                    const pay = await API.get('/payments/summary');
                    setData(prev => ({ ...prev, payments: pay.data }));
                } catch {}
            } catch (e) { console.error(e); }
            finally { setLoading(false); setTimeout(() => setVisible(true), 100); }
        };
        fetchAll();
    }, []);

    const getActionColor = (type) => {
        if (type?.includes('created')) return { bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.25)', text: '#34d399', dot: '#34d399' };
        if (type?.includes('updated')) return { bg: 'rgba(184,151,90,0.12)', border: 'rgba(184,151,90,0.25)', text: GOLD, dot: GOLD };
        if (type?.includes('deleted')) return { bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.25)', text: '#f87171', dot: '#f87171' };
        return { bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)', text: '#9ca3af', dot: '#9ca3af' };
    };

    const formatTimeAgo = (date) => {
        const s = Math.floor((new Date() - new Date(date)) / 1000);
        if (s < 60) return 'Just now';
        if (s < 3600) return `${Math.floor(s/60)}m ago`;
        if (s < 86400) return `${Math.floor(s/3600)}h ago`;
        return `${Math.floor(s/86400)}d ago`;
    };

    const userData = JSON.parse(localStorage.getItem('userData') || '{}');

    const statCards = [
        { label: 'Candidates', value: candidateCount, sub: 'enrolled morans', icon: Users, path: '/admin/mentees', color: '#60a5fa' },
        { label: 'Cohorts', value: cohortCount, sub: 'active riika', icon: Award, path: '/admin/cohort', color: GOLD },
        { label: 'Mentors', value: mentorCount, sub: 'program guides', icon: Star, path: '/admin/mentors', color: '#a78bfa' },
        { label: 'Events', value: eventCount, sub: 'ceremonies', icon: Calendar, path: '/admin/events', color: '#34d399' },
        { label: 'Providers', value: providerCount, sub: 'service vendors', icon: Briefcase, path: '/admin/service-providers', color: '#fb923c' },
    ];

    const journeyStages = [
        { label: 'Ithemba', sub: 'Foundation' },
        { label: 'Junior Moran', sub: 'Leadership' },
        { label: 'Cut-to-ID', sub: 'Transition' },
        { label: 'Alumni', sub: 'Continued' },
    ];

    if (loading) return (
        <div className="py-8 space-y-6 animate-pulse">
            <div className="h-40 rounded-3xl bg-stone-200" />
            <div className="grid grid-cols-5 gap-4">
                {[1,2,3,4,5].map(i => <div key={i} className="h-28 rounded-3xl bg-stone-200" />)}
            </div>
            <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 h-96 rounded-3xl bg-stone-200" />
                <div className="h-96 rounded-3xl bg-stone-200" />
            </div>
        </div>
    );

    return (
        <div className={`py-2 space-y-6 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>

            {/* ── Hero greeting banner ───────────────────────────────────── */}
            <div className="relative rounded-3xl overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #0A0A0A 0%, #1a1208 50%, #0A0A0A 100%)', minHeight: '180px' }}>

                {/* Diamond pattern */}
                <div className="absolute inset-0 opacity-[0.04]"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 0l20 20-20 20L0 20z' fill='%23B8975A'/%3E%3C/svg%3E")` }} />

                {/* Glow blobs */}
                <div className="absolute top-0 right-0 w-80 h-80 rounded-full blur-[100px] opacity-20 pointer-events-none"
                    style={{ backgroundColor: GOLD }} />
                <div className="absolute bottom-0 left-0 w-60 h-60 rounded-full blur-[80px] opacity-10 pointer-events-none"
                    style={{ backgroundColor: GOLD_LIGHT }} />

                <div className="relative z-10 px-10 py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div>
                        <p className="text-xs font-black tracking-[0.3em] uppercase mb-2" style={{ color: GOLD }}>
                            {greeting}
                        </p>
                        <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-white leading-tight">
                            {userData?.name || 'Administrator'}
                        </h1>
                        <p className="text-white/40 font-medium mt-2 text-sm">
                            Dhahabu Themanini · Digital Management & Impact Portal
                        </p>

                        {/* Quick stats pill row */}
                        <div className="flex flex-wrap gap-3 mt-5">
                            {[
                                { val: data.candidates, label: 'Morans' },
                                { val: data.cohorts, label: 'Cohorts' },
                                { val: upcomingEvents.length, label: 'Upcoming Events' },
                            ].map((s, i) => (
                                <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                                    style={{ backgroundColor: 'rgba(184,151,90,0.12)', border: '1px solid rgba(184,151,90,0.2)' }}>
                                    <span className="text-sm font-black" style={{ color: GOLD }}>{s.val}</span>
                                    <span className="text-xs font-semibold text-white/50">{s.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Journey timeline */}
                    <div className="flex-shrink-0 hidden lg:block">
                        <p className="text-[10px] font-black tracking-[0.2em] uppercase text-white/30 text-center mb-4">The Moran Journey</p>
                        <div className="flex items-start gap-1">
                            {journeyStages.map((stage, i) => (
                                <React.Fragment key={i}>
                                    <JourneyStage {...stage} index={i} active={true} />
                                    {i < journeyStages.length - 1 && (
                                        <div className="w-10 h-px mt-5 flex-shrink-0"
                                            style={{ background: `linear-gradient(to right, ${GOLD}, rgba(184,151,90,0.2))` }} />
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Stat cards ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {statCards.map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <button key={i} onClick={() => navigate(stat.path)}
                            className="bg-white rounded-3xl p-5 border border-stone-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden text-left"
                            style={{ animationDelay: `${i * 100}ms` }}>
                            <div className="absolute top-0 left-0 w-full h-0.5 rounded-t-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                style={{ background: `linear-gradient(to right, ${stat.color}, transparent)` }} />
                            <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 duration-300"
                                style={{ backgroundColor: `${stat.color}18` }}>
                                <Icon className="w-5 h-5" style={{ color: stat.color }} />
                            </div>
                            <p className="text-3xl font-black text-stone-900 tracking-tight">{stat.value}</p>
                            <p className="text-sm font-black text-stone-600 mt-0.5">{stat.label}</p>
                            <p className="text-xs text-stone-300 font-medium mt-0.5">{stat.sub}</p>
                            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-1 group-hover:translate-x-0">
                                <ChevronRight className="w-4 h-4" style={{ color: stat.color }} />
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* ── Payment summary (if exists) ────────────────────────────── */}
            {data.payments && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Expected', value: `KSh ${Number(data.payments.totalExpected||0).toLocaleString()}`, color: GOLD },
                        { label: 'Collected', value: `KSh ${Number(data.payments.totalCollected||0).toLocaleString()}`, color: '#34d399' },
                        { label: 'Outstanding', value: `KSh ${Number(data.payments.totalBalance||0).toLocaleString()}`, color: '#f87171' },
                        { label: 'Collection Rate', value: `${data.payments.collectionRate||0}%`, color: '#60a5fa' },
                    ].map((s, i) => (
                        <button key={i} onClick={() => navigate('/admin/payments')}
                            className="bg-white rounded-3xl p-5 border border-stone-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 text-left group">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-[10px] font-black tracking-widest uppercase text-stone-400">{s.label}</p>
                                <Wallet className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: s.color }} />
                            </div>
                            <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
                        </button>
                    ))}
                </div>
            )}

            {/* ── Main content grid ──────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* Activity feed */}
                <div className="lg:col-span-2 bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
                    <div className="px-7 py-5 flex items-center justify-between"
                        style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-2xl flex items-center justify-center"
                                style={{ background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})` }}>
                                <Activity className="w-4 h-4 text-black" />
                            </div>
                            <div>
                                <h2 className="text-base font-black text-stone-900">Recent Activities</h2>
                                <p className="text-xs text-stone-400 font-medium">Latest updates from your program</p>
                            </div>
                        </div>
                        <span className="text-xs font-black px-2.5 py-1 rounded-full"
                            style={{ backgroundColor: 'rgba(184,151,90,0.1)', color: GOLD }}>
                            {activities.length} activities
                        </span>
                    </div>

                    <div className="divide-y divide-stone-50 max-h-[420px] overflow-y-auto">
                        {activities.length === 0 ? (
                            <div className="py-16 text-center">
                                <div className="w-14 h-14 rounded-3xl mx-auto mb-4 flex items-center justify-center"
                                    style={{ backgroundColor: 'rgba(184,151,90,0.08)' }}>
                                    <Clock className="w-7 h-7" style={{ color: GOLD }} />
                                </div>
                                <p className="font-black text-stone-400 text-sm">No activities yet</p>
                            </div>
                        ) : activities.map((activity, i) => {
                            const colors = getActionColor(activity.type);
                            return (
                                <div key={activity._id}
                                    className="px-7 py-4 hover:bg-stone-50/80 transition-colors duration-150 flex items-start gap-4 group">
                                    {/* Dot timeline */}
                                    <div className="flex flex-col items-center flex-shrink-0 pt-1">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.dot }} />
                                        {i < activities.length - 1 && <div className="w-px flex-1 mt-1 min-h-[24px]" style={{ backgroundColor: 'rgba(0,0,0,0.06)' }} />}
                                    </div>
                                    <div className="flex-1 min-w-0 pb-1">
                                        <p className="text-sm font-semibold text-stone-800 leading-snug">{activity.description}</p>
                                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                            <span className="text-[10px] px-2 py-0.5 rounded-full font-black border"
                                                style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}>
                                                {activity.type.replace(/_/g, ' ').toUpperCase()}
                                            </span>
                                            <span className="text-xs text-stone-400">{formatTimeAgo(activity.createdAt)}</span>
                                            {activity.user && activity.user !== 'System' && (
                                                <span className="text-xs text-stone-400 flex items-center gap-1">
                                                    <User className="w-3 h-3" />{activity.user}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right column */}
                <div className="space-y-5">

                    {/* Upcoming events */}
                    <div className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 flex items-center justify-between"
                            style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                                    style={{ backgroundColor: 'rgba(52,211,153,0.1)' }}>
                                    <Calendar className="w-4 h-4 text-emerald-400" />
                                </div>
                                <h3 className="text-sm font-black text-stone-900">Upcoming Events</h3>
                            </div>
                            <button onClick={() => navigate('/admin/events')}
                                className="text-xs font-black flex items-center gap-1 hover:gap-2 transition-all"
                                style={{ color: GOLD }}>
                                All <ArrowRight className="w-3 h-3" />
                            </button>
                        </div>
                        <div className="p-4 space-y-2">
                            {upcomingEvents.length === 0 ? (
                                <p className="text-xs text-stone-400 text-center py-4 font-medium">No upcoming events</p>
                            ) : upcomingEvents.map(e => {
                                const d = new Date(e.EventDate);
                                return (
                                    <div key={e._id} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-stone-50 transition-colors group">
                                        <div className="w-10 h-10 rounded-xl flex flex-col items-center justify-center flex-shrink-0 text-center"
                                            style={{ background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})` }}>
                                            <span className="text-[10px] font-black text-black/60 uppercase leading-none">
                                                {d.toLocaleString('en', { month: 'short' })}
                                            </span>
                                            <span className="text-base font-black text-black leading-tight">{d.getDate()}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-black text-stone-900 truncate">{e.EventType}</p>
                                            <p className="text-xs text-stone-400 font-medium">
                                                {d.toLocaleDateString('en-KE', { weekday: 'short', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Quick actions */}
                    <div className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                            <h3 className="text-sm font-black text-stone-900">Quick Actions</h3>
                        </div>
                        <div className="p-4 space-y-2">
                            {[
                                { label: 'Add New Candidate', path: '/admin/mentees', color: '#60a5fa' },
                                { label: 'Record Payment', path: '/admin/payments', color: '#34d399' },
                                { label: 'Schedule Event', path: '/admin/events', color: GOLD },
                                { label: 'Add Cohort', path: '/admin/cohort', color: '#a78bfa' },
                            ].map((a, i) => (
                                <button key={i} onClick={() => navigate(a.path)}
                                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-2xl hover:bg-stone-50 transition-colors group text-left">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: a.color }} />
                                        <span className="text-sm font-semibold text-stone-700">{a.label}</span>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-stone-500 group-hover:translate-x-0.5 transition-all" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Program quote */}
                    <div className="rounded-3xl p-6 relative overflow-hidden"
                        style={{ background: 'linear-gradient(135deg, #0A0A0A, #1a1208)' }}>
                        <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-[60px] opacity-20" style={{ backgroundColor: GOLD }} />
                        <p className="text-xs font-black tracking-[0.2em] uppercase mb-3" style={{ color: GOLD }}>Program Vision</p>
                        <p className="text-white/80 text-sm font-medium leading-relaxed italic relative z-10">
                            "The wealth of the community is found in its children."
                        </p>
                        <p className="text-white/25 text-xs font-semibold mt-3">— Dhahabu Themanini</p>
                    </div>
                </div>
            </div>
        </div>
    );
}