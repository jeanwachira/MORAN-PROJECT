import { React, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import API from '@/api';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit, Mail, Phone, Calendar, School, User, Stethoscope, Users, GraduationCap, Camera, Loader2, Search, Filter, X, FileSpreadsheet, Download, Upload, CheckCircle, AlertTriangle, FileDown } from 'lucide-react';

const GOLD = '#B8975A';

const parentTypeColors = {
    'Father':   { bg: 'rgba(96,165,250,0.1)',  color: '#60a5fa', border: 'rgba(96,165,250,0.25)' },
    'Mother':   { bg: 'rgba(244,114,182,0.1)', color: '#f472b6', border: 'rgba(244,114,182,0.25)' },
    'Guardian': { bg: 'rgba(134,239,172,0.1)', color: '#22c55e', border: 'rgba(134,239,172,0.25)' },
};

const PageHeader = ({ title, subtitle, onAdd, addLabel, onImport }) => (
    <div className="flex justify-between items-center mb-8">
        <div>
            <div className="flex items-center gap-3 mb-1">
                <div className="w-1 h-7 rounded-full" style={{ background: `linear-gradient(to bottom, ${GOLD}, transparent)` }} />
                <h1 className="text-3xl font-black tracking-tighter text-stone-900">{title}</h1>
            </div>
            <p className="text-stone-400 font-medium ml-4">{subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
            <button onClick={onImport}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl font-black text-sm text-stone-700 border border-stone-200 bg-white shadow-sm transition-all hover:bg-stone-50 hover:border-stone-300 active:scale-[0.97]">
                <FileSpreadsheet className="h-4 w-4" style={{ color: GOLD }} />
                Import Excel
            </button>
            <button onClick={onAdd}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-sm text-black shadow-lg transition-all hover:opacity-90 active:scale-[0.97]"
                style={{ background: `linear-gradient(135deg, ${GOLD}, #D4B88C)` }}>
                <Plus className="h-4 w-4" />
                {addLabel}
            </button>
        </div>
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
    const [editOpen, setEditOpen] = useState(false);
    const [editingMentee, setEditingMentee] = useState(null);
    const [uploadingPicFor, setUploadingPicFor] = useState(null);
    const navigate = useNavigate();
    const [importOpen, setImportOpen] = useState(false);
    const [importRows, setImportRows] = useState([]);
    const [importErrors, setImportErrors] = useState([]);
    const [importing, setImporting] = useState(false);
    const [importDone, setImportDone] = useState(null); // { success, failed }
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCohort, setFilterCohort] = useState('all');
    const [filterYear, setFilterYear] = useState('all');
    const [filterSchoolSystem, setFilterSchoolSystem] = useState('all');

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

    // ── Excel import ─────────────────────────────────────────────────────────
    const TEMPLATE_COLS = ['name','email','phone','dob','schoolSystem','grade','school','procedure','doctorName','doctorEmail'];

    const downloadTemplate = () => {
        const header = TEMPLATE_COLS.join(',');
        const example = 'John Doe,john@email.com,+254712345678,2008-03-15,8-4-4,Form 2,Nairobi School,Circumcision,Dr. Kamau,drkamau@hospital.com';
        const csv = `${header}\n${example}`;
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'mentees_template.csv'; a.click();
        URL.revokeObjectURL(url);
    };

    const handleFileUpload = async (file) => {
        if (!file) return;
        const ext = file.name.split('.').pop().toLowerCase();
        setImportErrors([]); setImportRows([]); setImportDone(null);
        try {
            let rows = [];
            if (ext === 'csv') {
                const text = await file.text();
                const lines = text.trim().split('\n').filter(Boolean);
                const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g,''));
                rows = lines.slice(1).map((line, i) => {
                    const vals = line.split(',').map(v => v.trim());
                    const row = {};
                    headers.forEach((h, idx) => { row[h] = vals[idx] || ''; });
                    row._rowNum = i + 2;
                    return row;
                });
            } else if (ext === 'xlsx' || ext === 'xls') {
                const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs');
                const buf = await file.arrayBuffer();
                const wb = XLSX.read(buf, { type: 'array' });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const data = XLSX.utils.sheet_to_json(ws, { defval: '' });
                rows = data.map((r, i) => {
                    const norm = {};
                    Object.keys(r).forEach(k => { norm[k.trim().toLowerCase().replace(/\s+/g,'')] = String(r[k]).trim(); });
                    norm._rowNum = i + 2;
                    return norm;
                });
            } else {
                setImportErrors(['Please upload a .csv, .xlsx or .xls file']); return;
            }
            // Validate rows
            const required = ['name','email','phone','dob','schoolsystem','grade','school','procedure','doctorname','doctoremail'];
            const validRows = []; const errors = [];
            rows.forEach(row => {
                const missing = required.filter(f => !row[f]);
                if (missing.length) {
                    errors.push(`Row ${row._rowNum}: missing ${missing.join(', ')}`);
                } else {
                    validRows.push({
                        name: row.name, email: row.email, phone: row.phone,
                        dob: row.dob, schoolSystem: row.schoolsystem || row['schoolsystem'] || row['school system'],
                        grade: row.grade, school: row.school,
                        procedure: row.procedure, doctorName: row.doctorname || row['doctorname'],
                        doctorEmail: row.doctoremail || row['doctoremail'],
                        _rowNum: row._rowNum
                    });
                }
            });
            setImportRows(validRows); setImportErrors(errors);
        } catch (e) {
            console.error(e); setImportErrors(['Failed to parse file. Please check the format.']);
        }
    };

    const handleImportSubmit = async () => {
        if (!importRows.length) return;
        setImporting(true);
        let success = 0, failed = 0;
        for (const row of importRows) {
            try {
                const { _rowNum, ...data } = row;
                // Assign first cohort if only one exists, else leave empty for manual assignment
                const payload = { ...data, parents: [] };
                if (cohorts.length === 1) payload.cohort = cohorts[0]._id;
                const res = await API.post('/mentees', payload);
                setMentees(prev => [...prev, res.data]);
                success++;
            } catch { failed++; }
        }
        setImportDone({ success, failed });
        setImporting(false);
        if (failed === 0) setTimeout(() => { setImportOpen(false); setImportRows([]); setImportDone(null); }, 2000);
    };

    // ── PDF Export ───────────────────────────────────────────────────────────
    const exportMenteePDF = async (mentee) => {
        // Fetch full profile with populated parents and cohort
        let full = mentee;
        try {
            const res = await API.get(`/mentees/${mentee._id}`);
            full = res.data;
        } catch(e) { /* use existing data */ }

        const dob = full.dob ? new Date(full.dob).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' }) : 'N/A';
        const age = full.dob ? (() => { const b=new Date(full.dob),t=new Date(); let a=t.getFullYear()-b.getFullYear(); if(t.getMonth()<b.getMonth()||(t.getMonth()===b.getMonth()&&t.getDate()<b.getDate())) a--; return a; })() : '';
        const cohortName = full.cohort?.riika ? `${full.cohort.riika} — ${full.cohort.year}` : 'N/A';
        const parentsList = Array.isArray(full.parents) && full.parents.length
            ? full.parents.map(p => typeof p === 'object' ? `${p.name} (${p.parent}) — ${p.phone}` : p).join(', ')
            : 'N/A';

        const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
        <style>
            *{margin:0;padding:0;box-sizing:border-box;font-family:Georgia,serif}
            body{background:#fff;color:#1a1a1a;padding:40px;max-width:800px;margin:0 auto}
            .header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:24px;border-bottom:3px solid #B8975A;margin-bottom:28px}
            .org{font-size:22px;font-weight:900;letter-spacing:-0.5px;color:#1a1a1a}
            .sub{font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#B8975A;margin-top:4px}
            .admission{text-align:right}
            .adm-label{font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#999}
            .adm-num{font-size:18px;font-weight:900;color:#B8975A;font-family:monospace;margin-top:2px}
            .name-block{margin-bottom:28px;padding:20px 24px;background:#faf8f5;border-left:4px solid #B8975A;border-radius:0 12px 12px 0}
            .name{font-size:26px;font-weight:900;color:#1a1a1a;letter-spacing:-0.5px}
            .badges{display:flex;gap:8px;margin-top:8px;flex-wrap:wrap}
            .badge{font-size:10px;font-weight:700;padding:3px 10px;border-radius:20px;background:rgba(184,151,90,0.12);color:#B8975A;border:1px solid rgba(184,151,90,0.3)}
            .section{margin-bottom:24px}
            .sec-title{font-size:9px;font-weight:900;letter-spacing:3px;text-transform:uppercase;color:#B8975A;border-bottom:1px solid rgba(184,151,90,0.2);padding-bottom:6px;margin-bottom:14px}
            .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px 24px}
            .field label{font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#999;display:block;margin-bottom:3px}
            .field span{font-size:13px;font-weight:600;color:#1a1a1a}
            .full{grid-column:1/-1}
            .footer{margin-top:40px;padding-top:16px;border-top:1px solid #eee;display:flex;justify-content:space-between;font-size:10px;color:#aaa}
        </style></head><body>
        <div class="header">
            <div><div class="org">DHAHABU</div><div class="sub">Management System — Mentee Profile</div></div>
            <div class="admission"><div class="adm-label">Admission No.</div><div class="adm-num">${full.admissionNumber || 'PENDING'}</div></div>
        </div>
        <div class="name-block">
            <div class="name">${full.name}</div>
            <div class="badges">
                <span class="badge">${full.schoolSystem}</span>
                <span class="badge">Grade ${full.grade}</span>
                ${age ? `<span class="badge">${age} years old</span>` : ''}
            </div>
        </div>
        <div class="section">
            <div class="sec-title">Personal Information</div>
            <div class="grid">
                <div class="field"><label>Email</label><span>${full.email}</span></div>
                <div class="field"><label>Phone</label><span>${full.phone}</span></div>
                <div class="field"><label>Date of Birth</label><span>${dob}</span></div>
                <div class="field"><label>Cohort</label><span>${cohortName}</span></div>
            </div>
        </div>
        <div class="section">
            <div class="sec-title">School Information</div>
            <div class="grid">
                <div class="field"><label>School</label><span>${full.school}</span></div>
                <div class="field"><label>School System</label><span>${full.schoolSystem}</span></div>
                <div class="field"><label>Grade / Form</label><span>${full.grade}</span></div>
            </div>
        </div>
        <div class="section">
            <div class="sec-title">Medical Information</div>
            <div class="grid">
                <div class="field full"><label>Procedure</label><span>${full.procedure}</span></div>
                <div class="field"><label>Doctor</label><span>${full.doctorName}</span></div>
                <div class="field"><label>Doctor Email</label><span>${full.doctorEmail}</span></div>
            </div>
        </div>
        <div class="section">
            <div class="sec-title">Parents / Guardians</div>
            <div class="grid"><div class="field full"><label>Linked Parents</label><span>${parentsList}</span></div></div>
        </div>
        <div class="footer">
            <span>Generated ${new Date().toLocaleString('en-US', { dateStyle:'long', timeStyle:'short' })}</span>
            <span>DHAHABU Management — Confidential</span>
        </div>
        </body></html>`;

        const win = window.open('', '_blank');
        win.document.write(html);
        win.document.close();
        win.onload = () => { win.print(); };
    };

    const handleProfilePicUpload = async (menteeId, file) => {
        if (!file) return;
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) { alert('Image must be under 5MB'); return; }
        try {
            setUploadingPicFor(menteeId);
            const url = await uploadToCloudinary(file);
            const response = await API.put(`/mentees/${menteeId}/profilepic`, { profilepic: url });
            setMentees(prev => prev.map(m => m._id === menteeId ? { ...m, profilepic: response.data.profilepic } : m));
        } catch (error) {
            console.error(error);
            alert('Failed to upload profile picture. Please try again.');
        } finally {
            setUploadingPicFor(null);
        }
    };
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

    const handleOpenEdit = (mentee) => {
        setEditingMentee({
            ...mentee,
            cohort: mentee.cohort?._id || mentee.cohort || '',
            parents: Array.isArray(mentee.parents)
                ? mentee.parents.map(p => p._id || p)
                : [],
            dob: mentee.dob ? new Date(mentee.dob).toISOString().split('T')[0] : '',
        });
        setEditOpen(true);
    };

    const handleEditMentee = async () => {
        try {
            const requiredFields = ['name','cohort','email','dob','schoolSystem','grade','phone','school','procedure','doctorName','doctorEmail'];
            const missingFields = requiredFields.filter(f => !editingMentee[f]);
            if (missingFields.length > 0) { alert(`Please fill all required fields: ${missingFields.join(', ')}`); return; }
            const response = await API.put(`/mentees/${editingMentee._id}`, {
                ...editingMentee,
                dob: new Date(editingMentee.dob),
                parents: Array.isArray(editingMentee.parents) ? editingMentee.parents : [editingMentee.parents]
            });
            setMentees(mentees.map(m => m._id === editingMentee._id ? response.data : m));
            setEditOpen(false);
            setEditingMentee(null);
        } catch (error) { console.error(error); alert('Error updating mentee. Please try again.'); }
    };

    const handleEditInputChange = (e) => {
        const { name, value } = e.target;
        setEditingMentee(prev => ({ ...prev, [name]: value }));
    };

    const handleEditSelectChange = (name, value) => {
        setEditingMentee(prev => ({ ...prev, [name]: value }));
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

    // ── Derived filter values ────────────────────────────────────────────────
    const years = [...new Set(mentees.map(m => m.dob ? new Date(m.dob).getFullYear() : null).filter(Boolean))].sort((a,b) => b - a);

    const filteredMentees = mentees.filter(m => {
        const term = searchTerm.toLowerCase().trim();
        const matchesSearch = !term || (
            m.name?.toLowerCase().includes(term) ||
            m.admissionNumber?.toLowerCase().includes(term) ||
            m.email?.toLowerCase().includes(term) ||
            m.school?.toLowerCase().includes(term)
        );
        const cohortId = m.cohort?._id || m.cohort;
        const matchesCohort = filterCohort === 'all' || cohortId === filterCohort;
        const matchesYear = filterYear === 'all' || (m.dob && new Date(m.dob).getFullYear() === parseInt(filterYear));
        const matchesSystem = filterSchoolSystem === 'all' || m.schoolSystem === filterSchoolSystem;
        return matchesSearch && matchesCohort && matchesYear && matchesSystem;
    });

    const activeFilterCount = [
        searchTerm, 
        filterCohort !== 'all' ? filterCohort : '', 
        filterYear !== 'all' ? filterYear : '',
        filterSchoolSystem !== 'all' ? filterSchoolSystem : ''
    ].filter(Boolean).length;

    const clearFilters = () => {
        setSearchTerm('');
        setFilterCohort('all');
        setFilterYear('all');
        setFilterSchoolSystem('all');
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
            <PageHeader title="Moran" subtitle="Manage and track all morans in the program"
                onAdd={() => setOpen(true)} addLabel="Add Candidate" onImport={() => setImportOpen(true)} />

            {/* ── Search & Filter Bar ──────────────────────────────────────── */}
            <div className="bg-white rounded-3xl border border-stone-100 shadow-sm p-5 mb-6">
                <div className="flex flex-col gap-4">
                    {/* Search input */}
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: GOLD }} />
                        <Input
                            placeholder="Search by name, admission number, email or school..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="pl-11 h-10 rounded-2xl border-stone-200 focus:border-[#B8975A] focus:ring-0 w-full text-sm"
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-stone-100 transition-colors">
                                <X className="h-3.5 w-3.5 text-stone-400" />
                            </button>
                        )}
                    </div>
                    {/* Filter row */}
                    <div className="flex flex-wrap gap-3">
                        {/* Cohort filter */}
                        <Select value={filterCohort} onValueChange={setFilterCohort}>
                            <SelectTrigger className="h-9 rounded-xl border border-stone-200 bg-white px-3 text-xs font-semibold text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#B8975A] hover:border-[#B8975A] transition-colors min-w-[150px]">
                                <SelectValue placeholder="All Cohorts" />
                            </SelectTrigger>
                            <SelectContent className="z-50 rounded-xl border border-stone-200 bg-white shadow-lg text-sm p-1">
                                <SelectItem className="rounded-lg px-3 py-2 cursor-pointer hover:bg-amber-50 text-stone-800 font-medium" value="all">All Cohorts</SelectItem>
                                {cohorts.map(c => (
                                    <SelectItem className="rounded-lg px-3 py-2 cursor-pointer hover:bg-amber-50 text-stone-800 font-medium" key={c._id} value={c._id}>
                                        {c.riika} — {c.year}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Year of birth filter */}
                        <Select value={filterYear} onValueChange={setFilterYear}>
                            <SelectTrigger className="h-9 rounded-xl border border-stone-200 bg-white px-3 text-xs font-semibold text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#B8975A] hover:border-[#B8975A] transition-colors min-w-[130px]">
                                <SelectValue placeholder="All Years" />
                            </SelectTrigger>
                            <SelectContent className="z-50 rounded-xl border border-stone-200 bg-white shadow-lg text-sm p-1">
                                <SelectItem className="rounded-lg px-3 py-2 cursor-pointer hover:bg-amber-50 text-stone-800 font-medium" value="all">All Birth Years</SelectItem>
                                {years.map(y => (
                                    <SelectItem className="rounded-lg px-3 py-2 cursor-pointer hover:bg-amber-50 text-stone-800 font-medium" key={y} value={String(y)}>{y}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* School system filter */}
                        <Select value={filterSchoolSystem} onValueChange={setFilterSchoolSystem}>
                            <SelectTrigger className="h-9 rounded-xl border border-stone-200 bg-white px-3 text-xs font-semibold text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#B8975A] hover:border-[#B8975A] transition-colors min-w-[130px]">
                                <SelectValue placeholder="All Systems" />
                            </SelectTrigger>
                            <SelectContent className="z-50 rounded-xl border border-stone-200 bg-white shadow-lg text-sm p-1">
                                <SelectItem className="rounded-lg px-3 py-2 cursor-pointer hover:bg-amber-50 text-stone-800 font-medium" value="all">All Systems</SelectItem>
                                <SelectItem className="rounded-lg px-3 py-2 cursor-pointer hover:bg-amber-50 text-stone-800 font-medium" value="8-4-4">8-4-4</SelectItem>
                                <SelectItem className="rounded-lg px-3 py-2 cursor-pointer hover:bg-amber-50 text-stone-800 font-medium" value="IGCSE">IGCSE</SelectItem>
                                <SelectItem className="rounded-lg px-3 py-2 cursor-pointer hover:bg-amber-50 text-stone-800 font-medium" value="CBC">CBC</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Clear filters */}
                        {activeFilterCount > 0 && (
                            <button onClick={clearFilters}
                                className="h-9 px-3 rounded-xl text-xs font-black border border-stone-200 text-stone-500 hover:bg-stone-50 flex items-center gap-1.5 transition-colors">
                                <X className="h-3 w-3" /> Clear
                                <span className="w-4 h-4 rounded-full text-white text-[10px] flex items-center justify-center font-black"
                                    style={{ backgroundColor: GOLD }}>{activeFilterCount}</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Results count */}
                <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                    <p className="text-xs font-semibold text-stone-400">
                        Showing <span className="font-black text-stone-700">{filteredMentees.length}</span> of <span className="font-black text-stone-700">{mentees.length}</span> candidates
                    </p>
                    {activeFilterCount > 0 && (
                        <p className="text-xs font-semibold" style={{ color: GOLD }}>
                            {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active
                        </p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredMentees.map((mentee) => (
                    <div key={mentee._id}
                        className="bg-white rounded-3xl border border-stone-100 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group flex flex-col">
                        <CardTopStripe />

                        {/* Photo banner */}
                        <div className="relative h-28 w-full flex-shrink-0 overflow-hidden"
                            style={{ background: `linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)` }}>
                            {mentee.profilepic
                                ? <img src={mentee.profilepic} alt={mentee.name} className="w-full h-full object-cover opacity-80" />
                                : <div className="w-full h-full flex items-center justify-center">
                                    <span className="text-5xl font-black text-white/20 tracking-tighter select-none">
                                        {getInitials(mentee.name)}
                                    </span>
                                  </div>
                            }
                            {/* Gold gradient overlay at bottom */}
                            <div className="absolute bottom-0 left-0 w-full h-12"
                                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }} />
                            {/* Camera upload — stop propagation so click doesn't navigate */}
                            <label htmlFor={`pic-${mentee._id}`}
                                onClick={e => e.stopPropagation()}
                                className="absolute top-2 right-2 w-7 h-7 rounded-xl flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                                style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}>
                                {uploadingPicFor === mentee._id
                                    ? <Loader2 className="h-3.5 w-3.5 text-white animate-spin" />
                                    : <Camera className="h-3.5 w-3.5 text-white" />}
                            </label>
                            <input id={`pic-${mentee._id}`} type="file" accept="image/*" className="hidden"
                                onClick={e => e.stopPropagation()}
                                onChange={e => { e.stopPropagation(); handleProfilePicUpload(mentee._id, e.target.files[0]); }} />
                        </div>

                        {/* Avatar overlapping banner */}
                        <div className="px-5 -mt-8 mb-2 flex items-end justify-between">
                            <div className="relative group/avatar">
                                <Avatar className="h-16 w-16 rounded-2xl border-2 border-white shadow-lg">
                                    <AvatarImage src={mentee.profilepic} alt={mentee.name} className="object-cover" />
                                    <AvatarFallback className="rounded-2xl font-black text-black text-xl"
                                        style={{ background: `linear-gradient(135deg, ${GOLD}, #D4B88C)` }}>
                                        {getInitials(mentee.name)}
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                            {mentee.admissionNumber && (
                                <span className="text-[10px] font-mono font-black px-2 py-1 rounded-lg mb-1"
                                    style={{ backgroundColor: 'rgba(184,151,90,0.1)', color: GOLD }}>
                                    {mentee.admissionNumber}
                                </span>
                            )}
                        </div>

                        {/* Name + badges */}
                        <div className="px-5 pb-3">
                            <h3 className="font-black text-stone-900 text-base leading-tight">{mentee.name}</h3>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                <span className="text-xs font-black px-2 py-0.5 rounded-full"
                                    style={{ backgroundColor: 'rgba(184,151,90,0.1)', color: GOLD }}>
                                    {mentee.schoolSystem}
                                </span>
                                <span className="text-xs text-stone-400 font-semibold">{mentee.schoolSystem === '8-4-4' ? 'Form' : 'Grade'} {mentee.grade}</span>
                                <span className="text-xs text-stone-400 font-semibold">· {calculateAge(mentee.dob)} yrs</span>
                            </div>
                        </div>

                        {/* Info rows */}
                        <div className="px-5 pb-4 space-y-1.5 flex-1">
                            {[
                                { icon: Mail,   val: mentee.email },
                                { icon: Phone,  val: mentee.phone },
                                { icon: School, val: mentee.school },
                            ].map(({ icon: Icon, val }, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs text-stone-500">
                                    <Icon className="h-3 w-3 flex-shrink-0" style={{ color: GOLD }} />
                                    <span className="truncate font-medium">{val}</span>
                                </div>
                            ))}
                        </div>

                        {/* Action buttons — stop propagation so they don't trigger navigate */}
                        <div className="px-5 pb-5 pt-3 flex gap-2" style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                            <button onClick={e => { e.stopPropagation(); handleOpenEdit(mentee); }}
                                className="flex-1 h-8 rounded-xl text-xs font-black border flex items-center justify-center gap-1 transition-all hover:bg-stone-50"
                                style={{ borderColor: 'rgba(184,151,90,0.3)', color: GOLD }}>
                                <Edit className="h-3 w-3" /> Edit
                            </button>
                            <button onClick={e => { e.stopPropagation(); exportMenteePDF(mentee); }}
                                className="flex-1 h-8 rounded-xl text-xs font-black flex items-center justify-center gap-1 transition-all hover:opacity-90 text-black"
                                style={{ background: `linear-gradient(135deg, ${GOLD}, #D4B88C)` }}>
                                <Download className="h-3 w-3" /> Export
                            </button>
                            <button onClick={e => { e.stopPropagation(); handleDeleteMentee(mentee._id); }}
                                className="h-8 w-8 rounded-xl border border-red-100 text-red-400 flex items-center justify-center transition-all hover:bg-red-50">
                                <Trash2 className="h-3 w-3" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {filteredMentees.length === 0 && !loading && (
                <div className="text-center py-20 bg-white rounded-3xl border border-stone-100 shadow-sm">
                    <div className="w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center"
                        style={{ backgroundColor: 'rgba(184,151,90,0.08)' }}>
                        <User className="h-10 w-10" style={{ color: GOLD }} />
                    </div>
                    <h3 className="text-xl font-black text-stone-900 mb-2">No candidates found</h3>
                    <p className="text-stone-400 mb-6">
                        {activeFilterCount > 0 ? 'No candidates match your current filters. Try adjusting or clearing them.' : 'Get started by adding your first mentee.'}
                    </p>
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
                                    <SelectTrigger className="h-10 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#B8975A] focus:border-[#B8975A] hover:border-[#B8975A] transition-colors"><SelectValue /></SelectTrigger>
                                    <SelectContent className="z-50 rounded-xl border border-stone-200 bg-white shadow-lg text-sm text-stone-900 p-1">
                                        <SelectItem className="rounded-lg px-3 py-2 cursor-pointer hover:bg-amber-50 focus:bg-amber-50 text-stone-800 font-medium" value="8-4-4">8-4-4 System</SelectItem>
                                        <SelectItem className="rounded-lg px-3 py-2 cursor-pointer hover:bg-amber-50 focus:bg-amber-50 text-stone-800 font-medium" value="IGCSE">IGCSE</SelectItem>
                                        <SelectItem className="rounded-lg px-3 py-2 cursor-pointer hover:bg-amber-50 focus:bg-amber-50 text-stone-800 font-medium" value="CBC">CBC</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className={labelClass}>{newMentee.schoolSystem === '8-4-4' ? 'Form *' : 'Grade *'}</Label>
                                <Input name="grade" placeholder={newMentee.schoolSystem === '8-4-4' ? 'Enter form e.g. Form 2' : 'Enter grade'} value={newMentee.grade} onChange={handleInputChange} className={inputClass} />
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
                                    <SelectTrigger className="h-10 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#B8975A] focus:border-[#B8975A] hover:border-[#B8975A] transition-colors"><SelectValue placeholder="Select cohort" /></SelectTrigger>
                                    <SelectContent className="z-50 rounded-xl border border-stone-200 bg-white shadow-lg text-sm text-stone-900 p-1">
                                        {cohorts.map(c => <SelectItem className="rounded-lg px-3 py-2 cursor-pointer hover:bg-amber-50 focus:bg-amber-50 text-stone-800 font-medium" key={c._id} value={c._id}>{c.riika} - {c.year}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5 md:col-span-2">
                                <Label className={labelClass}>Parents / Guardian</Label>
                                <div className="rounded-xl border border-stone-200 max-h-40 overflow-y-auto divide-y divide-stone-50">
                                    {parents.length === 0 ? (
                                        <p className="text-xs text-stone-400 p-3">No parents available — add parents first</p>
                                    ) : parents.map(p => {
                                        const checked = newMentee.parents.includes(p._id);
                                        const colors = parentTypeColors[p.parent] || { bg: 'rgba(184,151,90,0.1)', color: GOLD, border: 'rgba(184,151,90,0.2)' };
                                        return (
                                            <label key={p._id} className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors hover:bg-stone-50 ${checked ? 'bg-amber-50/60' : ''}`}>
                                                <input type="checkbox" checked={checked}
                                                    onChange={() => {
                                                        const updated = checked
                                                            ? newMentee.parents.filter(id => id !== p._id)
                                                            : [...newMentee.parents, p._id];
                                                        handleSelectChange('parents', updated);
                                                    }}
                                                    className="rounded accent-amber-600 h-4 w-4 flex-shrink-0"
                                                />
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span className="text-sm font-semibold text-stone-800 truncate">{p.name}</span>
                                                    <span className="text-xs font-black px-2 py-0.5 rounded-full border flex-shrink-0"
                                                        style={{ backgroundColor: colors.bg, color: colors.color, borderColor: colors.border }}>
                                                        {p.parent}
                                                    </span>
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                                {newMentee.parents.length > 0 && (
                                    <p className="text-xs font-semibold mt-1" style={{ color: GOLD }}>
                                        {newMentee.parents.length} selected
                                    </p>
                                )}
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
            {/* Edit Dialog */}
            {editingMentee && (
                <Dialog open={editOpen} onOpenChange={setEditOpen}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl border border-stone-100 shadow-2xl p-0">
                        <div className="h-1 w-full rounded-t-3xl" style={{ background: `linear-gradient(to right, ${GOLD}, #D4B88C)` }} />
                        <div className="p-8">
                            <DialogHeader className="mb-6">
                                <DialogTitle className="text-2xl font-black tracking-tighter text-stone-900">Edit Candidate</DialogTitle>
                                {editingMentee.admissionNumber && (
                                    <p className="text-xs font-mono font-semibold text-stone-400 mt-1">{editingMentee.admissionNumber}</p>
                                )}
                                <DialogDescription className="text-stone-400">Update the details for this mentee.</DialogDescription>
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
                                            value={editingMentee[f.id] || ''} onChange={handleEditInputChange} className={inputClass} />
                                    </div>
                                ))}

                                <div className="md:col-span-2 mt-3">
                                    <p className={sectionClass} style={{ borderBottom: `2px solid ${GOLD}`, paddingBottom: '8px' }}>School Information</p>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className={labelClass}>School System *</Label>
                                    <Select value={editingMentee.schoolSystem} onValueChange={v => handleEditSelectChange('schoolSystem', v)}>
                                        <SelectTrigger className="h-10 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#B8975A] focus:border-[#B8975A] hover:border-[#B8975A] transition-colors"><SelectValue /></SelectTrigger>
                                        <SelectContent className="z-50 rounded-xl border border-stone-200 bg-white shadow-lg text-sm text-stone-900 p-1">
                                            <SelectItem className="rounded-lg px-3 py-2 cursor-pointer hover:bg-amber-50 focus:bg-amber-50 text-stone-800 font-medium" value="8-4-4">8-4-4 System</SelectItem>
                                            <SelectItem className="rounded-lg px-3 py-2 cursor-pointer hover:bg-amber-50 focus:bg-amber-50 text-stone-800 font-medium" value="IGCSE">IGCSE</SelectItem>
                                            <SelectItem className="rounded-lg px-3 py-2 cursor-pointer hover:bg-amber-50 focus:bg-amber-50 text-stone-800 font-medium" value="CBC">CBC</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className={labelClass}>{editingMentee.schoolSystem === '8-4-4' ? 'Form *' : 'Grade *'}</Label>
                                    <Input name="grade" placeholder={editingMentee.schoolSystem === '8-4-4' ? 'Enter form e.g. Form 2' : 'Enter grade'} value={editingMentee.grade || ''} onChange={handleEditInputChange} className={inputClass} />
                                </div>
                                <div className="space-y-1.5 md:col-span-2">
                                    <Label className={labelClass}>School *</Label>
                                    <Input name="school" placeholder="Enter school name" value={editingMentee.school || ''} onChange={handleEditInputChange} className={inputClass} />
                                </div>

                                <div className="md:col-span-2 mt-3">
                                    <p className={sectionClass} style={{ borderBottom: `2px solid ${GOLD}`, paddingBottom: '8px' }}>Medical Information</p>
                                </div>
                                <div className="space-y-1.5 md:col-span-2">
                                    <Label className={labelClass}>Medical Procedure *</Label>
                                    <Input name="procedure" placeholder="Enter medical procedure" value={editingMentee.procedure || ''} onChange={handleEditInputChange} className={inputClass} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className={labelClass}>Doctor Name *</Label>
                                    <Input name="doctorName" placeholder="Enter doctor's name" value={editingMentee.doctorName || ''} onChange={handleEditInputChange} className={inputClass} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className={labelClass}>Doctor Email *</Label>
                                    <Input name="doctorEmail" type="email" placeholder="Enter doctor's email" value={editingMentee.doctorEmail || ''} onChange={handleEditInputChange} className={inputClass} />
                                </div>

                                <div className="md:col-span-2 mt-3">
                                    <p className={sectionClass} style={{ borderBottom: `2px solid ${GOLD}`, paddingBottom: '8px' }}>Additional Information</p>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className={labelClass}>Cohort *</Label>
                                    <Select value={editingMentee.cohort} onValueChange={v => handleEditSelectChange('cohort', v)}>
                                        <SelectTrigger className="h-10 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#B8975A] focus:border-[#B8975A] hover:border-[#B8975A] transition-colors"><SelectValue placeholder="Select cohort" /></SelectTrigger>
                                        <SelectContent className="z-50 rounded-xl border border-stone-200 bg-white shadow-lg text-sm text-stone-900 p-1">
                                            {cohorts.map(c => <SelectItem className="rounded-lg px-3 py-2 cursor-pointer hover:bg-amber-50 focus:bg-amber-50 text-stone-800 font-medium" key={c._id} value={c._id}>{c.riika} - {c.year}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5 md:col-span-2">
                                    <Label className={labelClass}>Parents / Guardian</Label>
                                    <div className="rounded-xl border border-stone-200 max-h-40 overflow-y-auto divide-y divide-stone-50">
                                        {parents.length === 0 ? (
                                            <p className="text-xs text-stone-400 p-3">No parents available</p>
                                        ) : parents.map(p => {
                                            const checked = editingMentee.parents.includes(p._id);
                                            const colors = parentTypeColors[p.parent] || { bg: 'rgba(184,151,90,0.1)', color: GOLD, border: 'rgba(184,151,90,0.2)' };
                                            return (
                                                <label key={p._id} className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors hover:bg-stone-50 ${checked ? 'bg-amber-50/60' : ''}`}>
                                                    <input type="checkbox" checked={checked}
                                                        onChange={() => {
                                                            const updated = checked
                                                                ? editingMentee.parents.filter(id => id !== p._id)
                                                                : [...editingMentee.parents, p._id];
                                                            handleEditSelectChange('parents', updated);
                                                        }}
                                                        className="rounded accent-amber-600 h-4 w-4 flex-shrink-0"
                                                    />
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <span className="text-sm font-semibold text-stone-800 truncate">{p.name}</span>
                                                        <span className="text-xs font-black px-2 py-0.5 rounded-full border flex-shrink-0"
                                                            style={{ backgroundColor: colors.bg, color: colors.color, borderColor: colors.border }}>
                                                            {p.parent}
                                                        </span>
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </div>
                                    {editingMentee.parents.length > 0 && (
                                        <p className="text-xs font-semibold mt-1" style={{ color: GOLD }}>
                                            {editingMentee.parents.length} selected
                                        </p>
                                    )}
                                </div>
                            </div>

                            <DialogFooter className="mt-8 gap-3">
                                <button onClick={() => { setEditOpen(false); setEditingMentee(null); }}
                                    className="px-5 py-2.5 rounded-2xl font-black text-sm text-stone-600 border border-stone-200 hover:bg-stone-50 transition-all">
                                    Cancel
                                </button>
                                <button onClick={handleEditMentee}
                                    className="px-6 py-2.5 rounded-2xl font-black text-sm text-black shadow-lg transition-all hover:opacity-90"
                                    style={{ background: `linear-gradient(135deg, ${GOLD}, #D4B88C)` }}>
                                    Save Changes
                                </button>
                            </DialogFooter>
                        </div>
                    </DialogContent>
                </Dialog>
            )}

            {/* ── Import Excel Dialog ──────────────────────────────────────────── */}
            <Dialog open={importOpen} onOpenChange={v => { setImportOpen(v); if (!v) { setImportRows([]); setImportErrors([]); setImportDone(null); } }}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl border border-stone-100 shadow-2xl p-0">
                    <div className="h-1 w-full rounded-t-3xl" style={{ background: `linear-gradient(to right, ${GOLD}, #D4B88C)` }} />
                    <div className="p-8">
                        <DialogHeader className="mb-2">
                            <DialogTitle className="text-2xl font-black tracking-tighter text-stone-900">Import Mentees from Excel</DialogTitle>
                            <DialogDescription className="text-stone-400">Upload a .csv or .xlsx file to bulk-add mentees. Download the template to ensure correct formatting.</DialogDescription>
                        </DialogHeader>

                        {/* Template download */}
                        <button onClick={downloadTemplate}
                            className="flex items-center gap-2 mt-4 px-4 py-2 rounded-xl text-xs font-black border border-stone-200 hover:bg-stone-50 transition-colors">
                            <FileDown className="h-3.5 w-3.5" style={{ color: GOLD }} />
                            Download Template (.csv)
                        </button>

                        {/* Drop zone */}
                        {!importRows.length && !importDone && (
                            <label className="mt-5 flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl p-10 cursor-pointer transition-colors hover:bg-amber-50/40"
                                style={{ borderColor: 'rgba(184,151,90,0.3)' }}>
                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'rgba(184,151,90,0.08)' }}>
                                    <Upload className="h-6 w-6" style={{ color: GOLD }} />
                                </div>
                                <div className="text-center">
                                    <p className="font-black text-stone-700 text-sm">Drop your file here or click to browse</p>
                                    <p className="text-xs text-stone-400 mt-1">Supports .csv, .xlsx, .xls</p>
                                </div>
                                <input type="file" accept=".csv,.xlsx,.xls" className="hidden"
                                    onChange={e => handleFileUpload(e.target.files[0])} />
                            </label>
                        )}

                        {/* Errors */}
                        {importErrors.length > 0 && (
                            <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                                    <p className="text-xs font-black text-red-600">{importErrors.length} row(s) have issues and will be skipped:</p>
                                </div>
                                <ul className="space-y-1 max-h-24 overflow-y-auto">
                                    {importErrors.map((e, i) => <li key={i} className="text-xs text-red-500 font-medium">{e}</li>)}
                                </ul>
                            </div>
                        )}

                        {/* Preview table */}
                        {importRows.length > 0 && !importDone && (
                            <div className="mt-5">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-sm font-black text-stone-800">
                                        <span className="text-emerald-500">{importRows.length}</span> valid row{importRows.length > 1 ? 's' : ''} ready to import
                                    </p>
                                    <button onClick={() => { setImportRows([]); setImportErrors([]); }}
                                        className="text-xs font-black text-stone-400 hover:text-stone-600 flex items-center gap-1">
                                        <X className="h-3 w-3" /> Clear
                                    </button>
                                </div>
                                <div className="rounded-2xl border border-stone-100 overflow-hidden">
                                    <div className="overflow-x-auto max-h-52 overflow-y-auto">
                                        <table className="w-full text-xs">
                                            <thead className="sticky top-0 bg-stone-50">
                                                <tr>
                                                    {['Name','Email','Phone','DOB','System','Grade','School'].map(h => (
                                                        <th key={h} className="px-3 py-2 text-left font-black text-stone-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-stone-50">
                                                {importRows.map((row, i) => (
                                                    <tr key={i} className="hover:bg-stone-50">
                                                        <td className="px-3 py-2 font-semibold text-stone-800 whitespace-nowrap">{row.name}</td>
                                                        <td className="px-3 py-2 text-stone-500 whitespace-nowrap">{row.email}</td>
                                                        <td className="px-3 py-2 text-stone-500 whitespace-nowrap">{row.phone}</td>
                                                        <td className="px-3 py-2 text-stone-500 whitespace-nowrap">{row.dob}</td>
                                                        <td className="px-3 py-2 text-stone-500 whitespace-nowrap">{row.schoolSystem}</td>
                                                        <td className="px-3 py-2 text-stone-500 whitespace-nowrap">{row.grade}</td>
                                                        <td className="px-3 py-2 text-stone-500 whitespace-nowrap">{row.school}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Success state */}
                        {importDone && (
                            <div className="mt-5 rounded-2xl p-6 text-center" style={{ backgroundColor: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}>
                                <CheckCircle className="h-10 w-10 mx-auto mb-3 text-emerald-400" />
                                <p className="font-black text-stone-900">Import Complete</p>
                                <p className="text-sm text-stone-500 mt-1">
                                    <span className="text-emerald-500 font-black">{importDone.success} added</span>
                                    {importDone.failed > 0 && <span className="text-red-400 font-black ml-2">{importDone.failed} failed</span>}
                                </p>
                            </div>
                        )}

                        <DialogFooter className="mt-6 gap-3">
                            <button onClick={() => { setImportOpen(false); setImportRows([]); setImportErrors([]); setImportDone(null); }}
                                className="px-5 py-2.5 rounded-2xl font-black text-sm text-stone-600 border border-stone-200 hover:bg-stone-50 transition-all">
                                {importDone ? 'Close' : 'Cancel'}
                            </button>
                            {importRows.length > 0 && !importDone && (
                                <button onClick={handleImportSubmit} disabled={importing}
                                    className="px-6 py-2.5 rounded-2xl font-black text-sm text-black shadow-lg transition-all hover:opacity-90 flex items-center gap-2"
                                    style={{ background: `linear-gradient(135deg, ${GOLD}, #D4B88C)` }}>
                                    {importing && <Loader2 className="h-3 w-3 animate-spin" />}
                                    {importing ? `Importing...` : `Import ${importRows.length} Mentee${importRows.length > 1 ? 's' : ''}`}
                                </button>
                            )}
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}