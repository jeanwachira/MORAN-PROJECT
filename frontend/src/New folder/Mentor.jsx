import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { React, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import API from '@/api';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Edit, Mail, Phone, User, Search, Filter, MoreVertical, Star, Camera, Loader2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const GOLD = '#B8975A';
const inputClass = "h-10 rounded-xl text-stone-900 text-sm border-stone-200 focus:border-[#B8975A] focus:ring-0";
const labelClass = "text-xs font-black tracking-widest uppercase text-stone-500";

export default function Mentors() {
    const [mentors, setMentors] = useState([]);
    const [filteredMentors, setFilteredMentors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editingMentor, setEditingMentor] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterProfession, setFilterProfession] = useState('all');
    const [newMentor, setNewMentor] = useState({ name: '', profession: '', contactEmail: '', phone: '', profilepic: '' });
    const [uploadingPicFor, setUploadingPicFor] = useState(null); // mentorId currently uploading

    const uploadToCloudinary = async (file) => {
        const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', UPLOAD_PRESET);
        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
            method: 'POST',
            body: formData,
        });
        if (!res.ok) throw new Error('Cloudinary upload failed');
        const data = await res.json();
        return data.secure_url;
    };

    const handleProfilePicUpload = async (mentorId, file) => {
        if (!file) return;
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) { alert('Image must be under 5MB'); return; }
        try {
            setUploadingPicFor(mentorId);
            const url = await uploadToCloudinary(file);
            const response = await API.put(`/mentors/${mentorId}/profilepic`, { profilepic: url });
            setMentors(prev => prev.map(m => m._id === mentorId ? { ...m, profilepic: response.data.profilepic } : m));
        } catch (error) {
            console.error(error);
            alert('Failed to upload profile picture. Please try again.');
        } finally {
            setUploadingPicFor(null);
        }
    };

    useEffect(() => {
        const fetchMentors = async () => {
            try {
                const response = await API.get('/mentors');
                setMentors(response.data);
                setFilteredMentors(response.data);
            } catch (error) { console.error(error); }
            finally { setLoading(false); }
        };
        fetchMentors();
    }, []);

    useEffect(() => {
        let filtered = mentors;
        if (searchTerm) {
            filtered = filtered.filter(m =>
                m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                m.profession.toLowerCase().includes(searchTerm.toLowerCase()) ||
                m.contactEmail.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        if (filterProfession !== 'all') filtered = filtered.filter(m => m.profession === filterProfession);
        setFilteredMentors(filtered);
    }, [searchTerm, filterProfession, mentors]);

    const handleAddMentor = async () => {
        try {
            if (!newMentor.name || !newMentor.profession || !newMentor.contactEmail || !newMentor.phone) {
                alert('Please fill all required fields'); return;
            }
            const response = await API.post('/mentors', newMentor);
            setMentors([...mentors, response.data]);
            setNewMentor({ name: '', profession: '', contactEmail: '', phone: '', profilepic: '' });
            setOpen(false);
        } catch (error) { console.error(error); alert('Error adding mentor. Please try again.'); }
    };

    const handleDeleteMentor = async (mentorId) => {
        if (!window.confirm('Are you sure you want to delete this mentor?')) return;
        try {
            await API.delete(`/mentors/${mentorId}`);
            setMentors(mentors.filter(m => m._id !== mentorId));
        } catch (error) { console.error(error); alert('Error deleting mentor. Please try again.'); }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewMentor(prev => ({ ...prev, [name]: value }));
    };

    const openEditMentor = (mentor) => {
        setEditingMentor({ ...mentor });
        setEditOpen(true);
    };

    const handleEditMentor = async () => {
        try {
            if (!editingMentor.name || !editingMentor.profession || !editingMentor.contactEmail || !editingMentor.phone) {
                alert('Please fill all required fields'); return;
            }
            const response = await API.put(`/mentors/${editingMentor._id}`, editingMentor);
            setMentors(mentors.map(m => m._id === editingMentor._id ? response.data : m));
            setEditOpen(false);
            setEditingMentor(null);
        } catch (error) { console.error(error); alert('Error updating mentor. Please try again.'); }
    };

    const handleEditInputChange = (e) => {
        const { name, value } = e.target;
        setEditingMentor(prev => ({ ...prev, [name]: value }));
    };

    const getInitials = (name) => name.split(' ').map(n => n[0]).join('').toUpperCase();
    const professions = [...new Set(mentors.map(m => m.profession))];

    if (loading) {
        return (
            <div className="py-8 animate-pulse">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-1 h-7 rounded-full bg-stone-200" />
                    <div className="h-8 bg-stone-200 rounded-2xl w-36" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {[1,2,3,4].map(i => <div key={i} className="bg-white rounded-3xl h-52 border border-stone-100 shadow-sm" />)}
                </div>
            </div>
        );
    }

    const MentorCard = ({ mentor }) => (
        <div className="bg-white rounded-3xl border border-stone-100 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-0.5 rounded-t-3xl" style={{ background: `linear-gradient(to right, ${GOLD}, transparent)` }} />
            <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className="relative group/avatar">
                            <Avatar className="h-14 w-14 rounded-2xl">
                                <AvatarImage src={mentor.profilepic} alt={mentor.name} />
                                <AvatarFallback className="rounded-2xl font-black text-black text-base"
                                    style={{ background: `linear-gradient(135deg, ${GOLD}, #D4B88C)` }}>
                                    {getInitials(mentor.name)}
                                </AvatarFallback>
                            </Avatar>
                            <label htmlFor={`pic-${mentor._id}`}
                                className="absolute inset-0 rounded-2xl flex items-center justify-center cursor-pointer opacity-0 group-hover/avatar:opacity-100 transition-opacity"
                                style={{ background: 'rgba(0,0,0,0.45)' }}>
                                {uploadingPicFor === mentor._id
                                    ? <Loader2 className="h-5 w-5 text-white animate-spin" />
                                    : <Camera className="h-5 w-5 text-white" />}
                            </label>
                            <input id={`pic-${mentor._id}`} type="file" accept="image/*" className="hidden"
                                onChange={e => handleProfilePicUpload(mentor._id, e.target.files[0])} />
                        </div>
                        <div>
                            <h3 className="font-black text-stone-900">{mentor.name}</h3>
                            <span className="text-xs font-black px-2 py-0.5 rounded-full mt-1 inline-block"
                                style={{ backgroundColor: 'rgba(184,151,90,0.1)', color: GOLD }}>
                                {mentor.profession}
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
                            <DropdownMenuItem className="font-semibold rounded-xl" onClick={() => openEditMentor(mentor)}><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-500 font-semibold rounded-xl" onClick={() => handleDeleteMentor(mentor._id)}>
                                <Trash2 className="h-4 w-4 mr-2" />Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <div className="space-y-2 mb-5">
                    <div className="flex items-center gap-2 text-sm text-stone-500">
                        <Mail className="h-3.5 w-3.5" style={{ color: GOLD }} />
                        <span className="truncate font-medium">{mentor.contactEmail}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-stone-500">
                        <Phone className="h-3.5 w-3.5" style={{ color: GOLD }} />
                        <span className="font-medium">{mentor.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm" style={{ color: GOLD }}>
                        <Star className="h-3.5 w-3.5" />
                        <span className="font-semibold text-xs">Available for mentoring</span>
                    </div>
                </div>
                <div className="flex gap-2 pt-4" style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                    <button className="flex-1 h-9 rounded-xl text-xs font-black border flex items-center justify-center gap-1.5 transition-all hover:bg-stone-50"
                        style={{ borderColor: 'rgba(184,151,90,0.3)', color: GOLD }}
                        onClick={() => openEditMentor(mentor)}>
                        <Edit className="h-3 w-3" /> Edit
                    </button>
                    <button className="flex-1 h-9 rounded-xl text-xs font-black text-black flex items-center justify-center gap-1.5 transition-all hover:opacity-90"
                        style={{ background: `linear-gradient(135deg, ${GOLD}, #D4B88C)` }}>
                        <Mail className="h-3 w-3" /> Contact
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="py-2">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-1 h-7 rounded-full" style={{ background: `linear-gradient(to bottom, ${GOLD}, transparent)` }} />
                        <h1 className="text-3xl font-black tracking-tighter text-stone-900">Mentors</h1>
                    </div>
                    <p className="text-stone-400 font-medium ml-4">Connect with experienced professionals guiding the next generation</p>
                </div>
                <button onClick={() => setOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-sm text-black shadow-lg transition-all hover:opacity-90 active:scale-[0.97]"
                    style={{ background: `linear-gradient(135deg, ${GOLD}, #D4B88C)` }}>
                    <Plus className="h-4 w-4" /> Add Mentor
                </button>
            </div>

            {/* Search & Filter */}
            <div className="bg-white rounded-3xl border border-stone-100 shadow-sm p-5 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: GOLD }} />
                        <Input placeholder="Search mentors by name, profession, or email..."
                            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                            className="pl-11 h-10 rounded-2xl border-stone-200 focus:border-[#B8975A]" />
                    </div>
                    <Select value={filterProfession} onValueChange={setFilterProfession}>
                        <SelectTrigger className="h-10 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#B8975A] focus:border-[#B8975A] hover:border-[#B8975A] transition-colors">
                            <Filter className="h-4 w-4 mr-2" style={{ color: GOLD }} />
                            <SelectValue placeholder="Filter by profession" />
                        </SelectTrigger>
                        <SelectContent className="z-50 rounded-xl border border-stone-200 bg-white shadow-lg text-sm text-stone-900 p-1">
                            <SelectItem className="rounded-lg px-3 py-2 cursor-pointer hover:bg-amber-50 focus:bg-amber-50 text-stone-800 font-medium" value="all">All Professions</SelectItem>
                            {professions.map(p => <SelectItem className="rounded-lg px-3 py-2 cursor-pointer hover:bg-amber-50 focus:bg-amber-50 text-stone-800 font-medium" key={p} value={p}>{p}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="grid" className="space-y-5">
                <TabsList className="bg-white border border-stone-100 shadow-sm rounded-2xl p-1 h-auto">
                    <TabsTrigger value="grid" className="rounded-xl font-black text-xs px-4 py-2 data-[state=active]:text-black"
                        style={{}}>Grid View</TabsTrigger>
                    <TabsTrigger value="list" className="rounded-xl font-black text-xs px-4 py-2 data-[state=active]:text-black">List View</TabsTrigger>
                </TabsList>

                <TabsContent value="grid">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {filteredMentors.map(mentor => <MentorCard key={mentor._id} mentor={mentor} />)}
                    </div>
                </TabsContent>

                <TabsContent value="list">
                    <div className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
                        <div className="divide-y divide-stone-50">
                            {filteredMentors.map(mentor => (
                                <div key={mentor._id} className="p-5 hover:bg-stone-50/60 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="relative group/avatar flex-shrink-0">
                                                <Avatar className="h-12 w-12 rounded-2xl">
                                                    <AvatarImage src={mentor.profilepic} alt={mentor.name} />
                                                    <AvatarFallback className="rounded-2xl font-black text-black"
                                                        style={{ background: `linear-gradient(135deg, ${GOLD}, #D4B88C)` }}>
                                                        {getInitials(mentor.name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <label htmlFor={`pic-list-${mentor._id}`}
                                                    className="absolute inset-0 rounded-2xl flex items-center justify-center cursor-pointer opacity-0 group-hover/avatar:opacity-100 transition-opacity"
                                                    style={{ background: 'rgba(0,0,0,0.45)' }}>
                                                    {uploadingPicFor === mentor._id
                                                        ? <Loader2 className="h-4 w-4 text-white animate-spin" />
                                                        : <Camera className="h-4 w-4 text-white" />}
                                                </label>
                                                <input id={`pic-list-${mentor._id}`} type="file" accept="image/*" className="hidden"
                                                    onChange={e => handleProfilePicUpload(mentor._id, e.target.files[0])} />
                                            </div>
                                            <div>
                                                <h3 className="font-black text-stone-900">{mentor.name}</h3>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-xs font-black px-2 py-0.5 rounded-full"
                                                        style={{ backgroundColor: 'rgba(184,151,90,0.1)', color: GOLD }}>
                                                        {mentor.profession}
                                                    </span>
                                                    <span className="text-xs text-stone-400 font-medium flex items-center gap-1">
                                                        <Mail className="h-3 w-3" />{mentor.contactEmail}
                                                    </span>
                                                    <span className="text-xs text-stone-400 font-medium flex items-center gap-1">
                                                        <Phone className="h-3 w-3" />{mentor.phone}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button className="h-9 px-4 rounded-xl text-xs font-black border transition-all hover:bg-stone-50"
                                                style={{ borderColor: 'rgba(184,151,90,0.3)', color: GOLD }}
                                                onClick={() => openEditMentor(mentor)}>Edit</button>
                                            <button onClick={() => handleDeleteMentor(mentor._id)}
                                                className="h-9 px-3 rounded-xl text-xs font-black border border-red-100 text-red-400 hover:bg-red-50 transition-all">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

            {filteredMentors.length === 0 && !loading && (
                <div className="text-center py-20 bg-white rounded-3xl border border-stone-100 shadow-sm">
                    <div className="w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center"
                        style={{ backgroundColor: 'rgba(184,151,90,0.08)' }}>
                        <User className="h-10 w-10" style={{ color: GOLD }} />
                    </div>
                    <h3 className="text-xl font-black text-stone-900 mb-2">No mentors found</h3>
                    <p className="text-stone-400 mb-6">
                        {searchTerm || filterProfession !== 'all' ? 'Try adjusting your search or filters' : 'Get started by adding your first mentor'}
                    </p>
                    <button onClick={() => setOpen(true)}
                        className="px-6 py-2.5 rounded-2xl font-black text-sm text-black shadow-lg transition-all hover:opacity-90"
                        style={{ background: `linear-gradient(135deg, ${GOLD}, #D4B88C)` }}>
                        <Plus className="h-4 w-4 inline mr-2" />Add Mentor
                    </button>
                </div>
            )}

            {/* Add Mentor Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-md bg-white rounded-3xl border border-stone-100 shadow-2xl p-0">
                    <div className="h-1 w-full rounded-t-3xl" style={{ background: `linear-gradient(to right, ${GOLD}, #D4B88C)` }} />
                    <div className="p-8">
                        <DialogHeader className="mb-6">
                            <DialogTitle className="text-2xl font-black tracking-tighter text-stone-900">Add New Mentor</DialogTitle>
                            <DialogDescription className="text-stone-400">Enter the details for the new mentor. All fields are required.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            {[
                                { id: 'name', label: 'Full Name *', type: 'text', placeholder: 'Enter full name' },
                                { id: 'profession', label: 'Profession *', type: 'text', placeholder: 'Enter profession' },
                                { id: 'contactEmail', label: 'Email *', type: 'email', placeholder: 'Enter email address' },
                                { id: 'phone', label: 'Phone *', type: 'text', placeholder: 'Enter phone number' },
                            ].map(f => (
                                <div key={f.id} className="space-y-1.5">
                                    <Label className={labelClass}>{f.label}</Label>
                                    <Input id={f.id} name={f.id} type={f.type} placeholder={f.placeholder}
                                        value={newMentor[f.id]} onChange={handleInputChange} className={inputClass} />
                                </div>
                            ))}
                        </div>
                        <DialogFooter className="mt-8 gap-3">
                            <button onClick={() => setOpen(false)}
                                className="px-5 py-2.5 rounded-2xl font-black text-sm text-stone-600 border border-stone-200 hover:bg-stone-50 transition-all">
                                Cancel
                            </button>
                            <button onClick={handleAddMentor}
                                className="px-6 py-2.5 rounded-2xl font-black text-sm text-black shadow-lg transition-all hover:opacity-90"
                                style={{ background: `linear-gradient(135deg, ${GOLD}, #D4B88C)` }}>
                                Add Mentor
                            </button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Mentor Dialog */}
            {editingMentor && (
                <Dialog open={editOpen} onOpenChange={isOpen => { setEditOpen(isOpen); if (!isOpen) setEditingMentor(null); }}>
                    <DialogContent className="max-w-md bg-white rounded-3xl border border-stone-100 shadow-2xl p-0">
                        <div className="h-1 w-full rounded-t-3xl" style={{ background: `linear-gradient(to right, ${GOLD}, #D4B88C)` }} />
                        <div className="p-8">
                            <DialogHeader className="mb-6">
                                <DialogTitle className="text-2xl font-black tracking-tighter text-stone-900">Edit Mentor</DialogTitle>
                                <DialogDescription className="text-stone-400">Update the details for this mentor.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                {[
                                    { id: 'name', label: 'Full Name *', type: 'text', placeholder: 'Enter full name' },
                                    { id: 'profession', label: 'Profession *', type: 'text', placeholder: 'Enter profession' },
                                    { id: 'contactEmail', label: 'Email *', type: 'email', placeholder: 'Enter email address' },
                                    { id: 'phone', label: 'Phone *', type: 'text', placeholder: 'Enter phone number' },
                                ].map(f => (
                                    <div key={f.id} className="space-y-1.5">
                                        <Label className={labelClass}>{f.label}</Label>
                                        <Input id={f.id} name={f.id} type={f.type} placeholder={f.placeholder}
                                            value={editingMentor[f.id] || ''} onChange={handleEditInputChange} className={inputClass} />
                                    </div>
                                ))}
                            </div>
                            <DialogFooter className="mt-8 gap-3">
                                <button onClick={() => { setEditOpen(false); setEditingMentor(null); }}
                                    className="px-5 py-2.5 rounded-2xl font-black text-sm text-stone-600 border border-stone-200 hover:bg-stone-50 transition-all">
                                    Cancel
                                </button>
                                <button onClick={handleEditMentor}
                                    className="px-6 py-2.5 rounded-2xl font-black text-sm text-black shadow-lg transition-all hover:opacity-90"
                                    style={{ background: `linear-gradient(135deg, ${GOLD}, #D4B88C)` }}>
                                    Save Changes
                                </button>
                            </DialogFooter>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}