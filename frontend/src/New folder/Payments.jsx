import { React, useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import API from '@/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Plus, Search, X, CheckCircle, Clock, AlertCircle, Loader2,
    Smartphone, Building2, ChevronDown, ChevronUp, RefreshCw,
    TrendingUp, Users, Wallet, AlertTriangle, Upload, Eye, Filter
} from 'lucide-react';

const GOLD = '#B8975A';
const PROGRAM_AMOUNTS = { circumcision_and_mentorship: 150000, mentorship_only: 125000 };
const PROGRAM_LABELS  = { circumcision_and_mentorship: 'Circumcision & Mentorship', mentorship_only: 'Mentorship Only' };

const fmt = (n) => `KSh ${Number(n || 0).toLocaleString()}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-KE', { day:'numeric', month:'short', year:'numeric' }) : '—';
const timeAgo = (d) => {
    const diff = Date.now() - new Date(d); const mins = Math.floor(diff/60000);
    if (mins < 1) return 'just now'; if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins/60); if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs/24)}d ago`;
};

const statusColors = {
    paid:    { bg: 'rgba(52,211,153,0.1)',  color: '#34d399', border: 'rgba(52,211,153,0.25)',  label: 'Paid' },
    partial: { bg: 'rgba(251,146,60,0.1)',  color: '#fb923c', border: 'rgba(251,146,60,0.25)',  label: 'Partial' },
    unpaid:  { bg: 'rgba(248,113,113,0.1)', color: '#f87171', border: 'rgba(248,113,113,0.25)', label: 'Unpaid' },
};

