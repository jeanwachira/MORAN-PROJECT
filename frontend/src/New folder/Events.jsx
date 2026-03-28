import { React, useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import API from '@/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Trash2, Edit, Calendar, Search, Filter, MoreVertical, Users, Scissors, GraduationCap, Star } from 'lucide-react';

const GOLD = '#B8975A';
const inputClass = "h-10 rounded-xl text-stone-900 text-sm border-stone-200 focus:border-[#B8975A] focus:ring-0 w-full";
const labelClass = "text-xs font-black tracking-widest uppercase text-stone-500";

export default function Events() {
    const [events, setEvents] = useState([]);
    const [serviceProviders, setServiceProviders] = useState([]);
    const [filteredEvents, setFilteredEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterEventType, setFilterEventType] = useState('all');
    const [newEvent, setNewEvent] = useState({ EventType: '', EventDate: '', ServiceProviders: [] });

    const eventTypeIcons = { 'Ithemba': Star, 'Junior Moran': Users, 'Cut-to-ID': Scissors, 'Alumni': GraduationCap };
    const eventTypeColors = {
        'Ithemba': { bg: 'rgba(167,139,250,0.1)', color: '#a78bfa', border: 'rgba(167,139,250,0.3)' },
        'Junior Moran': { bg: 'rgba(96,165,250,0.1)', color: '#60a5fa', border: 'rgba(96,165,250,0.3)' },
        'Cut-to-ID': { bg: 'rgba(248,113,113,0.1)', color: '#f87171', border: 'rgba(248,113,113,0.3)' },
        'Alumni': { bg: 'rgba(52,211,153,0.1)', color: '#34d399', border: 'rgba(52,211,153,0.3)' },
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [eventsRes, providersRes] = await Promise.all([API.get('/events'), API.get('/service-providers')]);
                setEvents(eventsRes.data); setFilteredEvents(eventsRes.data);
                setServiceProviders(providersRes.data);
            } catch (error) { console.error(error); }
            finally { setLoading(false); }
        };
        fetchData();
    }, []);

    useEffect(() => {
        let filtered = events;
        if (searchTerm) {
            filtered = filtered.filter(e =>
                e.EventType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                new Date(e.EventDate).toLocaleDateString().includes(searchTerm)
            );
        }
        if (filterEventType !== 'all') filtered = filtered.filter(e => e.EventType === filterEventType);
        setFilteredEvents(filtered);
    }, [searchTerm, filterEventType, events]);

    const handleAddEvent = async () => {
        try {
            if (!newEvent.EventType || !newEvent.EventDate || !newEvent.ServiceProviders.length) {
                alert('Please fill all required fields'); return;
            }
            const response = await API.post('/events', { ...newEvent, EventDate: new Date(newEvent.EventDate) });
            setEvents([...events, response.data]);
            setNewEvent({ EventType: '', EventDate: '', ServiceProviders: [] });
            setOpen(false);
        } catch (error) { console.error(error); alert('Error adding event. Please try again.'); }
    };

    const handleDeleteEvent = async (eventId) => {
        if (!window.confirm('Are you sure you want to delete this event?')) return;
        try {
            await API.delete(`/events/${eventId}`);
            setEvents(events.filter(e => e._id !== eventId));
        } catch (error) { console.error(error); alert('Error deleting event. Please try again.'); }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewEvent(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name, value) => setNewEvent(prev => ({ ...prev, [name]: value }));

    const handleServiceProviderChange = (providerId) => {
        setNewEvent(prev => ({
            ...prev,
            ServiceProviders: prev.ServiceProviders.includes(providerId)
                ? prev.ServiceProviders.filter(id => id !== providerId)
                : [...prev.ServiceProviders, providerId]
        }));
    };

    const openEditEvent = (event) => {
        setEditingEvent({
            ...event,
            EventDate: event.EventDate ? new Date(event.EventDate).toISOString().split('T')[0] : '',
            ServiceProviders: Array.isArray(event.ServiceProviders)
                ? event.ServiceProviders.map(id => id?._id || id)
                : [],
        });
        setEditOpen(true);
    };

    const handleEditEvent = async () => {
        try {
            if (!editingEvent.EventType || !editingEvent.EventDate || !editingEvent.ServiceProviders.length) {
                alert('Please fill all required fields'); return;
            }
            const response = await API.put(`/events/${editingEvent._id}`, {
                ...editingEvent,
                EventDate: new Date(editingEvent.EventDate),
            });
            setEvents(events.map(e => e._id === editingEvent._id ? response.data : e));
            setEditOpen(false);
            setEditingEvent(null);
        } catch (error) { console.error(error); alert('Error updating event. Please try again.'); }
    };

    const handleEditServiceProviderChange = (providerId) => {
        setEditingEvent(prev => ({
            ...prev,
            ServiceProviders: prev.ServiceProviders.includes(providerId)
                ? prev.ServiceProviders.filter(id => id !== providerId)
                : [...prev.ServiceProviders, providerId]
        }));
    };

    const isUpcoming = (eventDate) => new Date(eventDate) >= new Date();
    const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const eventTypes = ['Ithemba', 'Junior Moran', 'Cut-to-ID', 'Alumni'];
    const upcomingCount = events.filter(e => isUpcoming(e.EventDate)).length;
    const pastCount = events.filter(e => !isUpcoming(e.EventDate)).length;

    const statsData = [
        { label: 'Total Events', value: events.length, icon: Calendar },
        { label: 'Upcoming', value: upcomingCount, icon: Star },
        { label: 'Past Events', value: pastCount, icon: Calendar },
    ];

    if (loading) {
        return (
            <div className="py-8 animate-pulse">
                <div className="flex items-center gap-3 mb-8"><div className="w-1 h-7 rounded-full bg-stone-200" /><div className="h-8 bg-stone-200 rounded-2xl w-32" /></div>
                <div className="grid grid-cols-3 gap-5 mb-6">{[1,2,3].map(i => <div key={i} className="bg-white rounded-3xl h-24 border border-stone-100" />)}</div>
            </div>
        );
    }

    const EventCard = ({ event }) => {
        const colors = eventTypeColors[event.EventType] || { bg: 'rgba(184,151,90,0.1)', color: GOLD, border: 'rgba(184,151,90,0.25)' };
        const IconComponent = eventTypeIcons[event.EventType] || Calendar;
        const upcoming = isUpcoming(event.EventDate);
        const getServiceProviderName = (id) => {
            const p = serviceProviders.find(p => p._id === id);
            return p ? `${p.name} (${p.serviceType})` : 'Unknown Provider';
        };
        return (
            <div className="bg-white rounded-3xl border border-stone-100 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-0.5 rounded-t-3xl" style={{ background: `linear-gradient(to right, ${GOLD}, transparent)` }} />
                <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                                style={{ backgroundColor: colors.bg, border: `1px solid ${colors.border}` }}>
                                <IconComponent className="h-5 w-5" style={{ color: colors.color }} />
                            </div>
                            <div>
                                <span className="text-xs font-black px-2.5 py-1 rounded-full border inline-block"
                                    style={{ backgroundColor: colors.bg, color: colors.color, borderColor: colors.border }}>
                                    {event.EventType}
                                </span>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <div className={`w-1.5 h-1.5 rounded-full ${upcoming ? 'bg-emerald-400' : 'bg-stone-300'}`} />
                                    <span className="text-xs text-stone-400 font-medium">{upcoming ? 'Upcoming' : 'Past'}</span>
                                </div>
                            </div>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="p-1.5 rounded-xl hover:bg-stone-100 transition-colors">
                                    <MoreVertical className="h-4 w-4 text-stone-400" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-2xl border border-stone-100 shadow-xl">
                                <DropdownMenuItem className="font-semibold rounded-xl" onClick={() => openEditEvent(event)}><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                                <DropdownMenuItem className="text-red-500 font-semibold rounded-xl" onClick={() => handleDeleteEvent(event._id)}>
                                    <Trash2 className="h-4 w-4 mr-2" />Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <div className="mb-4">
                        <p className="text-xs font-black text-stone-400 uppercase tracking-wide mb-1">Date</p>
                        <p className="text-sm font-semibold text-stone-700">{formatDate(event.EventDate)}</p>
                    </div>
                    {event.ServiceProviders?.length > 0 && (
                        <div className="pt-4" style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                            <p className="text-xs font-black text-stone-400 uppercase tracking-wide mb-2">Service Providers</p>
                            <div className="flex flex-wrap gap-1.5">
                                {event.ServiceProviders.map(id => (
                                    <span key={id} className="text-xs px-2 py-0.5 rounded-full font-medium"
                                        style={{ backgroundColor: 'rgba(184,151,90,0.08)', color: GOLD }}>
                                        {getServiceProviderName(id)}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="flex gap-2 mt-5 pt-4" style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                        <button onClick={() => openEditEvent(event)} className="flex-1 h-9 rounded-xl text-xs font-black border flex items-center justify-center gap-1.5 transition-all hover:bg-stone-50"
                            style={{ borderColor: 'rgba(184,151,90,0.3)', color: GOLD }}>
                            <Edit className="h-3 w-3" /> Edit
                        </button>
                        <button onClick={() => handleDeleteEvent(event._id)}
                            className="flex-1 h-9 rounded-xl text-xs font-black border border-red-100 text-red-400 flex items-center justify-center gap-1.5 transition-all hover:bg-red-50">
                            <Trash2 className="h-3 w-3" /> Delete
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="py-2">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-1 h-7 rounded-full" style={{ background: `linear-gradient(to bottom, ${GOLD}, transparent)` }} />
                        <h1 className="text-3xl font-black tracking-tighter text-stone-900">Events</h1>
                    </div>
                    <p className="text-stone-400 font-medium ml-4">Manage and schedule all events and ceremonies</p>
                </div>
                <button onClick={() => setOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-sm text-black shadow-lg transition-all hover:opacity-90 active:scale-[0.97]"
                    style={{ background: `linear-gradient(135deg, ${GOLD}, #D4B88C)` }}>
                    <Plus className="h-4 w-4" /> Add Event
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {statsData.map((s, i) => {
                    const IconComponent = s.icon;
                    return (
                        <div key={i} className="bg-white rounded-3xl p-5 border border-stone-100 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-full h-0.5 rounded-t-3xl opacity-0 group-hover:opacity-100 transition-opacity"
                                style={{ background: `linear-gradient(to right, ${GOLD}, transparent)` }} />
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-black tracking-wide text-stone-400 uppercase mb-1">{s.label}</p>
                                    <p className="text-3xl font-black text-stone-900">{s.value}</p>
                                </div>
                                <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'rgba(184,151,90,0.1)' }}>
                                    <IconComponent className="h-5 w-5" style={{ color: GOLD }} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Search & Filter */}
            <div className="bg-white rounded-3xl border border-stone-100 shadow-sm p-5 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: GOLD }} />
                        <Input placeholder="Search events by type or date..." value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="pl-11 h-10 rounded-2xl border-stone-200 focus:border-[#B8975A]" />
                    </div>
                    <Select value={filterEventType} onValueChange={setFilterEventType}>
                        <SelectTrigger className="h-10 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#B8975A] focus:border-[#B8975A] hover:border-[#B8975A] transition-colors">
                            <Filter className="h-4 w-4 mr-2" style={{ color: GOLD }} />
                            <SelectValue placeholder="Filter by type" />
                        </SelectTrigger>
                        <SelectContent className="z-50 rounded-xl border border-stone-200 bg-white shadow-lg text-sm text-stone-900 p-1">
                            <SelectItem className="rounded-lg px-3 py-2 cursor-pointer hover:bg-amber-50 focus:bg-amber-50 text-stone-800 font-medium" value="all">All Event Types</SelectItem>
                            {eventTypes.map(t => <SelectItem className="rounded-lg px-3 py-2 cursor-pointer hover:bg-amber-50 focus:bg-amber-50 text-stone-800 font-medium" key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="upcoming" className="space-y-5">
                <TabsList className="bg-white border border-stone-100 shadow-sm rounded-2xl p-1 h-auto">
                    <TabsTrigger value="upcoming" className="rounded-xl font-black text-xs px-4 py-2">Upcoming Events</TabsTrigger>
                    <TabsTrigger value="past" className="rounded-xl font-black text-xs px-4 py-2">Past Events</TabsTrigger>
                    <TabsTrigger value="all" className="rounded-xl font-black text-xs px-4 py-2">All Events</TabsTrigger>
                </TabsList>
                <TabsContent value="upcoming">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filteredEvents.filter(e => isUpcoming(e.EventDate)).map(e => <EventCard key={e._id} event={e} />)}
                    </div>
                </TabsContent>
                <TabsContent value="past">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filteredEvents.filter(e => !isUpcoming(e.EventDate)).map(e => <EventCard key={e._id} event={e} />)}
                    </div>
                </TabsContent>
                <TabsContent value="all">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filteredEvents.map(e => <EventCard key={e._id} event={e} />)}
                    </div>
                </TabsContent>
            </Tabs>

            {filteredEvents.length === 0 && !loading && (
                <div className="text-center py-20 bg-white rounded-3xl border border-stone-100 shadow-sm">
                    <div className="w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: 'rgba(184,151,90,0.08)' }}>
                        <Calendar className="h-10 w-10" style={{ color: GOLD }} />
                    </div>
                    <h3 className="text-xl font-black text-stone-900 mb-2">No events found</h3>
                    <p className="text-stone-400 mb-6">{searchTerm || filterEventType !== 'all' ? 'Try adjusting your search or filters' : 'Get started by scheduling your first event'}</p>
                    <button onClick={() => setOpen(true)}
                        className="px-6 py-2.5 rounded-2xl font-black text-sm text-black shadow-lg transition-all hover:opacity-90"
                        style={{ background: `linear-gradient(135deg, ${GOLD}, #D4B88C)` }}>
                        <Plus className="h-4 w-4 inline mr-2" />Add Event
                    </button>
                </div>
            )}

            {/* Add Event Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-md bg-white rounded-3xl border border-stone-100 shadow-2xl p-0">
                    <div className="h-1 w-full rounded-t-3xl" style={{ background: `linear-gradient(to right, ${GOLD}, #D4B88C)` }} />
                    <div className="p-8">
                        <DialogHeader className="mb-6">
                            <DialogTitle className="text-2xl font-black tracking-tighter text-stone-900">Schedule New Event</DialogTitle>
                            <DialogDescription className="text-stone-400">Enter the details for the new event. All fields are required.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label className={labelClass}>Event Type *</Label>
                                <Select value={newEvent.EventType} onValueChange={v => handleSelectChange('EventType', v)}>
                                    <SelectTrigger className="h-10 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#B8975A] focus:border-[#B8975A] hover:border-[#B8975A] transition-colors"><SelectValue placeholder="Select event type" /></SelectTrigger>
                                    <SelectContent className="z-50 rounded-xl border border-stone-200 bg-white shadow-lg text-sm text-stone-900 p-1">
                                        {eventTypes.map(t => <SelectItem className="rounded-lg px-3 py-2 cursor-pointer hover:bg-amber-50 focus:bg-amber-50 text-stone-800 font-medium" key={t} value={t}>{t}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className={labelClass}>Event Date *</Label>
                                <Input name="EventDate" type="date" value={newEvent.EventDate} onChange={handleInputChange} className={inputClass} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className={labelClass}>Service Providers *</Label>
                                <div className="max-h-40 overflow-y-auto rounded-2xl p-3 space-y-2"
                                    style={{ border: '1px solid rgba(184,151,90,0.2)', backgroundColor: 'rgba(184,151,90,0.02)' }}>
                                    {serviceProviders.map(provider => (
                                        <div key={provider._id} className="flex items-center gap-2.5">
                                            <input type="checkbox" id={`p-${provider._id}`}
                                                checked={newEvent.ServiceProviders.includes(provider._id)}
                                                onChange={() => handleServiceProviderChange(provider._id)}
                                                className="rounded" style={{ accentColor: GOLD }} />
                                            <label htmlFor={`p-${provider._id}`} className="text-sm font-medium text-stone-700 cursor-pointer">
                                                {provider.name} — {provider.serviceType}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-stone-400">Select one or more service providers for this event</p>
                            </div>
                        </div>
                        <DialogFooter className="mt-8 gap-3">
                            <button onClick={() => setOpen(false)}
                                className="px-5 py-2.5 rounded-2xl font-black text-sm text-stone-600 border border-stone-200 hover:bg-stone-50 transition-all">Cancel</button>
                            <button onClick={handleAddEvent}
                                className="px-6 py-2.5 rounded-2xl font-black text-sm text-black shadow-lg transition-all hover:opacity-90"
                                style={{ background: `linear-gradient(135deg, ${GOLD}, #D4B88C)` }}>Schedule Event</button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
            {/* Edit Event Dialog */}
            {editingEvent && (
                <Dialog open={editOpen} onOpenChange={setEditOpen}>
                    <DialogContent className="max-w-md bg-white rounded-3xl border border-stone-100 shadow-2xl p-0">
                        <div className="h-1 w-full rounded-t-3xl" style={{ background: `linear-gradient(to right, ${GOLD}, #D4B88C)` }} />
                        <div className="p-8">
                            <DialogHeader className="mb-6">
                                <DialogTitle className="text-2xl font-black tracking-tighter text-stone-900">Edit Event</DialogTitle>
                                <DialogDescription className="text-stone-400">Update the details for this event.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label className={labelClass}>Event Type *</Label>
                                    <Select value={editingEvent.EventType} onValueChange={v => setEditingEvent(prev => ({ ...prev, EventType: v }))}>
                                        <SelectTrigger className="h-10 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#B8975A] focus:border-[#B8975A] hover:border-[#B8975A] transition-colors"><SelectValue placeholder="Select event type" /></SelectTrigger>
                                        <SelectContent className="z-50 rounded-xl border border-stone-200 bg-white shadow-lg text-sm text-stone-900 p-1">
                                            {eventTypes.map(t => <SelectItem className="rounded-lg px-3 py-2 cursor-pointer hover:bg-amber-50 focus:bg-amber-50 text-stone-800 font-medium" key={t} value={t}>{t}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className={labelClass}>Event Date *</Label>
                                    <Input name="EventDate" type="date" value={editingEvent.EventDate}
                                        onChange={e => setEditingEvent(prev => ({ ...prev, EventDate: e.target.value }))}
                                        className={inputClass} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className={labelClass}>Service Providers *</Label>
                                    <div className="max-h-40 overflow-y-auto rounded-2xl p-3 space-y-2"
                                        style={{ border: '1px solid rgba(184,151,90,0.2)', backgroundColor: 'rgba(184,151,90,0.02)' }}>
                                        {serviceProviders.map(provider => (
                                            <div key={provider._id} className="flex items-center gap-2.5">
                                                <input type="checkbox" id={`ep-${provider._id}`}
                                                    checked={editingEvent.ServiceProviders.includes(provider._id)}
                                                    onChange={() => handleEditServiceProviderChange(provider._id)}
                                                    className="rounded" style={{ accentColor: GOLD }} />
                                                <label htmlFor={`ep-${provider._id}`} className="text-sm font-medium text-stone-700 cursor-pointer">
                                                    {provider.name} — {provider.serviceType}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                    {editingEvent.ServiceProviders.length > 0 && (
                                        <p className="text-xs font-semibold" style={{ color: GOLD }}>
                                            {editingEvent.ServiceProviders.length} provider{editingEvent.ServiceProviders.length > 1 ? 's' : ''} selected
                                        </p>
                                    )}
                                </div>
                            </div>
                            <DialogFooter className="mt-8 gap-3">
                                <button onClick={() => { setEditOpen(false); setEditingEvent(null); }}
                                    className="px-5 py-2.5 rounded-2xl font-black text-sm text-stone-600 border border-stone-200 hover:bg-stone-50 transition-all">Cancel</button>
                                <button onClick={handleEditEvent}
                                    className="px-6 py-2.5 rounded-2xl font-black text-sm text-black shadow-lg transition-all hover:opacity-90"
                                    style={{ background: `linear-gradient(135deg, ${GOLD}, #D4B88C)` }}>Save Changes</button>
                            </DialogFooter>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}