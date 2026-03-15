import React, { useState, useEffect } from "react";
import { Card, CardTitle, CardContent, CardDescription, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, Users, Briefcase, Clock, Award, User } from "lucide-react";
import API from "@/api";

// Brand gold
const GOLD = '#B8975A';

export default function Dashboard() {
    const [totalCohorts, setTotalCohorts] = useState(0);
    const [totalCandidates, setTotalCandidates] = useState(0);
    const [totalEvents, setTotalEvents] = useState(0);
    const [totalServiceProviders, setTotalServiceProviders] = useState(0);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTotalCohorts = async () => {
            try { const r = await API.get("/cohorts/count"); setTotalCohorts(r.data.total); }
            catch (e) { console.error(e); }
        };
        fetchTotalCohorts();
    }, []);

    useEffect(() => {
        const fetchTotalCandidates = async () => {
            try { const r = await API.get("/mentees/count"); setTotalCandidates(r.data.count); }
            catch (e) { console.error(e); }
        };
        fetchTotalCandidates();
    }, []);

    useEffect(() => {
        const fetchTotalEvents = async () => {
            try { const r = await API.get("/events/count"); setTotalEvents(r.data.count); }
            catch (e) { console.error(e); }
        };
        fetchTotalEvents();
    }, []);

    useEffect(() => {
        const fetchTotalServiceProviders = async () => {
            try { const r = await API.get("/service-providers/count"); setTotalServiceProviders(r.data.count); }
            catch (e) { console.error(e); }
        };
        fetchTotalServiceProviders();
    }, []);

    useEffect(() => {
        const fetchActivities = async () => {
            try {
                const r = await API.get('activities?limit=10');
                setActivities(r.data.activities);
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetchActivities();
    }, []);

    const getIcon = (entityType) => {
        const icons = {
            Candidate: <User className="w-4 h-4" style={{ color: GOLD }} />,
            Cohort: <Users className="w-4 h-4 text-emerald-600" />,
            Event: <Calendar className="w-4 h-4 text-violet-500" />,
            Mentor: <Award className="w-4 h-4 text-amber-500" />,
            ServiceProvider: <Briefcase className="w-4 h-4 text-sky-500" />
        };
        return icons[entityType] || <Clock className="w-4 h-4 text-stone-400" />;
    };

    const getActionColor = (type) => {
        if (type.includes('created')) return { bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.2)', text: '#34d399' };
        if (type.includes('updated')) return { bg: 'rgba(96,165,250,0.08)', border: 'rgba(96,165,250,0.2)', text: '#60a5fa' };
        if (type.includes('deleted')) return { bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.2)', text: '#f87171' };
        return { bg: 'rgba(0,0,0,0.04)', border: 'rgba(0,0,0,0.08)', text: '#78716c' };
    };

    const formatTimeAgo = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
        return new Date(date).toLocaleDateString();
    };

    const stats = [
        { label: "Total Cohorts", value: totalCohorts, icon: Calendar, sub: "Active program cohorts" },
        { label: "Total Candidates", value: totalCandidates, icon: Users, sub: "Enrolled participants" },
        { label: "Total Events", value: totalEvents, icon: Clock, sub: "Scheduled ceremonies" },
        { label: "Service Providers", value: totalServiceProviders, icon: Briefcase, sub: "Registered providers" },
    ];

    if (loading) {
        return (
            <div className="py-8">
                <div className="animate-pulse mb-8">
                    <div className="h-8 bg-stone-200 rounded-2xl w-48 mb-2" />
                    <div className="h-4 bg-stone-100 rounded-2xl w-80" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                    {[1,2,3,4].map(i => (
                        <div key={i} className="bg-white rounded-3xl p-6 border border-stone-100 shadow-sm">
                            <div className="h-4 bg-stone-100 rounded-xl w-28 mb-4" />
                            <div className="h-10 bg-stone-200 rounded-xl w-16 mb-3" />
                            <div className="h-3 bg-stone-100 rounded-xl w-24" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="py-2">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-1 h-8 rounded-full" style={{ background: `linear-gradient(to bottom, ${GOLD}, transparent)` }} />
                    <h1 className="text-3xl font-black tracking-tighter text-stone-900">Dashboard</h1>
                </div>
                <p className="text-stone-500 font-medium ml-4">Monitor your Moran programs and track participant progress</p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                {stats.map((stat, i) => {
                    const IconComponent = stat.icon;
                    return (
                        <div key={i} className="bg-white rounded-3xl p-6 border border-stone-100 shadow-sm hover:shadow-md transition-all duration-300 group relative overflow-hidden">
                            {/* Subtle gold accent on hover */}
                            <div className="absolute top-0 left-0 w-full h-0.5 rounded-t-3xl transition-all duration-500 group-hover:opacity-100 opacity-0"
                                style={{ background: `linear-gradient(to right, ${GOLD}, transparent)` }} />
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
                                    style={{ backgroundColor: 'rgba(184,151,90,0.1)' }}>
                                    <IconComponent className="w-5 h-5" style={{ color: GOLD }} />
                                </div>
                            </div>
                            <p className="text-4xl font-black text-stone-900 mb-1">{stat.value}</p>
                            <p className="text-sm font-bold text-stone-400 mb-1">{stat.label}</p>
                            <p className="text-xs text-stone-300 font-medium">{stat.sub}</p>
                        </div>
                    );
                })}
            </div>

            {/* Recent Activities */}
            <div className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
                {/* Card header */}
                <div className="px-8 py-6 flex items-center justify-between"
                    style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                            style={{ backgroundColor: 'rgba(184,151,90,0.1)' }}>
                            <Clock className="w-5 h-5" style={{ color: GOLD }} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-stone-900">Recent Activities</h2>
                            <p className="text-xs text-stone-400 font-medium">Latest updates from your program</p>
                        </div>
                    </div>
                    <div className="px-3 py-1.5 rounded-full text-xs font-black"
                        style={{ backgroundColor: 'rgba(184,151,90,0.1)', color: GOLD }}>
                        {activities.length} activities
                    </div>
                </div>

                <div className="divide-y divide-stone-50 max-h-96 overflow-y-auto">
                    {activities.length === 0 ? (
                        <div className="py-16 text-center">
                            <div className="w-16 h-16 rounded-3xl mx-auto mb-4 flex items-center justify-center"
                                style={{ backgroundColor: 'rgba(184,151,90,0.08)' }}>
                                <Clock className="w-8 h-8" style={{ color: GOLD }} />
                            </div>
                            <p className="font-bold text-stone-500">No activities yet</p>
                            <p className="text-sm text-stone-300 mt-1">Activities will appear here as you work</p>
                        </div>
                    ) : (
                        activities.map((activity) => {
                            const colors = getActionColor(activity.type);
                            return (
                                <div key={activity._id}
                                    className="px-8 py-5 hover:bg-stone-50/60 transition-colors duration-200 group">
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                                            style={{ backgroundColor: 'rgba(184,151,90,0.08)', border: '1px solid rgba(184,151,90,0.15)' }}>
                                            {getIcon(activity.entityType)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-stone-800 leading-relaxed mb-2">
                                                {activity.description}
                                            </p>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="text-xs px-2.5 py-1 rounded-full font-black border"
                                                    style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}>
                                                    {activity.type.replace('_', ' ').toUpperCase()}
                                                </span>
                                                <span className="text-xs text-stone-400 font-medium">
                                                    {formatTimeAgo(activity.createdAt)}
                                                </span>
                                                {activity.user && (
                                                    <span className="text-xs text-stone-400 font-medium flex items-center gap-1">
                                                        <User className="w-3 h-3" />
                                                        {activity.user}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {activities.length > 0 && (
                    <div className="px-8 py-4" style={{ borderTop: '1px solid rgba(0,0,0,0.04)' }}>
                        <button className="text-sm font-black flex items-center gap-1.5 group transition-all"
                            style={{ color: GOLD }}>
                            View All Activities
                            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}