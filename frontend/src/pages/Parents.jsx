import { React, useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import API from '@/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Trash2, Edit, Mail, Phone, Users, Search, Filter, MoreVertical, User, UserCheck, Baby, Briefcase, MapPin, AlertCircle, Loader2 } from 'lucide-react';

const GOLD = '#B8975A';
const inputClass = "h-10 rounded-xl text-stone-900 text-sm border-stone-200 focus:border-[#B8975A] focus:ring-0 w-full";
const labelClass = "text-xs font-black tracking-widest uppercase text-stone-500";

export default function Parents() {
    const [parents, setParents] = useState([]);
    const [mentees, setMentees] = useState([]);
    const [filteredParents, setFilteredParents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [open, setOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterParentType, setFilterParentType] = useState('all');
    const [error, setError] = useState('');
    const [newParent, setNewParent] = useState({ parent: '', name: '', phone: '', email: '', profession: '', residence: '', mentee: [] });

    const parentTypeColors = {
        'Father': { bg: 'rgba(96,165,250,0.1)', color: '#60a5fa', border: 'rgba(96,165,250,0.25)' },
        'Mother': { bg: 'rgba(244,114,182,0.1)', color: '#f472b6', border: 'rgba(244,114,182,0.25)' },
    };

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const [parentsRes, menteesRes] = await Promise.all([API.get('/parents'), API.get('/mentees')]);
            setParents(parentsRes.data); setFilteredParents(parentsRes.data); setMentees(menteesRes.data);
        } catch (error) { console.error(error); setError('Failed to load data. Please refresh the page.'); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        let filtered = parents;
        if (searchTerm) {
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.parent.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.profession.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.residence.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        if (filterParentType !== 'all') filtered = filtered.filter(p => p.parent === filterParentType);
        setFilteredParents(filtered);
    }, [searchTerm, filterParentType, parents]);

    const resetForm = () => {
        setNewParent({ parent: '', name: '', phone: '', email: '', profession: '', residence: '', mentee: [] });
        setEditMode(false); setEditingId(null); setError('');
    };

    const handleAddParent = async () => {
        setError(''); setSaving(true);
        try {
            if (!newParent.parent || !newParent.name || !newParent.phone || !newParent.email || !newParent.profession || !newParent.residence || !newParent.mentee.length) {
                setError('Please fill all required fields'); setSaving(false); return;
            }
            const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/i;
            if (!emailRegex.test(newParent.email)) { setError('Please enter a valid email address'); setSaving(false); return; }
            const response = await API.post('/parents', { ...newParent, mentee: Array.isArray(newParent.mentee) ? newParent.mentee : [newParent.mentee] });
            setParents([...parents, response.data]);
            resetForm(); setOpen(false);
        } catch (error) {
            setError(error.response?.data?.error || 'Error adding parent. Please try again.');
        } finally { setSaving(false); }
    };

    const handleEditParent = async () => {
        setError(''); setSaving(true);
        try {
            if (!newParent.parent || !newParent.name || !newParent.phone || !newParent.email || !newParent.profession || !newParent.residence || !newParent.mentee.length) {
                setError('Please fill all required fields'); setSaving(false); return;
            }
            const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/i;
            if (!emailRegex.test(newParent.email)) { setError('Please enter a valid email address'); setSaving(false); return; }
            const response = await API.put(`/parents/${editingId}`, { ...newParent, mentee: Array.isArray(newParent.mentee) ? newParent.mentee : [newParent.mentee] });
            setParents(parents.map(p => p._id === editingId ? response.data : p));
            resetForm(); setOpen(false);
        } catch (error) {
            setError(error.response?.data?.error || 'Error updating parent. Please try again.');
        } finally { setSaving(false); }
    };

    const openEditDialog = (parent) => {
        setEditMode(true); setEditingId(parent._id);
        setNewParent({ parent: parent.parent, name: parent.name, phone: parent.phone, email: parent.email, profession: parent.profession, residence: parent.residence, mentee: parent.mentee });
        setOpen(true);
    };

    const handleDeleteParent = async (parentId) => {
        if (!window.confirm('Are you sure you want to delete this parent? This action cannot be undone.')) return;
        try {
            await API.delete(`/parents/${parentId}`);
            setParents(parents.filter(p => p._id !== parentId));
        } catch (error) { console.error(error); alert('Error deleting parent. Please try again.'); }
    };

    const handleInputChange = (e) => { const { name, value } = e.target; setNewParent(prev => ({ ...prev, [name]: value })); };
    const handleSelectChange = (name, value) => setNewParent(prev => ({ ...prev, [name]: value }));
    const getInitials = (name) => name.split(' ').map(n => n[0]).join('').toUpperCase();
    const getMenteeName = (menteeId) => { const m = mentees.find(m => m._id === menteeId); return m ? m.name : 'Unknown Mentee'; };

    if (loading) {
        return (
            <div className="py-8 animate-pulse">
                <div className="flex items-center gap-3 mb-8"><div className="w-1 h-7 rounded-full bg-stone-200" /><div className="h-8 bg-stone-200 rounded-2xl w-32" /></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {[1,2,3,4,5,6].map(i => <div key={i} className="bg-white rounded-3xl h-56 border border-stone-100" />)}
                </div>
            </div>
        );
    }

    const ParentCard = ({ parent }) => {
        const colors = parentTypeColors[parent.parent] || { bg: 'rgba(184,151,90,0.1)', color: GOLD, border: 'rgba(184,151,90,0.25)' };
        return (
            <div className="bg-white rounded-3xl border border-stone-100 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-0.5 rounded-t-3xl" style={{ background: `linear-gradient(to right, ${GOLD}, transparent)` }} />
                <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-14 w-14 rounded-2xl">
                                <AvatarFallback className="rounded-2xl font-black text-black text-base"
                                    style={{ background: `linear-gradient(135deg, ${GOLD}, #D4B88C)` }}>
                                    {getInitials(parent.name)}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <h3 className="font-black text-stone-900">{parent.name}</h3>
                                <span className="text-xs font-black px-2 py-0.5 rounded-full mt-1 inline-block border"
                                    style={{ backgroundColor: colors.bg, color: colors.color, borderColor: colors.border }}>
                                    {parent.parent}
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
                                <DropdownMenuItem className="font-semibold rounded-xl" onClick={() => openEditDialog(parent)}>
                                    <Edit className="h-4 w-4 mr-2" />Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-500 font-semibold rounded-xl" onClick={() => handleDeleteParent(parent._id)}>
                                    <Trash2 className="h-4 w-4 mr-2" />Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <div className="space-y-2 mb-4">
                        {[
                            { icon: Mail, val: parent.email },
                            { icon: Phone, val: parent.phone },
                            { icon: Briefcase, val: parent.profession },
                            { icon: MapPin, val: parent.residence },
                        ].map(({ icon: Icon, val }, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm text-stone-500">
                                <Icon className="h-3.5 w-3.5 flex-shrink-0" style={{ color: GOLD }} />
                                <span className="truncate font-medium">{val}</span>
                            </div>
                        ))}
                    </div>
                    {parent.mentee?.length > 0 && (
                        <div className="pt-3 mb-4" style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                            <div className="flex items-center gap-1.5 mb-2">
                                <Baby className="h-3.5 w-3.5" style={{ color: GOLD }} />
                                <span className="text-xs font-black text-stone-500 uppercase tracking-wide">Mentees</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {parent.mentee.map(id => (
                                    <span key={id} className="text-xs px-2 py-0.5 rounded-full font-medium border"
                                        style={{ backgroundColor: 'rgba(184,151,90,0.08)', color: GOLD, borderColor: 'rgba(184,151,90,0.2)' }}>
                                        {getMenteeName(id)}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="flex gap-2 pt-4" style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                        <button className="flex-1 h-9 rounded-xl text-xs font-black border flex items-center justify-center gap-1.5 transition-all hover:bg-stone-50"
                            style={{ borderColor: 'rgba(184,151,90,0.3)', color: GOLD }} onClick={() => openEditDialog(parent)}>
                            <Edit className="h-3 w-3" /> Edit
                        </button>
                        <button className="flex-1 h-9 rounded-xl text-xs font-black text-black flex items-center justify-center gap-1.5 transition-all hover:opacity-90"
                            style={{ background: `linear-gradient(135deg, ${GOLD}, #D4B88C)` }}
                            onClick={() => window.open(`mailto:${parent.email}`)}>
                            <Mail className="h-3 w-3" /> Contact
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="py-2 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-1 h-7 rounded-full" style={{ background: `linear-gradient(to bottom, ${GOLD}, transparent)` }} />
                        <h1 className="text-3xl font-black tracking-tighter text-stone-900">Parents</h1>
                    </div>
                    <p className="text-stone-400 font-medium ml-4">Manage parent information and their connections to mentees</p>
                </div>
                <button onClick={() => { resetForm(); setOpen(true); }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-sm text-black shadow-lg transition-all hover:opacity-90 active:scale-[0.97]"
                    style={{ background: `linear-gradient(135deg, ${GOLD}, #D4B88C)` }}>
                    <Plus className="h-4 w-4" /> Add Parent
                </button>
            </div>

            {error && (
                <Alert className="rounded-2xl border border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <AlertDescription className="text-red-600">{error}</AlertDescription>
                </Alert>
            )}

            {/* Search & Filter */}
            <div className="bg-white rounded-3xl border border-stone-100 shadow-sm p-5">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: GOLD }} />
                        <Input placeholder="Search by name, email, profession, or location..."
                            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                            className="pl-11 h-10 rounded-2xl border-stone-200 focus:border-[#B8975A]" />
                    </div>
                    <Select value={filterParentType} onValueChange={setFilterParentType}>
                        <SelectTrigger className="w-44 h-10 rounded-2xl border-stone-200">
                            <Filter className="h-4 w-4 mr-2" style={{ color: GOLD }} />
                            <SelectValue placeholder="Filter by type" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl">
                            <SelectItem value="all">All Parents</SelectItem>
                            <SelectItem value="Father">Fathers</SelectItem>
                            <SelectItem value="Mother">Mothers</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="grid" className="space-y-5">
                <TabsList className="bg-white border border-stone-100 shadow-sm rounded-2xl p-1 h-auto">
                    <TabsTrigger value="grid" className="rounded-xl font-black text-xs px-4 py-2">Family View</TabsTrigger>
                    <TabsTrigger value="list" className="rounded-xl font-black text-xs px-4 py-2">List View</TabsTrigger>
                </TabsList>
                <TabsContent value="grid">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filteredParents.map(parent => <ParentCard key={parent._id} parent={parent} />)}
                    </div>
                </TabsContent>
                <TabsContent value="list">
                    <div className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
                        <div className="divide-y divide-stone-50">
                            {filteredParents.map(parent => {
                                const colors = parentTypeColors[parent.parent] || {};
                                return (
                                    <div key={parent._id} className="p-5 hover:bg-stone-50/60 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                                <Avatar className="h-12 w-12 rounded-2xl flex-shrink-0">
                                                    <AvatarFallback className="rounded-2xl font-black text-black"
                                                        style={{ background: `linear-gradient(135deg, ${GOLD}, #D4B88C)` }}>
                                                        {getInitials(parent.name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-black text-stone-900 truncate">{parent.name}</h3>
                                                        <span className="text-xs font-black px-2 py-0.5 rounded-full border flex-shrink-0"
                                                            style={{ backgroundColor: colors.bg, color: colors.color, borderColor: colors.border }}>
                                                            {parent.parent}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-stone-400">
                                                        <span className="flex items-center gap-1 font-medium"><Mail className="h-3 w-3" />{parent.email}</span>
                                                        <span className="flex items-center gap-1 font-medium"><Phone className="h-3 w-3" />{parent.phone}</span>
                                                        <span className="flex items-center gap-1 font-medium"><Briefcase className="h-3 w-3" />{parent.profession}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 ml-4">
                                                <button className="h-9 px-4 rounded-xl text-xs font-black border transition-all hover:bg-stone-50"
                                                    style={{ borderColor: 'rgba(184,151,90,0.3)', color: GOLD }}
                                                    onClick={() => openEditDialog(parent)}>
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button className="h-9 px-3 rounded-xl text-xs border border-red-100 text-red-400 hover:bg-red-50 transition-all"
                                                    onClick={() => handleDeleteParent(parent._id)}>
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

            {filteredParents.length === 0 && !loading && (
                <div className="text-center py-20 bg-white rounded-3xl border border-stone-100 shadow-sm">
                    <div className="w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: 'rgba(184,151,90,0.08)' }}>
                        <Users className="h-10 w-10" style={{ color: GOLD }} />
                    </div>
                    <h3 className="text-xl font-black text-stone-900 mb-2">No parents found</h3>
                    <p className="text-stone-400 mb-6">{searchTerm || filterParentType !== 'all' ? 'Try adjusting your search or filters' : 'Get started by adding your first parent'}</p>
                    <button onClick={() => { resetForm(); setOpen(true); }}
                        className="px-6 py-2.5 rounded-2xl font-black text-sm text-black shadow-lg transition-all hover:opacity-90"
                        style={{ background: `linear-gradient(135deg, ${GOLD}, #D4B88C)` }}>
                        <Plus className="h-4 w-4 inline mr-2" />Add Parent
                    </button>
                </div>
            )}

            {/* Add/Edit Dialog */}
            <Dialog open={open} onOpenChange={isOpen => { setOpen(isOpen); if (!isOpen) resetForm(); }}>
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-white rounded-3xl border border-stone-100 shadow-2xl p-0">
                    <div className="h-1 w-full rounded-t-3xl" style={{ background: `linear-gradient(to right, ${GOLD}, #D4B88C)` }} />
                    <div className="p-8">
                        <DialogHeader className="mb-6">
                            <DialogTitle className="text-2xl font-black tracking-tighter text-stone-900">
                                {editMode ? 'Edit Parent' : 'Add New Parent'}
                            </DialogTitle>
                            <DialogDescription className="text-stone-400">
                                {editMode ? "Update the parent's information below." : "Enter the parent's information and connect them to their mentee(s)."}
                            </DialogDescription>
                        </DialogHeader>
                        {error && (
                            <Alert className="mb-5 rounded-2xl border border-red-200 bg-red-50">
                                <AlertCircle className="h-4 w-4 text-red-500" />
                                <AlertDescription className="text-red-600">{error}</AlertDescription>
                            </Alert>
                        )}
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label className={labelClass}>Parent Type *</Label>
                                <Select value={newParent.parent} onValueChange={v => handleSelectChange('parent', v)}>
                                    <SelectTrigger className={inputClass}><SelectValue placeholder="Select parent type" /></SelectTrigger>
                                    <SelectContent className="rounded-2xl w-full bg-white">
                                        <SelectItem value="Father">Father</SelectItem>
                                        <SelectItem value="Mother">Mother</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {[
                                { id: 'name', label: 'Full Name *', type: 'text', placeholder: "Enter parent's full name" },
                                { id: 'email', label: 'Email Address *', type: 'email', placeholder: 'parent@example.com' },
                                { id: 'phone', label: 'Phone Number *', type: 'text', placeholder: '+254 712 345 678' },
                                { id: 'profession', label: 'Profession *', type: 'text', placeholder: 'e.g., Teacher, Engineer, Doctor' },
                                { id: 'residence', label: 'Residence *', type: 'text', placeholder: 'e.g., Nairobi, Mombasa, Kisumu' },
                            ].map(f => (
                                <div key={f.id} className="space-y-1.5">
                                    <Label className={labelClass}>{f.label}</Label>
                                    <Input id={f.id} name={f.id} type={f.type} placeholder={f.placeholder}
                                        value={newParent[f.id]} onChange={handleInputChange} className={inputClass} />
                                </div>
                            ))}
                            <div className="space-y-1.5">
                                <Label className={labelClass}>Connected Mentee(s) *</Label>
                                <Select value={newParent.mentee[0] || ''} onValueChange={v => handleSelectChange('mentee', [v])}>
                                    <SelectTrigger className={inputClass}><SelectValue placeholder="Select mentee" /></SelectTrigger>
                                    <SelectContent className="rounded-2xl w-full bg-white">
                                        {mentees.map(m => <SelectItem key={m._id} value={m._id}>{m.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-stone-400">Note: Currently supports one mentee per parent. Multiple mentee support coming soon.</p>
                            </div>
                        </div>
                        <DialogFooter className="mt-8 gap-3">
                            <button onClick={() => { setOpen(false); resetForm(); }} disabled={saving}
                                className="px-5 py-2.5 rounded-2xl font-black text-sm text-stone-600 border border-stone-200 hover:bg-stone-50 transition-all">Cancel</button>
                            <button onClick={editMode ? handleEditParent : handleAddParent} disabled={saving}
                                className="px-6 py-2.5 rounded-2xl font-black text-sm text-black shadow-lg transition-all hover:opacity-90 flex items-center gap-2"
                                style={{ background: `linear-gradient(135deg, ${GOLD}, #D4B88C)` }}>
                                {saving && <Loader2 className="h-3 w-3 animate-spin" />}
                                {editMode ? 'Update Parent' : 'Add Parent'}
                            </button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}