import { React, useState, useRef } from 'react';
import API from '@/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import {
    FileSpreadsheet, Upload, Download, X, CheckCircle,
    AlertTriangle, Loader2, ChevronDown, ChevronUp, FileDown
} from 'lucide-react';

const GOLD = '#B8975A';

// ── Column definitions per sheet ────────────────────────────────────────────
const SHEET_DEFS = {
    Mentees: {
        label: 'Mentees',
        color: '#60a5fa',
        required: ['name', 'email', 'phone', 'dob', 'schoolsystem', 'grade', 'school', 'procedure', 'doctorname', 'doctoremail', 'programtype'],
        optional: ['admissionnumber', 'cohort', 'parents'],
        template: [
            'name,email,phone,dob,schoolSystem,grade,school,procedure,doctorName,doctorEmail,programType,cohort,parents',
            'John Kamau,john@email.com,0712345678,2008-03-15,8-4-4,Form 2,Nairobi School,Medical notes here,Dr. Kamau,dr@hospital.com,circumcision_and_mentorship,BARAKOA 2024,James Kamau',
            'Mary Wanjiru,mary@email.com,0733000002,2009-06-20,CBC,Grade 7,Strathmore School,Medical notes here,Dr. Otieno,otieno@hospital.com,mentorship_only,BARAKOA 2024,Grace Wanjiru',
        ],
        note: 'phone: 07XX format | grade: Form X (8-4-4) or Grade X (CBC/IGCSE) | programType: circumcision_and_mentorship or mentorship_only',
    },
    Parents: {
        label: 'Parents',
        color: '#f472b6',
        required: ['parent', 'name', 'phone', 'email', 'profession', 'residence'],
        optional: ['mentee'],
        template: [
            'parent,name,phone,email,profession,residence,mentee',
            'Father,James Kamau,0722000001,james@email.com,Engineer,Nairobi,John Kamau',
            'Mother,Grace Wanjiru,0733000002,grace@email.com,Teacher,Kiambu,John Kamau',
            'Guardian,Uncle Peter,0744000003,peter@email.com,Business,Thika,',
        ],
        note: 'parent = Father | Mother | Guardian | mentee = mentee name to link (optional)',
    },
    Cohorts: {
        label: 'Cohorts',
        color: '#34d399',
        required: ['riika', 'year', 'residence', 'startdate', 'enddate'],
        optional: [],
        template: [
            'riika,year,residence,startDate,endDate',
            'BARAKOA,2024,Nairobi,2024-01-15,2024-12-15',
            'THEMANINI,2025,Kiambu,2025-02-01,2025-11-30',
        ],
        note: 'startDate & endDate format: YYYY-MM-DD',
    },
};

const norm = (str) => str?.toString().trim().toLowerCase().replace(/[\s_-]+/g, '');

// ── Parse one sheet's rows ───────────────────────────────────────────────────
function parseSheet(data, sheetName) {
    const def = SHEET_DEFS[sheetName];
    if (!data || data.length < 2) return { valid: [], errors: [`${sheetName} sheet is empty or missing headers`] };

    const rawHeaders = data[0].map(h => norm(h?.toString() || ''));
    const rows = data.slice(1).filter(r => r.some(c => c !== null && c !== undefined && c !== ''));

    const valid = [], errors = [];

    rows.forEach((row, i) => {
        const rowNum = i + 2;
        const obj = {};
        rawHeaders.forEach((h, idx) => { obj[h] = row[idx]?.toString().trim() || ''; });

        const missing = def.required.filter(f => !obj[f]);
        if (missing.length) {
            errors.push(`${sheetName} row ${rowNum}: missing ${missing.join(', ')}`);
        } else {
            valid.push({ ...obj, _rowNum: rowNum });
        }
    });

    return { valid, errors };
}

