import { React, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import API from '@/api';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit, Mail, Phone, Calendar, School, User, Stethoscope, Users, GraduationCap } from 'lucide-react';

const GOLD = '#B8975A';

const PageHeader = ({ title, subtitle, onAdd, addLabel }) => (
    <div className="flex justify-between items-center mb-8">
        <div>
            <div className="flex items-center gap-3 mb-1">
                <div className="w-1 h-7 rounded-full" style={{ background: `linear-gradient(to bottom, ${GOLD}, transparent)` }} />
                <h1 className="text-3xl font-black tracking-tighter text-stone-900">{title}</h1>
            </div>
            <p className="text-stone-400 font-medium ml-4">{subtitle}</p>
        </div>
        <button onClick={onAdd}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-sm text-black shadow-lg transition-all hover:opacity-90 active:scale-[0.97]"
            style={{ background: `linear-gradient(135deg, ${GOLD}, #D4B88C)` }}>
            <Plus className="h-4 w-4" />
            {addLabel}
        </button>
    </div>
);

const CardTopStripe = () => (
    <div className="absolute top-0 left-0 w-full h-0.5 rounded-t-3xl"
        style={{ background: `linear-gradient(to right, ${GOLD}, transparent)` }} />
);

export default function Mentees() {
    const [mentees, setMentees] = useState([]);
    const [cohorts, setCohorts] = useState([]);
    const [parents, setParents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [newMentee, setNewMentee] = useState({
        name: '', cohort: '', email: '', dob: '', schoolSystem: '8-4-4',
        grade: '', phone: '', school: '', parents: [], procedure: '',
        doctorName: '', doctorEmail: '', profilepic: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [menteesRes, cohortsRes, parentsRes] = await Promise.all([
                    API.get('/mentees'), API.get('/cohorts'), API.get('/parents')
                ]);
                setMentees(menteesRes.data);
                setCohorts(cohortsRes.data);
                setParents(parentsRes.data);
            } catch (error) { console.error(error); }
            finally { setLoading(false); }
        };
        fetchData();
    }, []);

    const handleAddMentee = async () => {
        try {
            const requiredFields = ['name','cohort','email','dob','schoolSystem','grade','phone','school','procedure','doctorName','doctorEmail'];
            const missingFields = requiredFields.filter(f => !newMentee[f]);
            if (missingFields.length > 0) { alert(`Please fill all required fields: ${missingFields.join(', ')}`); return; }
            const response = await API.post('/mentees', {
                ...newMentee,
                age: parseInt(newMentee.age),
                dob: new Date(newMentee.dob),
                parents: Array.isArray(newMentee.parents) ? newMentee.parents : [newMentee.parents]
            });
            setMentees([...mentees, response.data]);
            setNewMentee({ name:'',cohort:'',email:'',dob:'',schoolSystem:'8-4-4',grade:'',phone:'',school:'',parents:[],procedure:'',doctorName:'',doctorEmail:'',profilepic:'' });
            setOpen(false);
        } catch (error) { console.error(error); alert('Error adding mentee. Please try again.'); }
    };

    const handleDeleteMentee = async (menteeId) => {
        if (!window.confirm('Are you sure you want to delete this mentee?')) return;
        try {
            await API.delete(`/mentees/${menteeId}`);
            setMentees(mentees.filter(m => m._id !== menteeId));
        } catch (error) { console.error(error); alert('Error deleting mentee. Please try again.'); }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewMentee(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name, value) => {
        setNewMentee(prev => ({ ...prev, [name]: value }));
    };

    const getInitials = (name) => name.split(' ').map(n => n[0]).join('').toUpperCase();

    const calculateAge = (dob) => {
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
        return age;
    };

    if (loading) {
        return (
            <div className="py-8">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-1 h-7 rounded-full" style={{ background: `linear-gradient(to bottom, ${GOLD}, transparent)` }} />
                    <div className="h-8 bg-stone-200 rounded-2xl w-40 animate-pulse" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {[1,2,3,4,5,6,7,8].map(i => (
                        <div key={i} className="bg-white rounded-3xl p-6 border border-stone-100 shadow-sm animate-pulse">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-14 h-14 rounded-2xl bg-stone-200" />
                                <div className="flex-1"><div className="h-4 bg-stone-200 rounded w-3/4 mb-2" /><div className="h-3 bg-stone-100 rounded w-1/2" /></div>
                            </div>
                            <div className="space-y-2">
                                {[1,2,3].map(j => <div key={j} className="h-3 bg-stone-100 rounded w-full" />)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const inputClass = "h-10 rounded-xl text-stone-900 text-sm border-stone-200 focus:border-[#B8975A] focus:ring-0";
    const labelClass = "text-xs font-black tracking-widest uppercase text-stone-500";
    const sectionClass = "text-sm font-black tracking-wide text-stone-900 pb-2 mb-1";

    return (
        <div className="py-2">
            <PageHeader title="Candidates" subtitle="Manage and track all mentees in the program"
                onAdd={() => setOpen(true)} addLabel="Add Candidate" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {mentees.map((mentee) => (
                    <div key={mentee._id}
                        className="bg-white rounded-3xl border border-stone-100 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden group">
                        <CardTopStripe />
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <Avatar className="h-14 w-14 rounded-2xl">
                                    <AvatarImage src={mentee.profilepic} alt={mentee.name} />
                                    <AvatarFallback className="rounded-2xl font-black text-black text-base"
                                        style={{ background: `linear-gradient(135deg, ${GOLD}, #D4B88C)` }}>
                                        {getInitials(mentee.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-black text-stone-900 truncate">{mentee.name}</h3>
                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                        <span className="text-xs font-black px-2 py-0.5 rounded-full"
                                            style={{ backgroundColor: 'rgba(184,151,90,0.1)', color: GOLD }}>
                                            {mentee.schoolSystem}
                                        </span>
                                        <span className="text-xs text-stone-400 font-semibold">Grade {mentee.grade}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 mb-5">
                                {[
                                    { icon: Mail, val: mentee.email },
                                    { icon: Phone, val: mentee.phone },
                                    { icon: School, val: mentee.school },
                                    { icon: Calendar, val: `${calculateAge(mentee.dob)} years old` },
                                    { icon: Stethoscope, val: mentee.procedure },
                                ].map(({ icon: Icon, val }, i) => (
                                    <div key={i} className="flex items-center gap-2 text-sm text-stone-500">
                                        <Icon className="h-3.5 w-3.5 flex-shrink-0" style={{ color: GOLD }} />
                                        <span className="truncate font-medium">{val}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-2 pt-4" style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                                <button className="flex-1 h-9 rounded-xl text-xs font-black border flex items-center justify-center gap-1.5 transition-all hover:bg-stone-50"
                                    style={{ borderColor: 'rgba(184,151,90,0.3)', color: GOLD }}>
                                    <Edit className="h-3 w-3" /> Edit
                                </button>
                                <button onClick={() => handleDeleteMentee(mentee._id)}
                                    className="flex-1 h-9 rounded-xl text-xs font-black border border-red-100 text-red-400 flex items-center justify-center gap-1.5 transition-all hover:bg-red-50">
                                    <Trash2 className="h-3 w-3" /> Delete
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {mentees.length === 0 && !loading && (
                <div className="text-center py-20 bg-white rounded-3xl border border-stone-100 shadow-sm">
                    <div className="w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center"
                        style={{ backgroundColor: 'rgba(184,151,90,0.08)' }}>
                        <User className="h-10 w-10" style={{ color: GOLD }} />
                    </div>
                    <h3 className="text-xl font-black text-stone-900 mb-2">No candidates found</h3>
                    <p className="text-stone-400 mb-6">Get started by adding your first mentee.</p>
                    <button onClick={() => setOpen(true)}
                        className="px-6 py-2.5 rounded-2xl font-black text-sm text-black shadow-lg transition-all hover:opacity-90"
                        style={{ background: `linear-gradient(135deg, ${GOLD}, #D4B88C)` }}>
                        <Plus className="h-4 w-4 inline mr-2" />Add Candidate
                    </button>
                </div>
            )}

            {/* Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl border border-stone-100 shadow-2xl p-0">
                    <div className="h-1 w-full rounded-t-3xl" style={{ background: `linear-gradient(to right, ${GOLD}, #D4B88C)` }} />
                    <div className="p-8">
                        <DialogHeader className="mb-6">
                            <DialogTitle className="text-2xl font-black tracking-tighter text-stone-900">Add New Candidate</DialogTitle>
                            <DialogDescription className="text-stone-400">Enter the details for the new mentee. All fields are required unless marked optional.</DialogDescription>
                        </DialogHeader>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <p className={sectionClass} style={{ borderBottom: `2px solid ${GOLD}`, paddingBottom: '8px' }}>Personal Information</p>
                            </div>
                            {[
                                { id: 'name', label: 'Full Name *', type: 'text', placeholder: 'Enter full name' },
                                { id: 'email', label: 'Email *', type: 'email', placeholder: 'Enter email address' },
                                { id: 'phone', label: 'Phone *', type: 'text', placeholder: 'Enter phone number' },
                                { id: 'dob', label: 'Date of Birth *', type: 'date', placeholder: '' },
                            ].map(f => (
                                <div key={f.id} className="space-y-1.5">
                                    <Label className={labelClass}>{f.label}</Label>
                                    <Input id={f.id} name={f.id} type={f.type} placeholder={f.placeholder}
                                        value={newMentee[f.id]} onChange={handleInputChange} className={inputClass} />
                                </div>
                            ))}

                            <div className="md:col-span-2 mt-3">
                                <p className={sectionClass} style={{ borderBottom: `2px solid ${GOLD}`, paddingBottom: '8px' }}>School Information</p>
                            </div>
                            <div className="space-y-1.5">
                                <Label className={labelClass}>School System *</Label>
                                <Select value={newMentee.schoolSystem} onValueChange={v => handleSelectChange('schoolSystem', v)}>
                                    <SelectTrigger className={inputClass }><SelectValue /></SelectTrigger>
                                    <SelectContent className="w-full bg-white">
                                        <SelectItem value="8-4-4">8-4-4 System</SelectItem>
                                        <SelectItem value="IGCSE">IGCSE</SelectItem>
                                        <SelectItem value="CBC">CBC</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className={labelClass}>Grade *</Label>
                                <Input name="grade" placeholder="Enter grade" value={newMentee.grade} onChange={handleInputChange} className={inputClass} />
                            </div>
                            <div className="space-y-1.5 md:col-span-2">
                                <Label className={labelClass}>School *</Label>
                                <Input name="school" placeholder="Enter school name" value={newMentee.school} onChange={handleInputChange} className={inputClass} />
                            </div>

                            <div className="md:col-span-2 mt-3">
                                <p className={sectionClass} style={{ borderBottom: `2px solid ${GOLD}`, paddingBottom: '8px' }}>Medical Information</p>
                            </div>
                            <div className="space-y-1.5 md:col-span-2">
                                <Label className={labelClass}>Medical Procedure *</Label>
                                <Input name="procedure" placeholder="Enter medical procedure" value={newMentee.procedure} onChange={handleInputChange} className={inputClass} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className={labelClass}>Doctor Name *</Label>
                                <Input name="doctorName" placeholder="Enter doctor's name" value={newMentee.doctorName} onChange={handleInputChange} className={inputClass} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className={labelClass}>Doctor Email *</Label>
                                <Input name="doctorEmail" type="email" placeholder="Enter doctor's email" value={newMentee.doctorEmail} onChange={handleInputChange} className={inputClass} />
                            </div>

                            <div className="md:col-span-2 mt-3">
                                <p className={sectionClass} style={{ borderBottom: `2px solid ${GOLD}`, paddingBottom: '8px' }}>Additional Information</p>
                            </div>
                            <div className="space-y-1.5">
                                <Label className={labelClass}>Cohort *</Label>
                                <Select value={newMentee.cohort} onValueChange={v => handleSelectChange('cohort', v)}>
                                    <SelectTrigger className={inputClass}><SelectValue placeholder="Select cohort" /></SelectTrigger>
                                    <SelectContent className="w-full bg-white">
                                        {cohorts.map(c => <SelectItem key={c._id} value={c._id}>{c.riika} - {c.year}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className={labelClass}>Parents</Label>
                                <Select value={newMentee.parents[0]} onValueChange={v => handleSelectChange('parents', [v])}>
                                    <SelectTrigger className={inputClass}><SelectValue placeholder="Select parent" /></SelectTrigger>
                                    <SelectContent className="w-full bg-white">
                                        {parents.map(p => <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <DialogFooter className="mt-8 gap-3">
                            <button onClick={() => setOpen(false)}
                                className="px-5 py-2.5 rounded-2xl font-black text-sm text-stone-600 border border-stone-200 hover:bg-stone-50 transition-all">
                                Cancel
                            </button>
                            <button onClick={handleAddMentee}
                                className="px-6 py-2.5 rounded-2xl font-black text-sm text-black shadow-lg transition-all hover:opacity-90"
                                style={{ background: `linear-gradient(135deg, ${GOLD}, #D4B88C)` }}>
                                Add Candidate
                            </button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}