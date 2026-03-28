import { React, useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import API from '@/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Trash2, Edit, Mail, Phone, Building, Search, Filter, MoreVertical, Star, Users, Utensils, Mic, Church, Tent } from 'lucide-react';

const GOLD = '#B8975A';
const inputClass = "h-10 rounded-xl text-stone-900 text-sm border-stone-200 focus:border-[#B8975A] focus:ring-0 w-full";
const labelClass = "text-xs font-black tracking-widest uppercase text-stone-500";

export default function ServiceProviders() {
    const [serviceProviders, setServiceProviders] = useState([]);
    const [filteredProviders, setFilteredProviders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editingProvider, setEditingProvider] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterServiceType, setFilterServiceType] = useState('all');
    const [newProvider, setNewProvider] = useState({ name: '', serviceType: '', contactEmail: '', phone: '' });

    const serviceTypeIcons = {
        'Pre-camp speakers': Mic, 'Ndundu Speaker': Users, 'Priest': Church,
        'Catering': Utensils, 'Tents': Tent, 'Muratina': Star
    };
    const serviceTypeColors = {
        'Pre-camp speakers': { bg: 'rgba(167,139,250,0.1)', color: '#a78bfa', border: 'rgba(167,139,250,0.25)' },
        'Ndundu Speaker': { bg: 'rgba(96,165,250,0.1)', color: '#60a5fa', border: 'rgba(96,165,250,0.25)' },
        'Priest': { bg: 'rgba(248,113,113,0.1)', color: '#f87171', border: 'rgba(248,113,113,0.25)' },
        'Catering': { bg: 'rgba(251,146,60,0.1)', color: '#fb923c', border: 'rgba(251,146,60,0.25)' },
        'Tents': { bg: 'rgba(52,211,153,0.1)', color: '#34d399', border: 'rgba(52,211,153,0.25)' },
        'Muratina': { bg: 'rgba(250,204,21,0.1)', color: '#facc15', border: 'rgba(250,204,21,0.25)' },
    };

    useEffect(() => {
        const fetchServiceProviders = async () => {
            try {
                const response = await API.get('/service-providers');
                setServiceProviders(response.data); setFilteredProviders(response.data);
            } catch (error) { console.error(error); }
            finally { setLoading(false); }
        };
        fetchServiceProviders();
    }, []);

    useEffect(() => {
        let filtered = serviceProviders;
        if (searchTerm) {
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.serviceType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.contactEmail.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        if (filterServiceType !== 'all') filtered = filtered.filter(p => p.serviceType === filterServiceType);
        setFilteredProviders(filtered);
    }, [searchTerm, filterServiceType, serviceProviders]);

    const handleAddProvider = async () => {
        try {
            if (!newProvider.name || !newProvider.serviceType || !newProvider.contactEmail || !newProvider.phone) {
                alert('Please fill all required fields'); return;
            }
            const response = await API.post('/service-providers', newProvider);
            setServiceProviders([...serviceProviders, response.data]);
            setNewProvider({ name: '', serviceType: '', contactEmail: '', phone: '' });
            setOpen(false);
        } catch (error) { console.error(error); alert('Error adding service provider. Please try again.'); }
    };

    const handleDeleteProvider = async (providerId) => {
        if (!window.confirm('Are you sure you want to delete this service provider?')) return;
        try {
            await API.delete(`/service-providers/${providerId}`);
            setServiceProviders(serviceProviders.filter(p => p._id !== providerId));
        } catch (error) { console.error(error); alert('Error deleting service provider. Please try again.'); }
    };

    const handleInputChange = (e) => { const { name, value } = e.target; setNewProvider(prev => ({ ...prev, [name]: value })); };
    const handleSelectChange = (name, value) => setNewProvider(prev => ({ ...prev, [name]: value }));

    const openEditProvider = (provider) => {
        setEditingProvider({ ...provider });
        setEditOpen(true);
    };

    const handleEditProvider = async () => {
        try {
            if (!editingProvider.name || !editingProvider.serviceType || !editingProvider.contactEmail || !editingProvider.phone) {
                alert('Please fill all required fields'); return;
            }
            const response = await API.put(`/service-providers/${editingProvider._id}`, editingProvider);
            setServiceProviders(serviceProviders.map(p => p._id === editingProvider._id ? response.data : p));
            setEditOpen(false);
            setEditingProvider(null);
        } catch (error) { console.error(error); alert('Error updating service provider. Please try again.'); }
    };

    const handleEditInputChange = (e) => { const { name, value } = e.target; setEditingProvider(prev => ({ ...prev, [name]: value })); };
    const handleEditSelectChange = (name, value) => setEditingProvider(prev => ({ ...prev, [name]: value }));
    const getInitials = (name) => name.split(' ').map(n => n[0]).join('').toUpperCase();
    const getServiceTypeIcon = (serviceType) => { const I = serviceTypeIcons[serviceType] || Building; return <I className="h-4 w-4" />; };
    const serviceTypes = ['Pre-camp speakers', 'Ndundu Speaker', 'Priest', 'Catering', 'Tents', 'Muratina'];

    if (loading) {
        return (
            <div className="py-8 animate-pulse">
                <div className="flex items-center gap-3 mb-8"><div className="w-1 h-7 rounded-full bg-stone-200" /><div className="h-8 bg-stone-200 rounded-2xl w-44" /></div>
                <div className="grid grid-cols-2 gap-5 mb-6"><div className="bg-white rounded-3xl h-24 border border-stone-100" /><div className="bg-white rounded-3xl h-24 border border-stone-100" /></div>
            </div>
        );
    }

    const ProviderCard = ({ provider }) => {
        const colors = serviceTypeColors[provider.serviceType] || { bg: 'rgba(184,151,90,0.1)', color: GOLD, border: 'rgba(184,151,90,0.25)' };
        const IconComponent = serviceTypeIcons[provider.serviceType] || Building;
        return (
            <div className="bg-white rounded-3xl border border-stone-100 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-0.5 rounded-t-3xl" style={{ background: `linear-gradient(to right, ${GOLD}, transparent)` }} />
                <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-14 w-14 rounded-2xl">
                                <AvatarFallback className="rounded-2xl font-black text-sm"
                                    style={{ backgroundColor: colors.bg, color: colors.color }}>
                                    {getInitials(provider.name)}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <h3 className="font-black text-stone-900">{provider.name}</h3>
                                <span className="text-xs font-black px-2 py-0.5 rounded-full mt-1 inline-flex items-center gap-1 border"
                                    style={{ backgroundColor: colors.bg, color: colors.color, borderColor: colors.border }}>
                                    <IconComponent />{provider.serviceType}
                                </span>
                            </div>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="p-1.5 rounded-xl hover:bg-stone-100 transition-colors">
                                    <MoreVertical className="h-4 w-4 text-stone-400" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-2xl border border-stone-100 shadow-xl">
                                <DropdownMenuItem className="font-semibold rounded-xl" onClick={() => openEditProvider(provider)}><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                                <DropdownMenuItem className="text-red-500 font-semibold rounded-xl" onClick={() => handleDeleteProvider(provider._id)}>
                                    <Trash2 className="h-4 w-4 mr-2" />Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <div className="space-y-2 mb-5">
                        <div className="flex items-center gap-2 text-sm text-stone-500"><Mail className="h-3.5 w-3.5" style={{ color: GOLD }} /><span className="truncate font-medium">{provider.contactEmail}</span></div>
                        <div className="flex items-center gap-2 text-sm text-stone-500"><Phone className="h-3.5 w-3.5" style={{ color: GOLD }} /><span className="font-medium">{provider.phone}</span></div>
                        <div className="flex items-center gap-2 text-sm" style={{ color: GOLD }}><Star className="h-3.5 w-3.5" /><span className="text-xs font-semibold">Available for booking</span></div>
                    </div>
                    <div className="flex gap-2 pt-4" style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                        <button onClick={() => openEditProvider(provider)} className="flex-1 h-9 rounded-xl text-xs font-black border flex items-center justify-center gap-1.5 transition-all hover:bg-stone-50"
                            style={{ borderColor: 'rgba(184,151,90,0.3)', color: GOLD }}>
                            <Edit className="h-3 w-3" /> Edit
                        </button>
                        <button className="flex-1 h-9 rounded-xl text-xs font-black text-black flex items-center justify-center gap-1.5 transition-all hover:opacity-90"
                            style={{ background: `linear-gradient(135deg, ${GOLD}, #D4B88C)` }}>
                            <Phone className="h-3 w-3" /> Contact
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
                        <h1 className="text-3xl font-black tracking-tighter text-stone-900">Service Providers</h1>
                    </div>
                    <p className="text-stone-400 font-medium ml-4">Manage all service providers for camps and events</p>
                </div>
                <button onClick={() => setOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-sm text-black shadow-lg transition-all hover:opacity-90 active:scale-[0.97]"
                    style={{ background: `linear-gradient(135deg, ${GOLD}, #D4B88C)` }}>
                    <Plus className="h-4 w-4" /> Add Provider
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {[
                    { label: 'Total Providers', value: serviceProviders.length, icon: Building },
                    { label: 'Service Types', value: serviceTypes.length, icon: Users },
                ].map((s, i) => {
                    const IconComponent = s.icon;
                    return (
                        <div key={i} className="bg-white rounded-3xl p-5 border border-stone-100 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-xs font-black tracking-wide text-stone-400 uppercase mb-1">{s.label}</p>
                                <p className="text-3xl font-black text-stone-900">{s.value}</p>
                            </div>
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'rgba(184,151,90,0.1)' }}>
                                <IconComponent className="h-6 w-6" style={{ color: GOLD }} />
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
                        <Input placeholder="Search providers by name, service type, or email..."
                            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                            className="pl-11 h-10 rounded-2xl border-stone-200 focus:border-[#B8975A]" />
                    </div>
                    <Select value={filterServiceType} onValueChange={setFilterServiceType}>
                        <SelectTrigger className="h-10 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#B8975A] focus:border-[#B8975A] hover:border-[#B8975A] transition-colors">
                            <Filter className="h-4 w-4 mr-2" style={{ color: GOLD }} />
                            <SelectValue placeholder="Filter by service type" />
                        </SelectTrigger>
                        <SelectContent className="z-50 rounded-xl border border-stone-200 bg-white shadow-lg text-sm text-stone-900 p-1">
                            <SelectItem className="rounded-lg px-3 py-2 cursor-pointer hover:bg-amber-50 focus:bg-amber-50 text-stone-800 font-medium" value="all">All Service Types</SelectItem>
                            {serviceTypes.map(t => <SelectItem className="rounded-lg px-3 py-2 cursor-pointer hover:bg-amber-50 focus:bg-amber-50 text-stone-800 font-medium" key={t} value={t}><div className="flex items-center gap-2">{getServiceTypeIcon(t)}{t}</div></SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Quick service type stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                {serviceTypes.map(serviceType => {
                    const count = serviceProviders.filter(p => p.serviceType === serviceType).length;
                    const colors = serviceTypeColors[serviceType] || {};
                    const IconComponent = serviceTypeIcons[serviceType] || Building;
                    return (
                        <div key={serviceType} className="bg-white rounded-2xl p-4 border border-stone-100 shadow-sm text-center hover:shadow-md transition-all">
                            <div className="w-9 h-9 rounded-xl mx-auto mb-2 flex items-center justify-center"
                                style={{ backgroundColor: colors.bg || 'rgba(184,151,90,0.1)' }}>
                                <IconComponent className="h-4 w-4" style={{ color: colors.color || GOLD }} />
                            </div>
                            <p className="text-xs font-black text-stone-500 mb-1 leading-tight">{serviceType}</p>
                            <p className="text-2xl font-black" style={{ color: GOLD }}>{count}</p>
                        </div>
                    );
                })}
            </div>

            {/* Tabs */}
            <Tabs defaultValue="grid" className="space-y-5">
                <TabsList className="bg-white border border-stone-100 shadow-sm rounded-2xl p-1 h-auto">
                    <TabsTrigger value="grid" className="rounded-xl font-black text-xs px-4 py-2">Grid View</TabsTrigger>
                    <TabsTrigger value="list" className="rounded-xl font-black text-xs px-4 py-2">List View</TabsTrigger>
                </TabsList>
                <TabsContent value="grid">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {filteredProviders.map(p => <ProviderCard key={p._id} provider={p} />)}
                    </div>
                </TabsContent>
                <TabsContent value="list">
                    <div className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
                        <div className="divide-y divide-stone-50">
                            {filteredProviders.map(provider => {
                                const colors = serviceTypeColors[provider.serviceType] || {};
                                const IconComponent = serviceTypeIcons[provider.serviceType] || Building;
                                return (
                                    <div key={provider._id} className="p-5 hover:bg-stone-50/60 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <Avatar className="h-12 w-12 rounded-2xl">
                                                    <AvatarFallback className="rounded-2xl font-black text-sm"
                                                        style={{ backgroundColor: colors.bg || 'rgba(184,151,90,0.1)', color: colors.color || GOLD }}>
                                                        {getInitials(provider.name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <h3 className="font-black text-stone-900">{provider.name}</h3>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <span className="text-xs font-black px-2 py-0.5 rounded-full border inline-flex items-center gap-1"
                                                            style={{ backgroundColor: colors.bg, color: colors.color, borderColor: colors.border }}>
                                                            <IconComponent />{provider.serviceType}
                                                        </span>
                                                        <span className="text-xs text-stone-400 font-medium flex items-center gap-1"><Mail className="h-3 w-3" />{provider.contactEmail}</span>
                                                        <span className="text-xs text-stone-400 font-medium flex items-center gap-1"><Phone className="h-3 w-3" />{provider.phone}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => openEditProvider(provider)} className="h-9 px-4 rounded-xl text-xs font-black border transition-all hover:bg-stone-50"
                                                    style={{ borderColor: 'rgba(184,151,90,0.3)', color: GOLD }}>Edit</button>
                                                <button className="h-9 px-3 rounded-xl border border-red-100 text-red-400 hover:bg-red-50 transition-all"
                                                    onClick={() => handleDeleteProvider(provider._id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

            {filteredProviders.length === 0 && !loading && (
                <div className="text-center py-20 bg-white rounded-3xl border border-stone-100 shadow-sm">
                    <div className="w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: 'rgba(184,151,90,0.08)' }}>
                        <Building className="h-10 w-10" style={{ color: GOLD }} />
                    </div>
                    <h3 className="text-xl font-black text-stone-900 mb-2">No service providers found</h3>
                    <p className="text-stone-400 mb-6">{searchTerm || filterServiceType !== 'all' ? 'Try adjusting your search or filters' : 'Get started by adding your first service provider'}</p>
                    <button onClick={() => setOpen(true)}
                        className="px-6 py-2.5 rounded-2xl font-black text-sm text-black shadow-lg transition-all hover:opacity-90"
                        style={{ background: `linear-gradient(135deg, ${GOLD}, #D4B88C)` }}>
                        <Plus className="h-4 w-4 inline mr-2" />Add Provider
                    </button>
                </div>
            )}

            {/* Add Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-md bg-white rounded-3xl border border-stone-100 shadow-2xl p-0">
                    <div className="h-1 w-full rounded-t-3xl" style={{ background: `linear-gradient(to right, ${GOLD}, #D4B88C)` }} />
                    <div className="p-8">
                        <DialogHeader className="mb-6">
                            <DialogTitle className="text-2xl font-black tracking-tighter text-stone-900">Add New Service Provider</DialogTitle>
                            <DialogDescription className="text-stone-400">Enter the details for the new service provider. All fields are required.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label className={labelClass}>Provider Name *</Label>
                                <Input name="name" placeholder="Enter provider name" value={newProvider.name} onChange={handleInputChange} className={inputClass} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className={labelClass}>Service Type *</Label>
                                <Select value={newProvider.serviceType} onValueChange={v => handleSelectChange('serviceType', v)}>
                                    <SelectTrigger className="h-10 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#B8975A] focus:border-[#B8975A] hover:border-[#B8975A] transition-colors"><SelectValue placeholder="Select service type" /></SelectTrigger>
                                    <SelectContent className="z-50 rounded-xl border border-stone-200 bg-white shadow-lg text-sm text-stone-900 p-1">
                                        {serviceTypes.map(t => <SelectItem className="rounded-lg px-3 py-2 cursor-pointer hover:bg-amber-50 focus:bg-amber-50 text-stone-800 font-medium" key={t} value={t}><div className="flex items-center gap-2">{getServiceTypeIcon(t)}{t}</div></SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className={labelClass}>Contact Email *</Label>
                                <Input name="contactEmail" type="email" placeholder="Enter contact email" value={newProvider.contactEmail} onChange={handleInputChange} className={inputClass} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className={labelClass}>Phone Number *</Label>
                                <Input name="phone" placeholder="Enter phone number" value={newProvider.phone} onChange={handleInputChange} className={inputClass} />
                            </div>
                        </div>
                        <DialogFooter className="mt-8 gap-3">
                            <button onClick={() => setOpen(false)}
                                className="px-5 py-2.5 rounded-2xl font-black text-sm text-stone-600 border border-stone-200 hover:bg-stone-50 transition-all">Cancel</button>
                            <button onClick={handleAddProvider}
                                className="px-6 py-2.5 rounded-2xl font-black text-sm text-black shadow-lg transition-all hover:opacity-90"
                                style={{ background: `linear-gradient(135deg, ${GOLD}, #D4B88C)` }}>Add Provider</button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
            {/* Edit Provider Dialog */}
            {editingProvider && (
                <Dialog open={editOpen} onOpenChange={setEditOpen}>
                    <DialogContent className="max-w-md bg-white rounded-3xl border border-stone-100 shadow-2xl p-0">
                        <div className="h-1 w-full rounded-t-3xl" style={{ background: `linear-gradient(to right, ${GOLD}, #D4B88C)` }} />
                        <div className="p-8">
                            <DialogHeader className="mb-6">
                                <DialogTitle className="text-2xl font-black tracking-tighter text-stone-900">Edit Service Provider</DialogTitle>
                                <DialogDescription className="text-stone-400">Update the details for this service provider.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label className={labelClass}>Provider Name *</Label>
                                    <Input name="name" placeholder="Enter provider name" value={editingProvider.name || ''} onChange={handleEditInputChange} className={inputClass} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className={labelClass}>Service Type *</Label>
                                    <Select value={editingProvider.serviceType} onValueChange={v => handleEditSelectChange('serviceType', v)}>
                                        <SelectTrigger className="h-10 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#B8975A] focus:border-[#B8975A] hover:border-[#B8975A] transition-colors"><SelectValue placeholder="Select service type" /></SelectTrigger>
                                        <SelectContent className="z-50 rounded-xl border border-stone-200 bg-white shadow-lg text-sm text-stone-900 p-1">
                                            {serviceTypes.map(t => <SelectItem className="rounded-lg px-3 py-2 cursor-pointer hover:bg-amber-50 focus:bg-amber-50 text-stone-800 font-medium" key={t} value={t}><div className="flex items-center gap-2">{getServiceTypeIcon(t)}{t}</div></SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className={labelClass}>Contact Email *</Label>
                                    <Input name="contactEmail" type="email" placeholder="Enter contact email" value={editingProvider.contactEmail || ''} onChange={handleEditInputChange} className={inputClass} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className={labelClass}>Phone Number *</Label>
                                    <Input name="phone" placeholder="Enter phone number" value={editingProvider.phone || ''} onChange={handleEditInputChange} className={inputClass} />
                                </div>
                            </div>
                            <DialogFooter className="mt-8 gap-3">
                                <button onClick={() => { setEditOpen(false); setEditingProvider(null); }}
                                    className="px-5 py-2.5 rounded-2xl font-black text-sm text-stone-600 border border-stone-200 hover:bg-stone-50 transition-all">Cancel</button>
                                <button onClick={handleEditProvider}
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