// ── Import handlers ──────────────────────────────────────────────────────────
async function importCohorts(rows) {
    const results = { success: 0, failed: 0, errors: [], idMap: {} };
    for (const row of rows) {
        try {
            const payload = {
                riika: row.riika,
                year: parseInt(row.year),
                residence: row.residence,
                startDate: new Date(row.startdate || row.startDate),
                endDate: new Date(row.enddate || row.endDate),
            };
            const res = await API.post('/cohorts', payload);
            results.success++;
            // Map riika+year → _id for linking mentees later
            results.idMap[norm(row.riika)] = res.data._id;
            results.idMap[row.year?.toString()] = res.data._id;
            results.idMap[`${norm(row.riika)}${row.year}`] = res.data._id;
        } catch (e) {
            results.failed++;
            results.errors.push(`Cohort row ${row._rowNum}: ${e.response?.data?.error || e.message}`);
        }
    }
    return results;
}

async function importParents(rows) {
    const results = { success: 0, failed: 0, errors: [], nameMap: {} };
    // Fetch existing mentees to resolve names → IDs
    let menteeList = [];
    try { const r = await API.get('/mentees'); menteeList = r.data; } catch {}

    for (const row of rows) {
        try {
            const payload = {
                parent: row.parent,
                name: row.name,
                phone: row.phone,
                email: row.email,
                profession: row.profession,
                residence: row.residence,
                mentee: [],
            };
            // Resolve mentee name → ID
            if (row.mentee) {
                const menteeNames = row.mentee.split(/[;,]/).map(s => s.trim()).filter(Boolean);
                menteeNames.forEach(mName => {
                    const found = menteeList.find(m => norm(m.name) === norm(mName));
                    if (found) payload.mentee.push(found._id);
                });
            }
            const res = await API.post('/parents', payload);
            results.success++;
            results.nameMap[norm(row.name)] = res.data._id;
        } catch (e) {
            results.failed++;
            results.errors.push(`Parent row ${row._rowNum} (${row.name}): ${e.response?.data?.error || e.message}`);
        }
    }
    return results;
}

async function importMentees(rows, cohortIdMap, parentNameMap, skipBilling = false) {
    const results = { success: 0, failed: 0, errors: [] };
    // Fetch existing cohorts and parents to supplement maps
    let cohortList = [], parentList = [];
    try { const r = await API.get('/cohorts'); cohortList = r.data; } catch {}
    try { const r = await API.get('/parents'); parentList = r.data; } catch {}

    // Build full cohort map from DB
    cohortList.forEach(c => {
        cohortIdMap[norm(c.riika)] = cohortIdMap[norm(c.riika)] || c._id;
        cohortIdMap[c.year?.toString()] = cohortIdMap[c.year?.toString()] || c._id;
        cohortIdMap[`${norm(c.riika)}${c.year}`] = cohortIdMap[`${norm(c.riika)}${c.year}`] || c._id;
    });
    // Build full parent map from DB
    parentList.forEach(p => { parentNameMap[norm(p.name)] = parentNameMap[norm(p.name)] || p._id; });

    for (const row of rows) {
        try {
            // Resolve cohort
            let cohortId = null;
            if (row.cohort) {
                const key = norm(row.cohort);
                cohortId = cohortIdMap[key] ||
                    cohortIdMap[row.cohort?.split(' ').pop()] || // try year part
                    null;
            }

            // Resolve parents
            const parentIds = [];
            if (row.parents) {
                row.parents.split(/[;,]/).map(s => s.trim()).filter(Boolean).forEach(pName => {
                    const pid = parentNameMap[norm(pName)];
                    if (pid) parentIds.push(pid);
                });
            }

            const payload = {
                name: row.name,
                email: row.email,
                phone: row.phone,
                dob: new Date(row.dob),
                schoolSystem: row.schoolsystem || row.schoolSystem,
                grade: row.grade,
                school: row.school,
                procedure: row.procedure,
                doctorName: row.doctorname || row.doctorName,
                doctorEmail: row.doctoremail || row.doctorEmail,
                programType: row.programtype || row.programType || 'mentorship_only',
                parents: parentIds,
                ...(cohortId ? { cohort: cohortId } : {}),
                ...(row.admissionnumber ? { admissionNumber: row.admissionnumber.toUpperCase() } : {}),
            };

            await API.post('/mentees', { ...payload, skipBilling });
            results.success++;
        } catch (e) {
            results.failed++;
            results.errors.push(`Mentee row ${row._rowNum} (${row.name}): ${e.response?.data?.error || e.message}`);
        }
    }
    return results;
}

