import { React, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import API from '@/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Trash2, Edit, Calendar, MapPin, Users, Clock, AlertCircle, Loader2 } from 'lucide-react';

const GOLD = '#B8975A';
const inputClass = "h-10 rounded-xl text-stone-900 text-sm border-stone-200 focus:border-[#B8975A] focus:ring-0";
const labelClass = "text-xs font-black tracking-widest uppercase text-stone-500";

export default function Cohort() {
    const [cohorts, setCohorts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [open, setOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [error, setError] = useState('');
    const [newCohort, setNewCohort] = useState({ riika: '', year: '', residence: '', startDate: '', endDate: '' });

    useEffect(() => { fetchCohorts(); }, []);

    const fetchCohorts = async () => {
        try {
            const response = await API.get('/cohorts');
            setCohorts(response.data);
        } catch (error) { console.error(error); setError('Failed to load cohorts. Please refresh the page.'); }
        finally { setLoading(false); }
    };

    const resetForm = () => {
        setNewCohort({ riika: '', year: '', residence: '', startDate: '', endDate: '' });
        setEditMode(false); setEditingId(null); setError('');
    };

    const handleAddCohort = async () => {
        setError(''); setSaving(true);
        try {
            if (!newCohort.riika || !newCohort.year || !newCohort.residence || !newCohort.startDate || !newCohort.endDate) {
                setError('Please fill all required fields'); setSaving(false); return;
            }
            const response = await API.post('/cohorts', { ...newCohort, year: parseInt(newCohort.year) });
            setCohorts([...cohorts, response.data]);
            resetForm(); setOpen(false);
        } catch (error) {
            setError(error.response?.data?.error || 'Error adding cohort. Please try again.');
        } finally { setSaving(false); }
    };

    const handleEditCohort = async () => {
        setError(''); setSaving(true);
        try {
            if (!newCohort.riika || !newCohort.year || !newCohort.residence || !newCohort.startDate || !newCohort.endDate) {
                setError('Please fill all required fields'); setSaving(false); return;
            }
            const response = await API.put(`/cohorts/${editingId}`, { ...newCohort, year: parseInt(newCohort.year) });
            setCohorts(cohorts.map(c => c._id === editingId ? response.data : c));
            resetForm(); setOpen(false);
        } catch (error) {
            setError(error.response?.data?.error || 'Error updating cohort. Please try again.');
        } finally { setSaving(false); }
    };

    const openEditDialog = (cohort) => {
        setEditMode(true); setEditingId(cohort._id);
        setNewCohort({
            riika: cohort.riika, year: cohort.year.toString(), residence: cohort.residence,
            startDate: new Date(cohort.startDate).toISOString().split('T')[0],
            endDate: new Date(cohort.endDate).toISOString().split('T')[0]
        });
        setOpen(true);
    };

    const handleDeleteCohort = async (cohortId) => {
        if (!window.confirm('Are you sure you want to delete this cohort? This action cannot be undone.')) return;
        try {
            await API.delete(`/cohorts/${cohortId}`);
            setCohorts(cohorts.filter(c => c._id !== cohortId));
        } catch (error) { console.error(error); alert('Error deleting cohort. Please try again.'); }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewCohort(prev => ({ ...prev, [name]: value }));
    };

    const getStatus = (startDate, endDate) => {
        const now = new Date(), start = new Date(startDate), end = new Date(endDate);
        if (now < start) return { label: 'Upcoming', bg: 'rgba(96,165,250,0.1)', color: '#60a5fa', border: 'rgba(96,165,250,0.3)' };
        if (now >= start && now <= end) return { label: 'Active', bg: 'rgba(52,211,153,0.1)', color: '#34d399', border: 'rgba(52,211,153,0.3)' };
        return { label: 'Completed', bg: 'rgba(0,0,0,0.04)', color: '#9ca3af', border: 'rgba(0,0,0,0.1)' };
    };

    const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

    const statsData = [
        { label: 'Total Cohorts', value: cohorts.length, icon: Users },
        { label: 'Active', value: cohorts.filter(c => { const now = new Date(); return now >= new Date(c.startDate) && now <= new Date(c.endDate); }).length, icon: Calendar },
        { label: 'Upcoming', value: cohorts.filter(c => new Date() < new Date(c.startDate)).length, icon: Clock },
        { label: 'Completed', value: cohorts.filter(c => new Date() > new Date(c.endDate)).length, icon: Calendar },
    ];

    if (loading) {
        return (
            <div className="py-8 animate-pulse">
                <div className="flex items-center gap-3 mb-8"><div className="w-1 h-7 rounded-full bg-stone-200" /><div className="h-8 bg-stone-200 rounded-2xl w-32" /></div>
                <div className="grid grid-cols-4 gap-5 mb-6">{[1,2,3,4].map(i => <div key={i} className="bg-white rounded-3xl h-24 border border-stone-100" />)}</div>
                <div className="grid grid-cols-3 gap-5">{[1,2,3].map(i => <div key={i} className="bg-white rounded-3xl h-44 border border-stone-100" />)}</div>
            </div>
        );
    }

    return (
        <div className="py-2">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-1 h-7 rounded-full" style={{ background: `linear-gradient(to bottom, ${GOLD}, transparent)` }} />
                        <h1 className="text-3xl font-black tracking-tighter text-stone-900">Cohorts</h1>
                    </div>
                    <p className="text-stone-400 font-medium ml-4">Manage program cohorts and track their progress</p>
                </div>
                <button onClick={() => { resetForm(); setOpen(true); }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-sm text-black shadow-lg transition-all hover:opacity-90 active:scale-[0.97]"
                    style={{ background: `linear-gradient(135deg, ${GOLD}, #D4B88C)` }}>
                    <Plus className="h-4 w-4" /> Add Cohort
                </button>
            </div>

            {error && (
                <Alert className="mb-6 rounded-2xl border border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <AlertDescription className="text-red-600">{error}</AlertDescription>
                </Alert>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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
                                <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                                    style={{ backgroundColor: 'rgba(184,151,90,0.1)' }}>
                                    <IconComponent className="h-5 w-5" style={{ color: GOLD }} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Cohorts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {cohorts.map(cohort => {
                    const status = getStatus(cohort.startDate, cohort.endDate);
                    return (
                        <div key={cohort._id} className="bg-white rounded-3xl border border-stone-100 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-full h-0.5 rounded-t-3xl"
                                style={{ background: `linear-gradient(to right, ${GOLD}, transparent)` }} />
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-xl font-black text-stone-900">{cohort.riika}</h3>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-xs font-black px-2.5 py-1 rounded-full border"
                                                style={{ backgroundColor: 'rgba(184,151,90,0.1)', color: GOLD, borderColor: 'rgba(184,151,90,0.25)' }}>
                                                {cohort.year}
                                            </span>
                                            <span className="text-xs font-black px-2.5 py-1 rounded-full border"
                                                style={{ backgroundColor: status.bg, color: status.color, borderColor: status.border }}>
                                                {status.label}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2.5 mb-5">
                                    <div className="flex items-center gap-2 text-sm text-stone-500">
                                        <MapPin className="h-4 w-4 flex-shrink-0" style={{ color: GOLD }} />
                                        <span className="font-semibold">{cohort.residence}</span>
                                    </div>
                                    <div className="pt-2 space-y-1.5" style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                                        <div className="flex items-center gap-2 text-xs text-stone-400">
                                            <Calendar className="h-3.5 w-3.5" style={{ color: GOLD }} />
                                            <span className="font-semibold text-stone-600">Start:</span>
                                            <span>{formatDate(cohort.startDate)}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-stone-400">
                                            <Calendar className="h-3.5 w-3.5 opacity-60" style={{ color: GOLD }} />
                                            <span className="font-semibold text-stone-600">End:</span>
                                            <span>{formatDate(cohort.endDate)}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2 pt-4" style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                                    <button className="flex-1 h-9 rounded-xl text-xs font-black border flex items-center justify-center gap-1.5 transition-all hover:bg-stone-50"
                                        style={{ borderColor: 'rgba(184,151,90,0.3)', color: GOLD }}
                                        onClick={() => openEditDialog(cohort)}>
                                        <Edit className="h-3 w-3" /> Edit
                                    </button>
                                    <button className="flex-1 h-9 rounded-xl text-xs font-black border border-red-100 text-red-400 flex items-center justify-center gap-1.5 transition-all hover:bg-red-50"
                                        onClick={() => handleDeleteCohort(cohort._id)}>
                                        <Trash2 className="h-3 w-3" /> Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {cohorts.length === 0 && !loading && (
                <div className="text-center py-20 bg-white rounded-3xl border border-stone-100 shadow-sm">
                    <div className="w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: 'rgba(184,151,90,0.08)' }}>
                        <Calendar className="h-10 w-10" style={{ color: GOLD }} />
                    </div>
                    <h3 className="text-xl font-black text-stone-900 mb-2">No cohorts found</h3>
                    <p className="text-stone-400 mb-6">Get started by creating your first cohort</p>
                    <button onClick={() => { resetForm(); setOpen(true); }}
                        className="px-6 py-2.5 rounded-2xl font-black text-sm text-black shadow-lg transition-all hover:opacity-90"
                        style={{ background: `linear-gradient(135deg, ${GOLD}, #D4B88C)` }}>
                        <Plus className="h-4 w-4 inline mr-2" />Add Cohort
                    </button>
                </div>
            )}

            {/* Add/Edit Dialog */}
            <Dialog open={open} onOpenChange={isOpen => { setOpen(isOpen); if (!isOpen) resetForm(); }}>
                <DialogContent className="max-w-md bg-white rounded-3xl border border-stone-100 shadow-2xl p-0">
                    <div className="h-1 w-full rounded-t-3xl" style={{ background: `linear-gradient(to right, ${GOLD}, #D4B88C)` }} />
                    <div className="p-8">
                        <DialogHeader className="mb-6">
                            <DialogTitle className="text-2xl font-black tracking-tighter text-stone-900">
                                {editMode ? 'Edit Cohort' : 'Add New Cohort'}
                            </DialogTitle>
                            <DialogDescription className="text-stone-400">
                                {editMode ? 'Update the cohort information below.' : 'Fill in the details for the new cohort. All fields are required.'}
                            </DialogDescription>
                        </DialogHeader>
                        {error && (
                            <Alert className="mb-5 rounded-2xl border border-red-200 bg-red-50">
                                <AlertCircle className="h-4 w-4 text-red-500" />
                                <AlertDescription className="text-red-600">{error}</AlertDescription>
                            </Alert>
                        )}
                        <div className="space-y-4">
                            {[
                                { id: 'riika', label: 'Riika Name *', type: 'text', placeholder: 'Enter riika name' },
                                { id: 'year', label: 'Year *', type: 'number', placeholder: 'e.g., 2024' },
                                { id: 'residence', label: 'Residence *', type: 'text', placeholder: 'Enter residence location' },
                                { id: 'startDate', label: 'Start Date *', type: 'date', placeholder: '' },
                                { id: 'endDate', label: 'End Date *', type: 'date', placeholder: '' },
                            ].map(f => (
                                <div key={f.id} className="space-y-1.5">
                                    <Label className={labelClass}>{f.label}</Label>
                                    <Input id={f.id} name={f.id} type={f.type} placeholder={f.placeholder}
                                        value={newCohort[f.id]} onChange={handleInputChange} className={inputClass}
                                        min={f.id === 'year' ? '2000' : undefined} max={f.id === 'year' ? '2100' : undefined} />
                                </div>
                            ))}
                        </div>
                        <DialogFooter className="mt-8 gap-3">
                            <button onClick={() => { setOpen(false); resetForm(); }} disabled={saving}
                                className="px-5 py-2.5 rounded-2xl font-black text-sm text-stone-600 border border-stone-200 hover:bg-stone-50 transition-all">
                                Cancel
                            </button>
                            <button onClick={editMode ? handleEditCohort : handleAddCohort} disabled={saving}
                                className="px-6 py-2.5 rounded-2xl font-black text-sm text-black shadow-lg transition-all hover:opacity-90 flex items-center gap-2"
                                style={{ background: `linear-gradient(135deg, ${GOLD}, #D4B88C)` }}>
                                {saving && <Loader2 className="h-3 w-3 animate-spin" />}
                                {editMode ? 'Update Cohort' : 'Add Cohort'}
                            </button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}