export default function Payments() {
    const [payments, setPayments] = useState([]);
    const [summary, setSummary] = useState(null);
    const [mentees, setMentees] = useState([]);
    const [parents, setParents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterProgram, setFilterProgram] = useState('all');

    // Create payment record dialog
    const [createOpen, setCreateOpen] = useState(false);
    const [createForm, setCreateForm] = useState({ menteeId: '', parentId: '', programType: '' });
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState('');

    // Add transaction dialog
    const [txOpen, setTxOpen] = useState(false);
    const [txPayment, setTxPayment] = useState(null);
    const [txForm, setTxForm] = useState({ amount: '', method: 'mpesa', mpesaPhone: '', mpesaRef: '', bankName: '', bankRef: '', bankSlipUrl: '', notes: '' });
    const [txSaving, setTxSaving] = useState(false);
    const [txError, setTxError] = useState('');
    const [uploadingSlip, setUploadingSlip] = useState(false);

    // Detail view
    const [detailPayment, setDetailPayment] = useState(null);
    const [expandedTx, setExpandedTx] = useState({});

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [paymentsRes, summaryRes, menteesRes, parentsRes] = await Promise.all([
                API.get('/payments'),
                API.get('/payments/summary'),
                API.get('/mentees'),
                API.get('/parents'),
            ]);
            setPayments(paymentsRes.data);
            setSummary(summaryRes.data);
            setMentees(menteesRes.data);
            setParents(parentsRes.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    // ── Filtered payments ──────────────────────────────────────────────────
    const filtered = payments.filter(p => {
        const term = searchTerm.toLowerCase();
        const matchSearch = !term || (
            p.mentee?.name?.toLowerCase().includes(term) ||
            p.mentee?.admissionNumber?.toLowerCase().includes(term) ||
            p.parent?.name?.toLowerCase().includes(term)
        );
        const matchStatus  = filterStatus  === 'all' || p.status === filterStatus;
        const matchProgram = filterProgram === 'all' || p.programType === filterProgram;
        return matchSearch && matchStatus && matchProgram;
    });

    const activeFilters = [searchTerm, filterStatus !== 'all' ? filterStatus : '', filterProgram !== 'all' ? filterProgram : ''].filter(Boolean).length;

    // ── Create payment ─────────────────────────────────────────────────────
    const handleCreate = async () => {
        setCreateError('');
        if (!createForm.menteeId || !createForm.parentId || !createForm.programType) {
            setCreateError('Please fill all fields'); return;
        }
        setCreating(true);
        try {
            const res = await API.post('/payments', { menteeId: createForm.menteeId, parentId: createForm.parentId, programType: createForm.programType });
            setPayments(prev => [res.data, ...prev]);
            await fetchAll();
            setCreateOpen(false); setCreateForm({ menteeId: '', parentId: '', programType: '' });
        } catch (e) { setCreateError(e.response?.data?.error || 'Error creating payment record'); }
        finally { setCreating(false); }
    };

    // ── Upload bank slip ───────────────────────────────────────────────────
    const uploadBankSlip = async (file) => {
        const CLOUD_NAME   = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
        setUploadingSlip(true);
        try {
            const fd = new FormData();
            fd.append('file', file); fd.append('upload_preset', UPLOAD_PRESET);
            const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method:'POST', body:fd });
            const data = await res.json();
            setTxForm(prev => ({ ...prev, bankSlipUrl: data.secure_url }));
        } catch(e) { alert('Failed to upload bank slip'); }
        finally { setUploadingSlip(false); }
    };

    // ── Add transaction ────────────────────────────────────────────────────
    const handleAddTransaction = async () => {
        setTxError('');
        if (!txForm.amount || parseFloat(txForm.amount) <= 0) { setTxError('Enter a valid amount'); return; }
        if (txForm.method === 'mpesa' && !txForm.mpesaPhone) { setTxError('Enter M-Pesa phone number'); return; }
        if (txForm.method === 'bank' && !txForm.bankSlipUrl) { setTxError('Please upload the bank slip'); return; }
        setTxSaving(true);
        try {
            const res = await API.post(`/payments/${txPayment._id}/transactions`, txForm);
            setPayments(prev => prev.map(p => p._id === txPayment._id ? res.data : p));
            if (detailPayment?._id === txPayment._id) setDetailPayment(res.data);
            await fetchAll();
            setTxOpen(false);
            setTxForm({ amount:'', method:'mpesa', mpesaPhone:'', mpesaRef:'', bankName:'', bankRef:'', bankSlipUrl:'', notes:'' });
        } catch (e) { setTxError(e.response?.data?.error || 'Error recording transaction'); }
        finally { setTxSaving(false); }
    };

    // ── Confirm M-Pesa ─────────────────────────────────────────────────────
    const handleConfirmMpesa = async (paymentId, txId, mpesaRef) => {
        const ref = prompt('Enter M-Pesa confirmation code:');
        if (!ref) return;
        try {
            const res = await API.put(`/payments/${paymentId}/transactions/${txId}/confirm`, { mpesaRef: ref });
            setPayments(prev => prev.map(p => p._id === paymentId ? res.data : p));
            if (detailPayment?._id === paymentId) setDetailPayment(res.data);
            await fetchAll();
        } catch(e) { alert('Failed to confirm transaction'); }
    };

    const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) || '?';

    if (loading) return (
        <div className="py-8 animate-pulse">
            <div className="flex items-center gap-3 mb-8"><div className="w-1 h-7 rounded-full bg-stone-200"/><div className="h-8 bg-stone-200 rounded-2xl w-40"/></div>
            <div className="grid grid-cols-4 gap-4 mb-6">{[1,2,3,4].map(i=><div key={i} className="bg-white rounded-3xl h-24 border border-stone-100"/>)}</div>
        </div>
    );

    return (
        <div className="py-2">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-1 h-7 rounded-full" style={{ background:`linear-gradient(to bottom, ${GOLD}, transparent)` }}/>
                        <h1 className="text-3xl font-black tracking-tighter text-stone-900">Payments</h1>
                    </div>
                    <p className="text-stone-400 font-medium ml-4">Track program fees, M-Pesa & bank payments</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={fetchAll} className="p-2.5 rounded-2xl border border-stone-200 bg-white hover:bg-stone-50 transition-colors">
                        <RefreshCw className="h-4 w-4 text-stone-500"/>
                    </button>
                    <button onClick={() => setCreateOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-sm text-black shadow-lg transition-all hover:opacity-90"
                        style={{ background:`linear-gradient(135deg, ${GOLD}, #D4B88C)` }}>
                        <Plus className="h-4 w-4"/> Add Payment Record
                    </button>
                </div>
            </div>

            {/* Summary Stats */}
            {summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {[
                        { label:'Total Expected',   value: fmt(summary.totalExpected),   icon: Wallet,       color: GOLD },
                        { label:'Total Collected',  value: fmt(summary.totalCollected),  icon: TrendingUp,   color: '#34d399' },
                        { label:'Outstanding',      value: fmt(summary.totalBalance),    icon: AlertTriangle,color: '#f87171' },
                        { label:'Collection Rate',  value: `${summary.collectionRate}%`, icon: TrendingUp,   color: '#60a5fa' },
                    ].map((s,i) => (
                        <div key={i} className="bg-white rounded-3xl p-5 border border-stone-100 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-full h-0.5 rounded-t-3xl opacity-0 group-hover:opacity-100 transition-opacity"
                                style={{ background:`linear-gradient(to right, ${GOLD}, transparent)` }}/>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-black tracking-wide text-stone-400 uppercase mb-1">{s.label}</p>
                                    <p className="text-2xl font-black text-stone-900">{s.value}</p>
                                </div>
                                <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor:`${s.color}18` }}>
                                    <s.icon className="h-5 w-5" style={{ color: s.color }}/>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Status breakdown */}
            {summary && (
                <div className="grid grid-cols-3 gap-3 mb-6">
                    {Object.entries(statusColors).map(([key, s]) => (
                        <div key={key} className="bg-white rounded-2xl p-4 border border-stone-100 shadow-sm flex items-center gap-3 cursor-pointer hover:shadow-md transition-all"
                            onClick={() => setFilterStatus(filterStatus === key ? 'all' : key)}
                            style={filterStatus === key ? { border:`1px solid ${s.color}`, backgroundColor: s.bg } : {}}>
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: s.bg }}>
                                {key === 'paid' ? <CheckCircle className="h-4 w-4" style={{ color: s.color }}/> :
                                 key === 'partial' ? <Clock className="h-4 w-4" style={{ color: s.color }}/> :
                                 <AlertCircle className="h-4 w-4" style={{ color: s.color }}/>}
                            </div>
                            <div>
                                <p className="text-xs font-black text-stone-400 uppercase tracking-wide">{s.label}</p>
                                <p className="text-2xl font-black text-stone-900">{summary.byStatus[key]}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Search & Filter */}
            <div className="bg-white rounded-3xl border border-stone-100 shadow-sm p-5 mb-6">
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: GOLD }}/>
                        <Input placeholder="Search by mentee name, admission number or parent..."
                            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                            className="pl-11 h-10 rounded-2xl border-stone-200 focus:border-[#B8975A] focus:ring-0 text-sm"/>
                        {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-stone-100"><X className="h-3.5 w-3.5 text-stone-400"/></button>}
                    </div>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="h-10 min-w-[140px] rounded-2xl border border-stone-200 bg-white px-3 text-sm font-semibold text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#B8975A] hover:border-[#B8975A] transition-colors">
                            <SelectValue placeholder="All Statuses"/>
                        </SelectTrigger>
                        <SelectContent className="z-50 rounded-xl border border-stone-200 bg-white shadow-lg text-sm p-1">
                            <SelectItem className="rounded-lg px-3 py-2 cursor-pointer hover:bg-amber-50 text-stone-800 font-medium" value="all">All Statuses</SelectItem>
                            <SelectItem className="rounded-lg px-3 py-2 cursor-pointer hover:bg-amber-50 text-stone-800 font-medium" value="paid">Paid</SelectItem>
                            <SelectItem className="rounded-lg px-3 py-2 cursor-pointer hover:bg-amber-50 text-stone-800 font-medium" value="partial">Partial</SelectItem>
                            <SelectItem className="rounded-lg px-3 py-2 cursor-pointer hover:bg-amber-50 text-stone-800 font-medium" value="unpaid">Unpaid</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={filterProgram} onValueChange={setFilterProgram}>
                        <SelectTrigger className="h-10 min-w-[200px] rounded-2xl border border-stone-200 bg-white px-3 text-sm font-semibold text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#B8975A] hover:border-[#B8975A] transition-colors">
                            <SelectValue placeholder="All Programs"/>
                        </SelectTrigger>
                        <SelectContent className="z-50 rounded-xl border border-stone-200 bg-white shadow-lg text-sm p-1">
                            <SelectItem className="rounded-lg px-3 py-2 cursor-pointer hover:bg-amber-50 text-stone-800 font-medium" value="all">All Programs</SelectItem>
                            <SelectItem className="rounded-lg px-3 py-2 cursor-pointer hover:bg-amber-50 text-stone-800 font-medium" value="circumcision_and_mentorship">Circumcision & Mentorship</SelectItem>
                            <SelectItem className="rounded-lg px-3 py-2 cursor-pointer hover:bg-amber-50 text-stone-800 font-medium" value="mentorship_only">Mentorship Only</SelectItem>
                        </SelectContent>
                    </Select>
                    {activeFilters > 0 && (
                        <button onClick={() => { setSearchTerm(''); setFilterStatus('all'); setFilterProgram('all'); }}
                            className="h-10 px-3 rounded-2xl text-xs font-black border border-stone-200 text-stone-500 hover:bg-stone-50 flex items-center gap-1.5">
                            <X className="h-3 w-3"/> Clear
                            <span className="w-4 h-4 rounded-full text-white text-[10px] flex items-center justify-center font-black" style={{ backgroundColor: GOLD }}>{activeFilters}</span>
                        </button>
                    )}
                </div>
                <p className="text-xs font-semibold text-stone-400 mt-3">
                    Showing <span className="font-black text-stone-700">{filtered.length}</span> of <span className="font-black text-stone-700">{payments.length}</span> records
                </p>
            </div>

            {/* Payments list */}
            <div className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
                {filtered.length === 0 ? (
                    <div className="text-center py-20">
                        <Wallet className="h-10 w-10 mx-auto mb-4" style={{ color: GOLD, opacity: 0.4 }}/>
                        <p className="font-black text-stone-400">{activeFilters > 0 ? 'No payments match your filters' : 'No payment records yet'}</p>
                    </div>
                ) : (
                    <div className="divide-y divide-stone-50">
                        {filtered.map(payment => {
                            const sc = statusColors[payment.status] || statusColors.unpaid;
                            const pct = payment.totalAmount > 0 ? Math.min(100, Math.round((payment.amountPaid / payment.totalAmount) * 100)) : 0;
                            const isExpanded = expandedTx[payment._id];
                            return (
                                <div key={payment._id} className="hover:bg-stone-50/60 transition-colors">
                                    <div className="p-5">
                                        <div className="flex items-center justify-between gap-4">
                                            {/* Mentee info */}
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <Avatar className="h-11 w-11 rounded-2xl flex-shrink-0">
                                                    <AvatarFallback className="rounded-2xl font-black text-black text-sm"
                                                        style={{ background:`linear-gradient(135deg, ${GOLD}, #D4B88C)` }}>
                                                        {getInitials(payment.mentee?.name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className="font-black text-stone-900 text-sm truncate">{payment.mentee?.name || 'Unknown'}</p>
                                                        {payment.mentee?.admissionNumber && (
                                                            <span className="text-[10px] font-mono font-semibold text-stone-400">{payment.mentee.admissionNumber}</span>
                                                        )}
                                                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full border"
                                                            style={{ backgroundColor: sc.bg, color: sc.color, borderColor: sc.border }}>
                                                            {sc.label}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-stone-400 font-medium mt-0.5">
                                                        {payment.parent?.name} · {PROGRAM_LABELS[payment.programType]}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Amount + progress */}
                                            <div className="hidden md:block text-right flex-shrink-0 min-w-[160px]">
                                                <p className="text-sm font-black text-stone-900">{fmt(payment.amountPaid)} <span className="text-stone-400 font-semibold">/ {fmt(payment.totalAmount)}</span></p>
                                                <div className="mt-1.5 h-1.5 rounded-full bg-stone-100 overflow-hidden w-36 ml-auto">
                                                    <div className="h-full rounded-full transition-all" style={{ width:`${pct}%`, backgroundColor: sc.color }}/>
                                                </div>
                                                <p className="text-[10px] text-stone-400 font-semibold mt-0.5">{pct}% · Balance: {fmt(payment.balance)}</p>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <button onClick={() => { setTxPayment(payment); setTxOpen(true); }}
                                                    className="h-8 px-3 rounded-xl text-xs font-black text-black transition-all hover:opacity-90"
                                                    style={{ background:`linear-gradient(135deg, ${GOLD}, #D4B88C)` }}>
                                                    + Pay
                                                </button>
                                                <button onClick={() => setDetailPayment(payment)}
                                                    className="h-8 px-3 rounded-xl text-xs font-black border border-stone-200 text-stone-600 hover:bg-stone-50 transition-all flex items-center gap-1">
                                                    <Eye className="h-3 w-3"/> View
                                                </button>
                                                <button onClick={() => setExpandedTx(prev => ({ ...prev, [payment._id]: !prev[payment._id] }))}
                                                    className="h-8 w-8 rounded-xl border border-stone-200 text-stone-400 hover:bg-stone-50 flex items-center justify-center transition-all">
                                                    {isExpanded ? <ChevronUp className="h-3.5 w-3.5"/> : <ChevronDown className="h-3.5 w-3.5"/>}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Inline transaction history */}
                                        {isExpanded && payment.transactions?.length > 0 && (
                                            <div className="mt-4 ml-14 space-y-2">
                                                {payment.transactions.map((tx, i) => (
                                                    <div key={i} className="flex items-center justify-between px-4 py-2.5 rounded-2xl"
                                                        style={{ backgroundColor: 'rgba(0,0,0,0.03)', border:'1px solid rgba(0,0,0,0.06)' }}>
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                                                                style={{ backgroundColor: tx.method === 'mpesa' ? 'rgba(52,211,153,0.1)' : 'rgba(96,165,250,0.1)' }}>
                                                                {tx.method === 'mpesa'
                                                                    ? <Smartphone className="h-3.5 w-3.5 text-emerald-500"/>
                                                                    : <Building2 className="h-3.5 w-3.5 text-blue-400"/>}
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-black text-stone-800">
                                                                    {fmt(tx.amount)} · {tx.method === 'mpesa' ? 'M-Pesa' : 'Bank'}
                                                                    {tx.method === 'mpesa' && tx.mpesaRef && <span className="ml-2 font-mono text-[10px] text-stone-400">{tx.mpesaRef}</span>}
                                                                    {tx.method === 'bank' && tx.bankRef && <span className="ml-2 font-mono text-[10px] text-stone-400">{tx.bankRef}</span>}
                                                                </p>
                                                                <p className="text-[10px] text-stone-400">{timeAgo(tx.paidAt)}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {tx.method === 'mpesa' && tx.mpesaStatus === 'pending' && (
                                                                <button onClick={() => handleConfirmMpesa(payment._id, tx._id)}
                                                                    className="text-[10px] font-black px-2 py-1 rounded-lg border border-amber-200 text-amber-600 hover:bg-amber-50 transition-colors">
                                                                    Confirm
                                                                </button>
                                                            )}
                                                            {tx.method === 'bank' && tx.bankSlipUrl && (
                                                                <a href={tx.bankSlipUrl} target="_blank" rel="noreferrer"
                                                                    className="text-[10px] font-black px-2 py-1 rounded-lg border border-blue-100 text-blue-500 hover:bg-blue-50 transition-colors">
                                                                    View Slip
                                                                </a>
                                                            )}
                                                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                                                                style={tx.mpesaStatus === 'confirmed' || tx.method === 'bank'
                                                                    ? { backgroundColor:'rgba(52,211,153,0.1)', color:'#34d399' }
                                                                    : tx.mpesaStatus === 'pending'
                                                                    ? { backgroundColor:'rgba(251,146,60,0.1)', color:'#fb923c' }
                                                                    : { backgroundColor:'rgba(248,113,113,0.1)', color:'#f87171' }}>
                                                                {tx.mpesaStatus === 'confirmed' || tx.method === 'bank' ? 'Confirmed' : tx.mpesaStatus}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {isExpanded && !payment.transactions?.length && (
                                            <p className="text-xs text-stone-400 font-medium mt-3 ml-14">No transactions yet</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── Create Payment Record Dialog ───────────────────────────── */}
            <Dialog open={createOpen} onOpenChange={v => { setCreateOpen(v); if (!v) { setCreateError(''); setCreateForm({ menteeId:'', parentId:'', programType:'' }); }}}>
                <DialogContent className="max-w-md bg-white rounded-3xl border border-stone-100 shadow-2xl p-0">
                    <div className="h-1 w-full rounded-t-3xl" style={{ background:`linear-gradient(to right, ${GOLD}, #D4B88C)` }}/>
                    <div className="p-8">
                        <DialogHeader className="mb-6">
                            <DialogTitle className="text-2xl font-black tracking-tighter text-stone-900">New Payment Record</DialogTitle>
                            <DialogDescription className="text-stone-400">Link a mentee to a payment plan. The parent pays the program fee.</DialogDescription>
                        </DialogHeader>
                        {createError && (
                            <Alert className="mb-4 rounded-2xl border border-red-200 bg-red-50">
                                <AlertCircle className="h-4 w-4 text-red-500"/>
                                <AlertDescription className="text-red-600">{createError}</AlertDescription>
                            </Alert>
                        )}
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-black tracking-widest uppercase text-stone-500">Mentee *</Label>
                                <Select value={createForm.menteeId} onValueChange={v => setCreateForm(p=>({...p, menteeId:v}))}>
                                    <SelectTrigger className="h-10 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#B8975A] hover:border-[#B8975A] transition-colors">
                                        <SelectValue placeholder="Select mentee"/>
                                    </SelectTrigger>
                                    <SelectContent className="z-50 rounded-xl border border-stone-200 bg-white shadow-lg text-sm p-1 max-h-52 overflow-y-auto">
                                        {mentees.map(m => (
                                            <SelectItem className="rounded-lg px-3 py-2 cursor-pointer hover:bg-amber-50 text-stone-800 font-medium" key={m._id} value={m._id}>
                                                {m.name} {m.admissionNumber ? `· ${m.admissionNumber}` : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-black tracking-widest uppercase text-stone-500">Parent / Guardian *</Label>
                                <Select value={createForm.parentId} onValueChange={v => setCreateForm(p=>({...p, parentId:v}))}>
                                    <SelectTrigger className="h-10 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#B8975A] hover:border-[#B8975A] transition-colors">
                                        <SelectValue placeholder="Select parent"/>
                                    </SelectTrigger>
                                    <SelectContent className="z-50 rounded-xl border border-stone-200 bg-white shadow-lg text-sm p-1 max-h-52 overflow-y-auto">
                                        {parents.map(p => (
                                            <SelectItem className="rounded-lg px-3 py-2 cursor-pointer hover:bg-amber-50 text-stone-800 font-medium" key={p._id} value={p._id}>
                                                {p.name} ({p.parent}) · {p.phone}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-black tracking-widest uppercase text-stone-500">Program Type *</Label>
                                <Select value={createForm.programType} onValueChange={v => setCreateForm(p=>({...p, programType:v}))}>
                                    <SelectTrigger className="h-10 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#B8975A] hover:border-[#B8975A] transition-colors">
                                        <SelectValue placeholder="Select program"/>
                                    </SelectTrigger>
                                    <SelectContent className="z-50 rounded-xl border border-stone-200 bg-white shadow-lg text-sm p-1">
                                        <SelectItem className="rounded-lg px-3 py-2 cursor-pointer hover:bg-amber-50 text-stone-800 font-medium" value="circumcision_and_mentorship">
                                            Circumcision & Mentorship — KSh 150,000
                                        </SelectItem>
                                        <SelectItem className="rounded-lg px-3 py-2 cursor-pointer hover:bg-amber-50 text-stone-800 font-medium" value="mentorship_only">
                                            Mentorship Only — KSh 125,000
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                {createForm.programType && (
                                    <p className="text-xs font-black mt-1" style={{ color: GOLD }}>
                                        Total due: {fmt(PROGRAM_AMOUNTS[createForm.programType])}
                                    </p>
                                )}
                            </div>
                        </div>
                        <DialogFooter className="mt-8 gap-3">
                            <button onClick={() => setCreateOpen(false)} className="px-5 py-2.5 rounded-2xl font-black text-sm text-stone-600 border border-stone-200 hover:bg-stone-50 transition-all">Cancel</button>
                            <button onClick={handleCreate} disabled={creating}
                                className="px-6 py-2.5 rounded-2xl font-black text-sm text-black shadow-lg transition-all hover:opacity-90 flex items-center gap-2"
                                style={{ background:`linear-gradient(135deg, ${GOLD}, #D4B88C)` }}>
                                {creating && <Loader2 className="h-3 w-3 animate-spin"/>}
                                Create Record
                            </button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ── Add Transaction Dialog ─────────────────────────────────── */}
            {txPayment && (
                <Dialog open={txOpen} onOpenChange={v => { setTxOpen(v); if (!v) { setTxError(''); setTxForm({ amount:'', method:'mpesa', mpesaPhone:'', mpesaRef:'', bankName:'', bankRef:'', bankSlipUrl:'', notes:'' }); }}}>
                    <DialogContent className="max-w-md bg-white rounded-3xl border border-stone-100 shadow-2xl p-0">
                        <div className="h-1 w-full rounded-t-3xl" style={{ background:`linear-gradient(to right, ${GOLD}, #D4B88C)` }}/>
                        <div className="p-8">
                            <DialogHeader className="mb-2">
                                <DialogTitle className="text-2xl font-black tracking-tighter text-stone-900">Record Payment</DialogTitle>
                                <DialogDescription className="text-stone-400">
                                    {txPayment.mentee?.name} · Balance: <span className="font-black text-red-400">{fmt(txPayment.balance)}</span>
                                </DialogDescription>
                            </DialogHeader>

                            {/* Progress bar */}
                            <div className="my-4 p-3 rounded-2xl bg-stone-50 border border-stone-100">
                                <div className="flex justify-between text-xs font-semibold text-stone-500 mb-1.5">
                                    <span>Paid: <span className="font-black text-stone-800">{fmt(txPayment.amountPaid)}</span></span>
                                    <span>Total: <span className="font-black text-stone-800">{fmt(txPayment.totalAmount)}</span></span>
                                </div>
                                <div className="h-2 rounded-full bg-stone-200 overflow-hidden">
                                    <div className="h-full rounded-full" style={{ width:`${Math.min(100,Math.round((txPayment.amountPaid/txPayment.totalAmount)*100))}%`, background:`linear-gradient(to right, ${GOLD}, #D4B88C)` }}/>
                                </div>
                            </div>

                            {txError && (
                                <Alert className="mb-4 rounded-2xl border border-red-200 bg-red-50">
                                    <AlertCircle className="h-4 w-4 text-red-500"/>
                                    <AlertDescription className="text-red-600">{txError}</AlertDescription>
                                </Alert>
                            )}

                            <div className="space-y-4">
                                {/* Payment method toggle */}
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-black tracking-widest uppercase text-stone-500">Payment Method *</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {['mpesa','bank'].map(m => (
                                            <button key={m} onClick={() => setTxForm(p=>({...p, method:m}))}
                                                className="flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-black border transition-all"
                                                style={txForm.method === m
                                                    ? { background:`linear-gradient(135deg, ${GOLD}, #D4B88C)`, border:'none', color:'#000' }
                                                    : { borderColor:'rgba(0,0,0,0.1)', color:'#666' }}>
                                                {m === 'mpesa' ? <Smartphone className="h-4 w-4"/> : <Building2 className="h-4 w-4"/>}
                                                {m === 'mpesa' ? 'M-Pesa' : 'Bank'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-black tracking-widest uppercase text-stone-500">Amount (KSh) *</Label>
                                    <Input type="number" placeholder="0" value={txForm.amount} onChange={e => setTxForm(p=>({...p, amount:e.target.value}))}
                                        className="h-10 rounded-xl border-stone-200 focus:border-[#B8975A] focus:ring-0 text-sm"/>
                                </div>

                                {txForm.method === 'mpesa' && (
                                    <>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-black tracking-widest uppercase text-stone-500">M-Pesa Phone Number *</Label>
                                            <Input placeholder="+254 7XX XXX XXX" value={txForm.mpesaPhone} onChange={e => setTxForm(p=>({...p, mpesaPhone:e.target.value}))}
                                                className="h-10 rounded-xl border-stone-200 focus:border-[#B8975A] focus:ring-0 text-sm"/>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-black tracking-widest uppercase text-stone-500">M-Pesa Confirmation Code (Optional)</Label>
                                            <Input placeholder="e.g. QDK3X12ABC" value={txForm.mpesaRef} onChange={e => setTxForm(p=>({...p, mpesaRef:e.target.value}))}
                                                className="h-10 rounded-xl border-stone-200 focus:border-[#B8975A] focus:ring-0 font-mono text-sm"/>
                                            <p className="text-[10px] text-stone-400 font-semibold">Leave blank if confirmation not yet received — you can confirm later</p>
                                        </div>
                                    </>
                                )}

                                {txForm.method === 'bank' && (
                                    <>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-black tracking-widest uppercase text-stone-500">Bank Name *</Label>
                                            <Input placeholder="e.g. Equity, KCB, Co-op" value={txForm.bankName} onChange={e => setTxForm(p=>({...p, bankName:e.target.value}))}
                                                className="h-10 rounded-xl border-stone-200 focus:border-[#B8975A] focus:ring-0 text-sm"/>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-black tracking-widest uppercase text-stone-500">Bank Reference Number</Label>
                                            <Input placeholder="Transaction reference" value={txForm.bankRef} onChange={e => setTxForm(p=>({...p, bankRef:e.target.value}))}
                                                className="h-10 rounded-xl border-stone-200 focus:border-[#B8975A] focus:ring-0 font-mono text-sm"/>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-black tracking-widest uppercase text-stone-500">Bank Slip Photo *</Label>
                                            {txForm.bankSlipUrl ? (
                                                <div className="flex items-center gap-3 p-3 rounded-xl border border-emerald-200 bg-emerald-50">
                                                    <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0"/>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-black text-emerald-700">Slip uploaded</p>
                                                        <a href={txForm.bankSlipUrl} target="_blank" rel="noreferrer" className="text-[10px] text-emerald-600 underline truncate block">View</a>
                                                    </div>
                                                    <button onClick={() => setTxForm(p=>({...p, bankSlipUrl:''}))} className="p-1 rounded-lg hover:bg-emerald-100">
                                                        <X className="h-3.5 w-3.5 text-emerald-500"/>
                                                    </button>
                                                </div>
                                            ) : (
                                                <label className="flex items-center gap-3 p-4 rounded-xl border-2 border-dashed cursor-pointer hover:bg-amber-50/40 transition-colors"
                                                    style={{ borderColor:'rgba(184,151,90,0.3)' }}>
                                                    {uploadingSlip
                                                        ? <Loader2 className="h-5 w-5 animate-spin" style={{ color: GOLD }}/>
                                                        : <Upload className="h-5 w-5" style={{ color: GOLD }}/>}
                                                    <span className="text-sm font-semibold text-stone-500">{uploadingSlip ? 'Uploading...' : 'Click to upload bank slip'}</span>
                                                    <input type="file" accept="image/*,.pdf" className="hidden" onChange={e => uploadBankSlip(e.target.files[0])}/>
                                                </label>
                                            )}
                                        </div>
                                    </>
                                )}

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-black tracking-widest uppercase text-stone-500">Notes (Optional)</Label>
                                    <Input placeholder="Any additional notes..." value={txForm.notes} onChange={e => setTxForm(p=>({...p, notes:e.target.value}))}
                                        className="h-10 rounded-xl border-stone-200 focus:border-[#B8975A] focus:ring-0 text-sm"/>
                                </div>
                            </div>

                            <DialogFooter className="mt-8 gap-3">
                                <button onClick={() => setTxOpen(false)} className="px-5 py-2.5 rounded-2xl font-black text-sm text-stone-600 border border-stone-200 hover:bg-stone-50 transition-all">Cancel</button>
                                <button onClick={handleAddTransaction} disabled={txSaving}
                                    className="px-6 py-2.5 rounded-2xl font-black text-sm text-black shadow-lg transition-all hover:opacity-90 flex items-center gap-2"
                                    style={{ background:`linear-gradient(135deg, ${GOLD}, #D4B88C)` }}>
                                    {txSaving && <Loader2 className="h-3 w-3 animate-spin"/>}
                                    Record Payment
                                </button>
                            </DialogFooter>
                        </div>
                    </DialogContent>
                </Dialog>
            )}

            {/* ── Detail Dialog ──────────────────────────────────────────── */}
            {detailPayment && (
                <Dialog open={!!detailPayment} onOpenChange={v => { if (!v) setDetailPayment(null); }}>
                    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-3xl border border-stone-100 shadow-2xl p-0">
                        <div className="h-1 w-full rounded-t-3xl" style={{ background:`linear-gradient(to right, ${GOLD}, #D4B88C)` }}/>
                        <div className="p-8">
                            <DialogHeader className="mb-5">
                                <DialogTitle className="text-2xl font-black tracking-tighter text-stone-900">{detailPayment.mentee?.name}</DialogTitle>
                                <DialogDescription className="text-stone-400">
                                    {detailPayment.mentee?.admissionNumber} · {PROGRAM_LABELS[detailPayment.programType]}
                                </DialogDescription>
                            </DialogHeader>

                            {/* Summary */}
                            <div className="grid grid-cols-3 gap-3 mb-6">
                                {[
                                    { label:'Total', value: fmt(detailPayment.totalAmount) },
                                    { label:'Paid',  value: fmt(detailPayment.amountPaid), color:'#34d399' },
                                    { label:'Balance', value: fmt(detailPayment.balance), color:'#f87171' },
                                ].map((s,i) => (
                                    <div key={i} className="rounded-2xl p-3 text-center bg-stone-50 border border-stone-100">
                                        <p className="text-[10px] font-black tracking-wide text-stone-400 uppercase">{s.label}</p>
                                        <p className="text-lg font-black mt-1" style={{ color: s.color || '#1a1a1a' }}>{s.value}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Progress */}
                            <div className="mb-6">
                                <div className="h-2.5 rounded-full bg-stone-100 overflow-hidden">
                                    <div className="h-full rounded-full" style={{ width:`${Math.min(100,Math.round((detailPayment.amountPaid/detailPayment.totalAmount)*100))}%`, background:`linear-gradient(to right, ${GOLD}, #D4B88C)` }}/>
                                </div>
                                <p className="text-xs font-semibold text-stone-400 mt-1 text-right">{Math.min(100,Math.round((detailPayment.amountPaid/detailPayment.totalAmount)*100))}% paid</p>
                            </div>

                            {/* Transaction history */}
                            <p className="text-xs font-black tracking-widest uppercase text-stone-400 mb-3">Transaction History</p>
                            {detailPayment.transactions?.length === 0 && <p className="text-sm text-stone-400 text-center py-6">No transactions recorded yet</p>}
                            <div className="space-y-2">
                                {detailPayment.transactions?.map((tx, i) => (
                                    <div key={i} className="flex items-start justify-between p-4 rounded-2xl" style={{ backgroundColor:'rgba(0,0,0,0.02)', border:'1px solid rgba(0,0,0,0.06)' }}>
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                                                style={{ backgroundColor: tx.method === 'mpesa' ? 'rgba(52,211,153,0.1)' : 'rgba(96,165,250,0.1)' }}>
                                                {tx.method === 'mpesa' ? <Smartphone className="h-4 w-4 text-emerald-500"/> : <Building2 className="h-4 w-4 text-blue-400"/>}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-stone-900">{fmt(tx.amount)}</p>
                                                <p className="text-xs text-stone-500 font-medium mt-0.5">
                                                    {tx.method === 'mpesa' ? `M-Pesa · ${tx.mpesaPhone}` : `Bank · ${tx.bankName}`}
                                                </p>
                                                {(tx.mpesaRef || tx.bankRef) && (
                                                    <p className="text-[10px] font-mono text-stone-400 mt-0.5">{tx.mpesaRef || tx.bankRef}</p>
                                                )}
                                                <p className="text-[10px] text-stone-300 mt-0.5">{fmtDate(tx.paidAt)} · {tx.recordedBy}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {tx.method === 'mpesa' && tx.mpesaStatus === 'pending' && (
                                                <button onClick={() => handleConfirmMpesa(detailPayment._id, tx._id)}
                                                    className="text-[10px] font-black px-2 py-1 rounded-lg border border-amber-200 text-amber-600 hover:bg-amber-50">
                                                    Confirm
                                                </button>
                                            )}
                                            {tx.bankSlipUrl && (
                                                <a href={tx.bankSlipUrl} target="_blank" rel="noreferrer"
                                                    className="text-[10px] font-black px-2 py-1 rounded-lg border border-blue-100 text-blue-500 hover:bg-blue-50">
                                                    View Slip
                                                </a>
                                            )}
                                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                                                style={tx.mpesaStatus === 'confirmed' || tx.method === 'bank'
                                                    ? { backgroundColor:'rgba(52,211,153,0.1)', color:'#34d399' }
                                                    : { backgroundColor:'rgba(251,146,60,0.1)', color:'#fb923c' }}>
                                                {tx.mpesaStatus === 'confirmed' || tx.method === 'bank' ? '✓ Confirmed' : 'Pending'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <DialogFooter className="mt-6 gap-3">
                                <button onClick={() => setDetailPayment(null)} className="px-5 py-2.5 rounded-2xl font-black text-sm text-stone-600 border border-stone-200 hover:bg-stone-50">Close</button>
                                <button onClick={() => { setTxPayment(detailPayment); setTxOpen(true); setDetailPayment(null); }}
                                    className="px-6 py-2.5 rounded-2xl font-black text-sm text-black shadow-lg transition-all hover:opacity-90"
                                    style={{ background:`linear-gradient(135deg, ${GOLD}, #D4B88C)` }}>
                                    + Add Payment
                                </button>
                            </DialogFooter>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}