// ── Status badge ─────────────────────────────────────────────────────────────
const SheetStatus = ({ label, color, status, success, failed, total, errors, expanded, onToggle }) => (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: `${color}30` }}>
        <div className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
            style={{ backgroundColor: `${color}08` }} onClick={onToggle}>
            <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                <span className="text-sm font-black text-stone-800">{label}</span>
                {status === 'idle' && total > 0 && (
                    <span className="text-xs font-semibold text-stone-400">{total} rows ready</span>
                )}
                {status === 'running' && <Loader2 className="h-3.5 w-3.5 animate-spin text-stone-400" />}
                {status === 'done' && (
                    <div className="flex items-center gap-2">
                        {success > 0 && <span className="text-xs font-black text-emerald-500">✓ {success} imported</span>}
                        {failed > 0 && <span className="text-xs font-black text-red-400">✗ {failed} failed</span>}
                    </div>
                )}
                {status === 'skipped' && <span className="text-xs text-stone-400 font-semibold">No data</span>}
            </div>
            {errors?.length > 0 && (
                expanded ? <ChevronUp className="h-3.5 w-3.5 text-stone-400" /> : <ChevronDown className="h-3.5 w-3.5 text-stone-400" />
            )}
        </div>
        {expanded && errors?.length > 0 && (
            <div className="px-4 pb-3 space-y-1 bg-red-50">
                {errors.map((e, i) => (
                    <p key={i} className="text-xs text-red-500 font-medium">{e}</p>
                ))}
            </div>
        )}
    </div>
);

// ── Main component ───────────────────────────────────────────────────────────
export default function BulkImport() {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState('upload'); // upload | preview | importing | done
    const [parsed, setParsed] = useState({ Mentees: null, Parents: null, Cohorts: null });
    const [parseErrors, setParseErrors] = useState([]);
    const [importState, setImportState] = useState({
        Cohorts:  { status: 'idle', success: 0, failed: 0, errors: [] },
        Parents:  { status: 'idle', success: 0, failed: 0, errors: [] },
        Mentees:  { status: 'idle', success: 0, failed: 0, errors: [] },
    });
    const [expanded, setExpanded] = useState({});
    const [historical, setHistorical] = useState(false);
    const fileRef = useRef();

    const reset = () => {
        setStep('upload'); setParsed({ Mentees: null, Parents: null, Cohorts: null });
        setParseErrors([]); setImportState({
            Cohorts: { status: 'idle', success: 0, failed: 0, errors: [] },
            Parents: { status: 'idle', success: 0, failed: 0, errors: [] },
            Mentees: { status: 'idle', success: 0, failed: 0, errors: [] },
        }); setExpanded({});
        if (fileRef.current) fileRef.current.value = '';
    };

    // ── Download master template ─────────────────────────────────────────────
    const downloadTemplate = async () => {
        // Dynamically import SheetJS
        const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs');
        const wb = XLSX.utils.book_new();
        Object.entries(SHEET_DEFS).forEach(([name, def]) => {
            const rows = def.template.map(line => line.split(','));
            const ws = XLSX.utils.aoa_to_sheet(rows);
            // Style header row width
            ws['!cols'] = rows[0].map(() => ({ wch: 22 }));
            XLSX.utils.book_append_sheet(wb, ws, name);
        });
        XLSX.writeFile(wb, 'Dhahabu_Import_Template.xlsx');
    };

    // ── Parse uploaded file ──────────────────────────────────────────────────
    const handleFile = async (file) => {
        if (!file) return;
        const ext = file.name.split('.').pop().toLowerCase();
        if (!['xlsx', 'xls', 'csv'].includes(ext)) {
            setParseErrors(['Please upload an .xlsx or .xls file']); return;
        }
        try {
            const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs');
            const buf = await file.arrayBuffer();
            const wb = XLSX.read(buf, { type: 'array', cellDates: true });

            const newParsed = { Mentees: null, Parents: null, Cohorts: null };
            const allErrors = [];

            Object.keys(SHEET_DEFS).forEach(sheetName => {
                const ws = wb.Sheets[sheetName];
                if (!ws) { allErrors.push(`Sheet "${sheetName}" not found — skipping`); return; }
                const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
                const result = parseSheet(data, sheetName);
                newParsed[sheetName] = result;
                allErrors.push(...result.errors);
            });

            setParsed(newParsed);
            setParseErrors(allErrors);
            setStep('preview');
        } catch (e) {
            console.error(e);
            setParseErrors(['Failed to parse file. Make sure it is a valid .xlsx file.']);
        }
    };

    // ── Run import ───────────────────────────────────────────────────────────
    const runImport = async () => {
        setStep('importing');
        const cohortIdMap = {};
        const parentNameMap = {};
        const skipBilling = historical;

        // 1. Cohorts first
        if (parsed.Cohorts?.valid?.length) {
            setImportState(p => ({ ...p, Cohorts: { ...p.Cohorts, status: 'running' } }));
            const r = await importCohorts(parsed.Cohorts.valid);
            Object.assign(cohortIdMap, r.idMap);
            setImportState(p => ({ ...p, Cohorts: { status: 'done', success: r.success, failed: r.failed, errors: r.errors } }));
        } else {
            setImportState(p => ({ ...p, Cohorts: { status: 'skipped', success: 0, failed: 0, errors: [] } }));
        }

        // 2. Parents second
        if (parsed.Parents?.valid?.length) {
            setImportState(p => ({ ...p, Parents: { ...p.Parents, status: 'running' } }));
            const r = await importParents(parsed.Parents.valid);
            Object.assign(parentNameMap, r.nameMap);
            setImportState(p => ({ ...p, Parents: { status: 'done', success: r.success, failed: r.failed, errors: r.errors } }));
        } else {
            setImportState(p => ({ ...p, Parents: { status: 'skipped', success: 0, failed: 0, errors: [] } }));
        }

        // 3. Mentees last (needs cohort + parent IDs)
        if (parsed.Mentees?.valid?.length) {
            setImportState(p => ({ ...p, Mentees: { ...p.Mentees, status: 'running' } }));
            const r = await importMentees(parsed.Mentees.valid, cohortIdMap, parentNameMap, skipBilling);
            setImportState(p => ({ ...p, Mentees: { status: 'done', success: r.success, failed: r.failed, errors: r.errors } }));
        } else {
            setImportState(p => ({ ...p, Mentees: { status: 'skipped', success: 0, failed: 0, errors: [] } }));
        }

        setStep('done');
    };

    const totalValid = Object.values(parsed).reduce((s, p) => s + (p?.valid?.length || 0), 0);
    const totalSuccess = Object.values(importState).reduce((s, p) => s + p.success, 0);
    const totalFailed = Object.values(importState).reduce((s, p) => s + p.failed, 0);
    const hasErrors = parseErrors.filter(e => !e.includes('not found')).length > 0;

    return (
        <>
            {/* Floating button */}
            <button
                onClick={() => { setOpen(true); reset(); }}
                className="fixed bottom-8 right-8 flex items-center gap-2.5 px-5 py-3.5 rounded-2xl font-black text-sm text-black shadow-2xl z-40 transition-all hover:scale-105 active:scale-[0.97]"
                style={{ background: `linear-gradient(135deg, #B8975A, #D4B88C)`, boxShadow: '0 8px 32px rgba(184,151,90,0.4)' }}>
                <FileSpreadsheet className="h-4 w-4" />
                Bulk Import
            </button>

            {/* Dialog */}
            <Dialog open={open} onOpenChange={v => { if (!v) { setOpen(false); reset(); } }}>
                <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl border border-stone-100 shadow-2xl p-0">
                    <div className="h-1 w-full rounded-t-3xl" style={{ background: `linear-gradient(to right, ${GOLD}, #D4B88C)` }} />
                    <div className="p-8">
                        <DialogHeader className="mb-2">
                            <DialogTitle className="text-2xl font-black tracking-tighter text-stone-900">Bulk Import</DialogTitle>
                            <DialogDescription className="text-stone-400">
                                Upload one Excel file with separate sheets for Mentees, Parents, and Cohorts.
                                Import order is automatic — Cohorts → Parents → Mentees.
                            </DialogDescription>
                        </DialogHeader>

                        {/* Template download */}
                        <button onClick={downloadTemplate}
                            className="flex items-center gap-2 mt-4 mb-6 px-4 py-2 rounded-xl text-xs font-black border border-stone-200 hover:bg-stone-50 transition-colors w-full justify-center">
                            <FileDown className="h-3.5 w-3.5" style={{ color: GOLD }} />
                            Download Master Template (Dhahabu_Import_Template.xlsx)
                        </button>

                        {/* Sheet legend */}
                        <div className="grid grid-cols-3 gap-2 mb-6">
                            {Object.entries(SHEET_DEFS).map(([name, def]) => (
                                <div key={name} className="rounded-xl p-3 text-center border"
                                    style={{ borderColor: `${def.color}30`, backgroundColor: `${def.color}08` }}>
                                    <div className="w-2 h-2 rounded-full mx-auto mb-1.5" style={{ backgroundColor: def.color }} />
                                    <p className="text-xs font-black text-stone-700">{def.label}</p>
                                    <p className="text-[10px] text-stone-400 mt-0.5 font-medium">{def.note?.split('|')[0]}</p>
                                </div>
                            ))}
                        </div>

                        {/* ── Step: Upload ── */}
                        {step === 'upload' && (
                            <>
                                <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl p-10 cursor-pointer transition-colors hover:bg-amber-50/40"
                                    style={{ borderColor: 'rgba(184,151,90,0.3)' }}>
                                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'rgba(184,151,90,0.08)' }}>
                                        <Upload className="h-6 w-6" style={{ color: GOLD }} />
                                    </div>
                                    <div className="text-center">
                                        <p className="font-black text-stone-700 text-sm">Drop your Excel file here or click to browse</p>
                                        <p className="text-xs text-stone-400 mt-1">Supports .xlsx, .xls</p>
                                    </div>
                                    <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden"
                                        onChange={e => handleFile(e.target.files[0])} />
                                </label>

                                {parseErrors.length > 0 && (
                                    <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 p-4">
                                        {parseErrors.map((e, i) => <p key={i} className="text-xs text-red-500 font-medium">{e}</p>)}
                                    </div>
                                )}
                            </>
                        )}

                        {/* ── Step: Preview ── */}
                        {step === 'preview' && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    {Object.entries(SHEET_DEFS).map(([name, def]) => {
                                        const p = parsed[name];
                                        return (
                                            <div key={name} className="rounded-2xl border p-4"
                                                style={{ borderColor: `${def.color}25`, backgroundColor: `${def.color}06` }}>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: def.color }} />
                                                        <span className="text-sm font-black text-stone-800">{def.label}</span>
                                                    </div>
                                                    {p ? (
                                                        <div className="flex items-center gap-2">
                                                            {p.valid.length > 0 && <span className="text-xs font-black text-emerald-500">{p.valid.length} valid</span>}
                                                            {p.errors.length > 0 && <span className="text-xs font-black text-red-400">{p.errors.length} issues</span>}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-stone-400 font-semibold">Sheet not found — skipping</span>
                                                    )}
                                                </div>
                                                {p?.errors?.length > 0 && (
                                                    <div className="mt-3 space-y-1 max-h-24 overflow-y-auto">
                                                        {p.errors.map((e, i) => (
                                                            <p key={i} className="text-xs text-red-500 font-medium">{e}</p>
                                                        ))}
                                                    </div>
                                                )}
                                                {/* Preview first 3 rows */}
                                                {p?.valid?.length > 0 && (
                                                    <div className="mt-3 overflow-x-auto">
                                                        <table className="text-[10px] w-full">
                                                            <thead>
                                                                <tr className="text-stone-400 font-black uppercase tracking-wide">
                                                                    {Object.keys(p.valid[0]).filter(k => k !== '_rowNum').slice(0, 5).map(h => (
                                                                        <td key={h} className="pr-3 pb-1">{h}</td>
                                                                    ))}
                                                                    {Object.keys(p.valid[0]).length > 6 && <td className="text-stone-300">…</td>}
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {p.valid.slice(0, 3).map((row, i) => (
                                                                    <tr key={i} className="text-stone-600 font-medium">
                                                                        {Object.entries(row).filter(([k]) => k !== '_rowNum').slice(0, 5).map(([k, v]) => (
                                                                            <td key={k} className="pr-3 py-0.5 truncate max-w-[80px]">{v || '—'}</td>
                                                                        ))}
                                                                    </tr>
                                                                ))}
                                                                {p.valid.length > 3 && (
                                                                    <tr><td colSpan={5} className="text-stone-300 font-medium pt-1">+{p.valid.length - 3} more rows</td></tr>
                                                                )}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                <button onClick={() => { setParsed({ Mentees: null, Parents: null, Cohorts: null }); setParseErrors([]); setStep('upload'); }}
                                    className="text-xs font-black text-stone-400 hover:text-stone-600 flex items-center gap-1 mx-auto">
                                    <X className="h-3 w-3" /> Upload a different file
                                </button>
                            </div>
                        )}

                        {/* ── Step: Importing ── */}
                        {(step === 'importing' || step === 'done') && (
                            <div className="space-y-3">
                                <p className="text-xs font-black tracking-widest uppercase text-stone-400 mb-4">
                                    {step === 'importing' ? 'Import in progress...' : 'Import complete'}
                                </p>
                                {['Cohorts', 'Parents', 'Mentees'].map(name => {
                                    const def = SHEET_DEFS[name];
                                    const state = importState[name];
                                    const p = parsed[name];
                                    return (
                                        <SheetStatus
                                            key={name}
                                            label={def.label}
                                            color={def.color}
                                            status={state.status}
                                            success={state.success}
                                            failed={state.failed}
                                            total={p?.valid?.length || 0}
                                            errors={state.errors}
                                            expanded={expanded[name]}
                                            onToggle={() => setExpanded(prev => ({ ...prev, [name]: !prev[name] }))}
                                        />
                                    );
                                })}

                                {step === 'done' && (
                                    <div className="mt-4 rounded-2xl p-5 text-center"
                                        style={{ backgroundColor: totalFailed === 0 ? 'rgba(52,211,153,0.08)' : 'rgba(251,146,60,0.08)', border: `1px solid ${totalFailed === 0 ? 'rgba(52,211,153,0.2)' : 'rgba(251,146,60,0.2)'}` }}>
                                        {totalFailed === 0
                                            ? <CheckCircle className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                                            : <AlertTriangle className="h-8 w-8 text-amber-400 mx-auto mb-2" />}
                                        <p className="font-black text-stone-900 text-sm">
                                            {totalSuccess} record{totalSuccess !== 1 ? 's' : ''} imported successfully
                                            {totalFailed > 0 && `, ${totalFailed} failed`}
                                        </p>
                                        <p className="text-xs text-stone-400 mt-1">Refresh the relevant pages to see the new data</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Footer */}
                        <DialogFooter className="mt-8 gap-3">
                            <button onClick={() => { setOpen(false); reset(); }}
                                className="px-5 py-2.5 rounded-2xl font-black text-sm text-stone-600 border border-stone-200 hover:bg-stone-50 transition-all">
                                {step === 'done' ? 'Close' : 'Cancel'}
                            </button>
                            {step === 'preview' && totalValid > 0 && (
                                <button onClick={runImport}
                                    className="px-6 py-2.5 rounded-2xl font-black text-sm text-black shadow-lg transition-all hover:opacity-90"
                                    style={{ background: `linear-gradient(135deg, ${GOLD}, #D4B88C)` }}>
                                    Import {totalValid} Record{totalValid !== 1 ? 's' : ''}
                                </button>
                            )}
                            {step === 'done' && (
                                <button onClick={() => { reset(); }}
                                    className="px-6 py-2.5 rounded-2xl font-black text-sm text-black shadow-lg transition-all hover:opacity-90"
                                    style={{ background: `linear-gradient(135deg, ${GOLD}, #D4B88C)` }}>
                                    Import Another File
                                </button>
                            )}
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}