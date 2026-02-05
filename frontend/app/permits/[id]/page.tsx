'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { permitsApi, documentsApi, signaturesApi, usersApi } from '@/lib/api';
import { Header } from '@/components/Header';
import { socket } from '@/lib/socket';
import SignaturePad from '@/components/SignaturePad';
import {
    LayoutDashboard,
    FileText,
    Users,
    MapPin,
    BarChart3,
    ArrowLeft,
    Calendar,
    Clock,
    CheckCircle,
    AlertTriangle,
    Shield,
    Upload,
    ExternalLink,
    Activity,
    History,
    Check,
    XCircle,
    FileSpreadsheet,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast, Toaster } from 'sonner';
import { format } from 'date-fns';
import { RiskMatrix } from '@/components/RiskMatrix';
import { QRCodeButton } from '@/components/QRCodeSystem';
import { HandoverModal } from '@/components/HandoverModal';
import { ChecklistModal } from '@/components/ChecklistModal';
import { PermitWorkflowStepper } from '@/components/PermitWorkflowStepper';
import { GasTestModal } from '@/components/GasTestModal';
import { CertificateModal } from '@/components/CertificateModal';
import { Award } from 'lucide-react';
import { AuthGuard } from '@/components/auth/AuthGuard';

export default function PermitDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { t, language } = useLanguage();
    const [permit, setPermit] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showSignaturePad, setShowSignaturePad] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [handovers, setHandovers] = useState<any[]>([]);
    const [checklists, setChecklists] = useState<any[]>([]);
    const [showHandoverModal, setShowHandoverModal] = useState(false);

    const [showChecklistModal, setShowChecklistModal] = useState(false);
    const [showGasTestModal, setShowGasTestModal] = useState(false);
    const [gasTests, setGasTests] = useState<any[]>([]);

    const [showCertificateModal, setShowCertificateModal] = useState(false);
    const [certificates, setCertificates] = useState<any[]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [exportingExcel, setExportingExcel] = useState(false);

    useEffect(() => {
        const user = usersApi.getCurrentUser();
        setCurrentUser(user);
        if (!id) return;

        fetchPermit();
        fetchHandovers();
        fetchChecklists();
        fetchChecklists();
        fetchGasTests();
        fetchCertificates();

        socket.emit('join_permit_updates', id);

        socket.on('update', (data) => {
            if (data.id === id) setPermit(data);
        });

        socket.on('document_uploaded', (data) => {
            if (data.permitId === id) {
                setPermit((prev: any) => ({
                    ...prev,
                    documents: [...prev.documents, data.document]
                }));
                toast.success(language === 'tr' ? 'Belge yüklendi' : 'Document uploaded');
            }
        });

        socket.on('signature_added', (data) => {
            if (data.permitId === id) {
                setPermit((prev: any) => ({
                    ...prev,
                    signatures: [...prev.signatures, data.signature]
                }));
                toast.success(language === 'tr' ? 'İmza kaydedildi' : 'Signature recorded');
            }
        });

        socket.on('checklist_added', (data) => {
            if (data.permitId === id) {
                setChecklists(prev => [data.checklist, ...prev]);
                toast.success(language === 'tr' ? 'Yeni kontrol listesi eklendi' : 'New checklist added');
            }
        });

        socket.on('gas_test_added', (data) => {
            if (data.record.permitId === id) {
                setGasTests(prev => [data.record, ...prev]);
                toast.success(language === 'tr' ? 'Yeni gaz ölçümü eklendi' : 'New gas test added');
            }
        });

        return () => {
            socket.off('update');
            socket.off('document_uploaded');
            socket.off('signature_added');
            socket.off('checklist_added');
            socket.off('gas_test_added');
        };
    }, [id, language]);

    const fetchPermit = async () => {
        try {
            setLoading(true);
            const res = await permitsApi.getById(id);
            setPermit(res.data);
        } catch (err: any) {
            setError(err.message || 'Failed to load permit');
        } finally {
            setLoading(false);
        }
    };

    const fetchHandovers = async () => {
        try {
            const res = await permitsApi.getHandovers(id);
            setHandovers(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchChecklists = async () => {
        try {
            const res = await permitsApi.getChecklists(id);
            setChecklists(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchGasTests = async () => {
        try {
            const res = await permitsApi.getGasTests(id);
            if (res.success) setGasTests(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchCertificates = async () => {
        try {
            const res = await permitsApi.getCertificates(id);
            if (res.success) setCertificates(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            setIsUploading(true);
            await documentsApi.upload(id, file, 'other');
        } catch (err: any) {
            toast.error('Upload failed: ' + err.message);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleSaveSignature = async (dataUrl: string) => {
        try {
            await signaturesApi.submit({
                permitId: id,
                role: 'approver',
                signerName: 'Admin User',
                signatureUrl: dataUrl
            });
            setShowSignaturePad(false);
        } catch (err: any) {
            toast.error('Signature save failed: ' + err.message);
        }
    };

    const handleApprove = async () => {
        if (!confirm('Approve this permit?')) return;
        try {
            await permitsApi.approve(id);
            toast.success(language === 'tr' ? 'İzin onaylandı' : 'Permit approved');
            fetchPermit();
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    const handleReject = async () => {
        if (!rejectionReason.trim()) {
            toast.error(language === 'tr' ? 'Lütfen bir sebep belirtin' : 'Please provide a reason');
            return;
        }
        try {
            await permitsApi.reject(id, rejectionReason);
            toast.success(language === 'tr' ? 'İzin reddedildi' : 'Permit rejected');
            setShowRejectModal(false);
            fetchPermit();
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    const updateStatus = async (newStatus: string) => {
        try {
            await permitsApi.update(id, { status: newStatus });
            toast.success(`Status updated to ${newStatus}`);
            fetchPermit();
        } catch (err: any) {
            toast.error('Update failed: ' + (err.error || err.message));
        }
    };

    const toggleWorkflowStep = async (field: string, value: boolean) => {
        try {
            await permitsApi.update(id, { [field]: value });
            setPermit((prev: any) => ({ ...prev, [field]: value }));
        } catch (err: any) {
            toast.error('Failed to update workflow step');
        }
    };

    const handleExcelExport = async () => {
        try {
            setExportingExcel(true);
            const token = localStorage.getItem('token');
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

            const response = await fetch(`${API_URL}/permits/${id}/export/excel`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Excel export failed');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `permit-${permit?.permitNumber || id}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            toast.success(language === 'tr' ? 'Excel başarıyla indirildi' : 'Excel downloaded successfully');
        } catch (error: any) {
            console.error('Excel export error:', error);
            toast.error(language === 'tr' ? 'Excel indirilemedi: ' + error.message : 'Failed to download Excel: ' + error.message);
        } finally {
            setExportingExcel(false);
        }
    };


    const requestClosure = async () => {
        try {
            await permitsApi.requestClosure(id, 'Worker ID'); // In real app use auth user
            toast.success(language === 'tr' ? 'Kapanış talep edildi' : 'Closure requested');
            fetchPermit();
        } catch (err: any) {
            toast.error('Failed to request closure');
        }
    };

    const statusColors: Record<string, string> = {
        'pending': 'bg-amber-50 text-amber-700 border-amber-100',
        'approved': 'bg-green-50 text-green-700 border-green-100',
        'active': 'bg-blue-50 text-blue-700 border-blue-100',
        'completed': 'bg-slate-50 text-slate-700 border-slate-100',
        'expired': 'bg-red-50 text-red-700 border-red-100',
        'rejected': 'bg-red-50 text-red-700 border-red-100',
        'draft': 'bg-slate-50 text-slate-500 border-slate-100',
    };

    const riskColors: Record<string, string> = {
        'high': 'bg-red-50 text-red-700 border-red-100',
        'medium': 'bg-amber-50 text-amber-700 border-amber-100',
        'low': 'bg-green-50 text-green-700 border-green-100',
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">{t.common.loading}...</p>
            </div>
        </div>
    );

    return (
        <AuthGuard>
            <div className="min-h-screen bg-slate-50 flex font-sans">
                <Toaster position="top-right" richColors />

                {showHandoverModal && (
                    <HandoverModal
                        isOpen={showHandoverModal}
                        onClose={() => setShowHandoverModal(false)}
                        permitId={id}
                        onSuccess={fetchHandovers}
                    />
                )}

                {showChecklistModal && (
                    <ChecklistModal
                        isOpen={showChecklistModal}
                        onClose={() => setShowChecklistModal(false)}
                        permitId={id}
                        onSuccess={fetchChecklists}
                    />
                )}

                {showGasTestModal && (
                    <GasTestModal
                        isOpen={showGasTestModal}
                        onClose={() => setShowGasTestModal(false)}
                        permitId={id}
                        onSuccess={fetchGasTests}
                    />
                )}

                {showSignaturePad && (
                    <SignaturePad
                        title={language === 'tr' ? 'Dijital İmza' : 'Digital Signature'}
                        onSave={handleSaveSignature}
                        onCancel={() => setShowSignaturePad(false)}
                    />
                )}

                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileUpload}
                />

                {/* Sidebar (Desktop) */}
                <aside className="hidden lg:flex w-72 bg-white border-r border-slate-200 flex-col sticky top-0 h-screen">
                    <div className="p-8 pb-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">PTW<span className="text-blue-600">Track</span></h1>
                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Safety Operations</p>
                        </div>
                    </div>

                    <nav className="flex-1 px-4 py-8 space-y-2">
                        <Button onClick={() => window.location.href = '/dashboard'} variant="ghost" className="w-full justify-start gap-3 h-12 font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-900">
                            <LayoutDashboard className="w-5 h-5" />
                            {t.dashboard.title}
                        </Button>
                        <Button onClick={() => window.location.href = '/permits'} variant="ghost" className="w-full justify-start gap-3 h-12 font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-700">
                            <FileText className="w-5 h-5" />
                            {t.permits.title}
                        </Button>
                        {currentUser?.role === 'admin' && (
                            <>
                                <Button onClick={() => window.location.href = '/contractors'} variant="ghost" className="w-full justify-start gap-3 h-12 font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-900">
                                    <Users className="w-5 h-5" />
                                    {t.contractors.title}
                                </Button>
                                <Button onClick={() => window.location.href = '/locations'} variant="ghost" className="w-full justify-start gap-3 h-12 font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-900">
                                    <MapPin className="w-5 h-5" />
                                    {t.locations.title}
                                </Button>
                            </>
                        )}
                        {(currentUser?.role === 'admin' || currentUser?.role === 'approver') && (
                            <Button onClick={() => window.location.href = '/analytics'} variant="ghost" className="w-full justify-start gap-3 h-12 font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-900">
                                <BarChart3 className="w-5 h-5" />
                                {language === 'tr' ? 'Analitik' : 'Analytics'}
                            </Button>
                        )}
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 min-w-0 pb-20">
                    {/* Header */}
                    <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-30 shadow-sm shadow-slate-100/50">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full hover:bg-slate-50 lg:hidden"
                                onClick={() => window.location.href = '/permits'}
                            >
                                <ArrowLeft className="w-5 h-5 text-slate-500" />
                            </Button>
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h2 className="text-lg font-black text-slate-900 tracking-tight leading-none">
                                        {permit.permitNumber}
                                    </h2>
                                    <Badge className={`${statusColors[permit.status.toLowerCase()] || ''} border px-3 py-0.5 font-black text-[9px] uppercase tracking-wider rounded-lg`}>
                                        {(t.statuses as any)[permit.status.toLowerCase()] || permit.status}
                                    </Badge>
                                </div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                                    {(t.permitTypes as any)[permit.ptwType] || permit.ptwType} · {permit.locationName}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <Button
                                variant="outline"
                                className="border-slate-200 text-slate-600 font-bold px-5 rounded-xl text-xs h-10 gap-2"
                                onClick={() => window.open(`/permits/${id}/print`, '_blank')}
                            >
                                <FileText className="w-4 h-4" />
                                {language === 'tr' ? 'Formu Yazdır' : 'Print Form'}
                            </Button>

                            <Button
                                variant="outline"
                                className="border-green-200 text-green-700 hover:bg-green-50 font-bold px-5 rounded-xl text-xs h-10 gap-2"
                                onClick={handleExcelExport}
                                disabled={exportingExcel}
                            >
                                {exportingExcel ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        {language === 'tr' ? 'Hazırlanıyor...' : 'Generating...'}
                                    </>
                                ) : (
                                    <>
                                        <FileSpreadsheet className="w-4 h-4" />
                                        {language === 'tr' ? 'Excel İndir' : 'Download Excel'}
                                    </>
                                )}
                            </Button>

                            <Header />
                            <div className="w-px h-6 bg-slate-200 mx-2"></div>

                            {permit.status === 'engineering_review' && currentUser?.role === 'admin' && (
                                <Button
                                    className="bg-amber-600 hover:bg-amber-700 text-white font-black px-6 rounded-xl shadow-lg shadow-amber-100 h-10 text-xs uppercase tracking-widest"
                                    onClick={() => {
                                        if (confirm('Approve as Engineering?')) {
                                            permitsApi.approveEngineering(permit.id, currentUser.id)
                                                .then(() => {
                                                    toast.success('Engineering Approved');
                                                    fetchPermit();
                                                })
                                                .catch(err => toast.error(err.message));
                                        }
                                    }}
                                >
                                    <Shield className="w-4 h-4 mr-2" />
                                    {language === 'tr' ? 'Mühendislik Onayı' : 'Engineering Approve'}
                                </Button>
                            )}

                            {permit.status === 'pending' && (currentUser?.role === 'admin' || currentUser?.role === 'approver') && (
                                <div className="flex gap-2">
                                    <Button
                                        className="bg-red-600 hover:bg-red-700 text-white font-black px-6 rounded-xl shadow-lg shadow-red-100 h-10 text-xs uppercase tracking-widest"
                                        onClick={() => setShowRejectModal(true)}
                                    >
                                        <XCircle className="w-4 h-4 mr-2" />
                                        {language === 'tr' ? 'Reddet' : 'Reject'}
                                    </Button>
                                    <Button
                                        className="bg-green-600 hover:bg-green-700 text-white font-black px-6 rounded-xl shadow-lg shadow-green-100 h-10 text-xs uppercase tracking-widest"
                                        onClick={handleApprove}
                                    >
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        {language === 'tr' ? 'İzni Onayla' : 'Approve Permit'}
                                    </Button>
                                </div>
                            )}

                            {(permit.status === 'active' || permit.status === 'approved') && (
                                <div className="flex gap-2">
                                    <QRCodeButton permit={permit} />
                                    {(currentUser?.role === 'admin' || currentUser?.role === 'approver') && (
                                        <Button
                                            className="bg-blue-600 hover:bg-blue-700 text-white font-black px-6 rounded-xl shadow-lg shadow-blue-100 h-10 text-xs uppercase tracking-widest"
                                            onClick={() => setShowSignaturePad(true)}
                                        >
                                            <Shield className="w-4 h-4 mr-2" />
                                            {language === 'tr' ? 'İmzala' : 'Sign'}
                                        </Button>
                                    )}

                                    {/* Request Closure Button (Admin/Approver Only) */}
                                    {!permit.closureRequested && (currentUser?.role === 'admin' || currentUser?.role === 'approver') && (
                                        <Button
                                            className="bg-slate-900 hover:bg-slate-800 text-white font-black px-6 rounded-xl shadow-lg shadow-slate-200 h-10 text-xs uppercase tracking-widest"
                                            onClick={() => {
                                                if (confirm('Request Permit Closure?')) requestClosure();
                                            }}
                                        >
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            {language === 'tr' ? 'Kapanış Talep Et' : 'Request Closure'}
                                        </Button>
                                    )}

                                    {/* Final Closure Button (Admin Only) */}
                                    {permit.closureRequested && currentUser?.role === 'admin' && (
                                        <Button
                                            className="bg-red-600 hover:bg-red-700 text-white font-black px-6 rounded-xl shadow-lg shadow-red-100 h-10 text-xs uppercase tracking-widest animate-pulse"
                                            onClick={() => updateStatus('completed')}
                                        >
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            {language === 'tr' ? 'Kapanışı Onayla' : 'Approve Closure'}
                                        </Button>
                                    )}
                                </div>
                            )}
                            {permit.status !== 'active' && permit.status !== 'approved' && permit.status !== 'pending' && permit.status !== 'engineering_review' && (
                                <QRCodeButton permit={permit} />
                            )}
                        </div>
                    </header>

                    <div className="p-8 max-w-7xl mx-auto space-y-8">
                        {/* Workflow Stepper */}
                        <PermitWorkflowStepper status={permit.status} />

                        {/* Tabs */}
                        <div className="flex gap-4 border-b border-slate-200 pb-4">
                            <button
                                onClick={() => { document.getElementById('tab-details')!.style.display = 'grid'; document.getElementById('tab-handovers')!.style.display = 'none'; document.getElementById('tab-checklists')!.style.display = 'none'; document.getElementById('tab-gastests')!.style.display = 'none'; }}
                                className="font-black text-slate-500 hover:text-blue-600 uppercase tracking-widest text-[11px] pb-2 border-b-2 border-transparent hover:border-blue-600 transition-all font-sans"
                            >
                                {t.permits.title}
                            </button>
                            <button
                                onClick={() => { document.getElementById('tab-details')!.style.display = 'none'; document.getElementById('tab-handovers')!.style.display = 'block'; document.getElementById('tab-checklists')!.style.display = 'none'; document.getElementById('tab-gastests')!.style.display = 'none'; }}
                                className="font-black text-slate-500 hover:text-blue-600 uppercase tracking-widest text-[11px] pb-2 border-b-2 border-transparent hover:border-blue-600 transition-all font-sans"
                            >
                                {language === 'tr' ? 'Devir Teslim' : 'Handovers'}
                            </button>
                            <button
                                onClick={() => { document.getElementById('tab-details')!.style.display = 'none'; document.getElementById('tab-handovers')!.style.display = 'none'; document.getElementById('tab-checklists')!.style.display = 'block'; document.getElementById('tab-gastests')!.style.display = 'none'; }}
                                className="font-black text-slate-500 hover:text-blue-600 uppercase tracking-widest text-[11px] pb-2 border-b-2 border-transparent hover:border-blue-600 transition-all font-sans"
                            >
                                {language === 'tr' ? 'Günlük Kontroller' : 'Daily Checks'}
                            </button>
                            <button
                                onClick={() => { document.getElementById('tab-details')!.style.display = 'none'; document.getElementById('tab-handovers')!.style.display = 'none'; document.getElementById('tab-checklists')!.style.display = 'none'; document.getElementById('tab-gastests')!.style.display = 'block'; }}
                                className="font-black text-slate-500 hover:text-blue-600 uppercase tracking-widest text-[11px] pb-2 border-b-2 border-transparent hover:border-blue-600 transition-all font-sans"
                            >
                                {language === 'tr' ? 'Gaz Ölçümleri' : 'Gas Tests'}
                            </button>
                            <button
                                onClick={() => { document.getElementById('tab-details')!.style.display = 'none'; document.getElementById('tab-handovers')!.style.display = 'none'; document.getElementById('tab-checklists')!.style.display = 'none'; document.getElementById('tab-gastests')!.style.display = 'none'; document.getElementById('tab-certificates')!.style.display = 'block'; }}
                                className="font-black text-slate-500 hover:text-blue-600 uppercase tracking-widest text-[11px] pb-2 border-b-2 border-transparent hover:border-blue-600 transition-all font-sans"
                            >
                                {language === 'tr' ? 'Sertifikalar' : 'Certificates'}
                            </button>
                        </div>

                        <div id="tab-details" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Left Column: Details & Content */}
                            <div className="lg:col-span-2 space-y-8">

                                {/* Risk Matrix Section */}
                                <RiskMatrix permit={permit} />

                                {/* Summary Card */}
                                <Card className="border-0 shadow-xl shadow-slate-200/50 bg-white rounded-3xl overflow-hidden">
                                    <CardHeader className="border-b border-slate-50 bg-slate-50/50 p-6">
                                        <CardTitle className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-blue-600" />
                                            {t.newPermit.step1}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-8 space-y-8">
                                        <div>
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block">
                                                {t.newPermit.activityDescription}
                                            </Label>
                                            <p className="text-base font-bold text-slate-700 leading-relaxed bg-slate-50/50 p-6 rounded-2xl border border-slate-100/50">
                                                {permit.description}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                            <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50/50 border border-slate-100/50">
                                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 border border-slate-100 shadow-sm">
                                                    <MapPin className="w-5 h-5 text-slate-400" />
                                                </div>
                                                <div>
                                                    <Label className="text-[9px] font-black uppercase tracking-tighter text-slate-400 mb-1 block">
                                                        {t.newPermit.workArea}
                                                    </Label>
                                                    <p className="font-black text-slate-900 tracking-tight">{permit.locationName}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50/50 border border-slate-100/50">
                                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 border border-slate-100 shadow-sm">
                                                    <Users className="w-5 h-5 text-slate-400" />
                                                </div>
                                                <div>
                                                    <Label className="text-[9px] font-black uppercase tracking-tighter text-slate-400 mb-1 block">
                                                        {t.common.contractor}
                                                    </Label>
                                                    <p className="font-black text-slate-900 tracking-tight">{permit.contractorName}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Workflow Checklist (Review Stage) */}
                                {(permit.status === 'draft' || permit.status === 'pending') && (
                                    <Card className="border-0 shadow-xl shadow-slate-200/50 bg-white rounded-3xl overflow-hidden">
                                        <CardHeader className="p-6 border-b border-slate-50 bg-slate-50/50">
                                            <CardTitle className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                                <CheckCircle className="w-4 h-4 text-blue-600" />
                                                {language === 'tr' ? 'İzin Hazırlık Kontrol Listesi' : 'Permit Preparation Checklist'}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6 space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {[
                                                    { key: 'hazardsIdentified', label: language === 'tr' ? 'Tehlikeler Belirlendi' : 'Hazards Identified' },
                                                    { key: 'controlsRequired', label: language === 'tr' ? 'Önlemler Alındı' : 'Controls Implemented' },
                                                    { key: 'ppeIdentified', label: language === 'tr' ? 'KKD Belirlendi' : 'PPE Identified' },
                                                    { key: 'equipmentIdentified', label: language === 'tr' ? 'Ekipmanlar Tanımlandı' : 'Equipment Defined' },
                                                ].map((item) => (
                                                    <div key={item.key} className="flex items-center gap-3 p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => toggleWorkflowStep(item.key, !permit[item.key])}>
                                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${permit[item.key] ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300'}`}>
                                                            {permit[item.key] && <Check className="w-4 h-4" />}
                                                        </div>
                                                        <span className="font-bold text-sm text-slate-700">{item.label}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Submit for Review Button */}
                                            {permit.status === 'draft' && (
                                                <div className="pt-4 border-t border-slate-50 mt-4">
                                                    <Button
                                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black h-12 rounded-xl text-xs uppercase tracking-widest disabled:bg-slate-200 disabled:text-slate-400"
                                                        disabled={!permit.hazardsIdentified || !permit.controlsRequired || !permit.ppeIdentified || !permit.equipmentIdentified || (permit.createdById !== currentUser?.id && currentUser?.role !== 'admin')}
                                                        onClick={() => updateStatus('pending')}
                                                    >
                                                        {language === 'tr' ? 'İncelemeye Gönder' : 'Submit for Review'}
                                                    </Button>
                                                    {(!permit.hazardsIdentified || !permit.controlsRequired || !permit.ppeIdentified || !permit.equipmentIdentified) && (
                                                        <p className="text-center text-[10px] text-red-400 font-bold mt-2 uppercase tracking-wide">
                                                            {language === 'tr' ? 'Tüm maddeler tamamlanmalı' : 'All items must be completed'}
                                                        </p>
                                                    )}
                                                    {permit.status === 'draft' && permit.createdById !== currentUser?.id && currentUser?.role !== 'admin' && (
                                                        <p className="text-center text-[10px] text-amber-500 font-bold mt-2 uppercase tracking-wide">
                                                            {language === 'tr' ? 'Sadece hazırlayan incelemeye gönderebilir' : 'Only creator can submit for review'}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Concurrent Work Approval */}
                                {(permit.status === 'pending' || permit.status === 'approved' || permit.status === 'active') && (
                                    <Card className="border-0 shadow-xl shadow-slate-200/50 bg-white rounded-3xl overflow-hidden">
                                        <CardHeader className="p-6 border-b border-slate-50 bg-slate-50/50">
                                            <CardTitle className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                                <Users className="w-4 h-4 text-purple-600" />
                                                {language === 'tr' ? 'Eş Zamanlı İş Onayı' : 'Concurrent Work Approval'}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            {permit.affectedDeptApproved ? (
                                                <div className="p-4 bg-green-50 border border-green-100 rounded-xl flex items-center gap-3 text-green-700">
                                                    <CheckCircle className="w-5 h-5" />
                                                    <span className="font-bold text-sm">{language === 'tr' ? 'Onaylandı: ' : 'Approved by: '} {permit.affectedDeptApprovedBy || 'Dept Manager'}</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl">
                                                    <span className="font-bold text-sm text-slate-500">{language === 'tr' ? 'Departman Onayı Bekleniyor' : 'Dept Approval Required'}</span>
                                                    {currentUser?.role === 'admin' && (
                                                        <Button
                                                            size="sm"
                                                            className="bg-purple-600 hover:bg-purple-700 text-white font-bold"
                                                            onClick={() => toggleWorkflowStep('affectedDeptApproved', true)}
                                                        >
                                                            {language === 'tr' ? 'Onayla' : 'Approve'}
                                                        </Button>
                                                    )}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Documents & Signatures Section */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Documents Card */}
                                    <Card className="border-0 shadow-xl shadow-slate-200/50 bg-white rounded-3xl overflow-hidden">
                                        <CardHeader className="p-6 border-b border-slate-50 flex flex-row items-center justify-between py-4 bg-slate-50/50">
                                            <CardTitle className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                                <Upload className="w-4 h-4 text-green-600" />
                                                {language === 'tr' ? 'Belgeler' : 'Documents'}
                                            </CardTitle>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-blue-600 hover:bg-blue-50 font-black text-[10px] uppercase tracking-widest h-8 px-3 rounded-lg"
                                                disabled={isUploading}
                                                onClick={() => fileInputRef.current?.click()}
                                            >
                                                {isUploading ? '...' : `+ ${language === 'tr' ? 'Ekle' : 'Add'}`}
                                            </Button>
                                        </CardHeader>
                                        <CardContent className="p-6 space-y-3">
                                            {permit.documents?.map((doc: any) => (
                                                <div key={doc.id} className="group p-3 bg-white hover:bg-slate-50 transition-all rounded-2xl border border-slate-100 flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100">
                                                            <FileText className="w-4 h-4 text-red-500" />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-black text-slate-900 truncate max-w-[120px]">{doc.name}</p>
                                                            <p className="text-[9px] font-bold text-slate-400 uppercase">{doc.type}</p>
                                                        </div>
                                                    </div>
                                                    <a href={doc.url} target="_blank" rel="noopener" className="p-2 text-slate-300 hover:text-blue-600 transition-colors">
                                                        <ExternalLink className="w-4 h-4" />
                                                    </a>
                                                </div>
                                            ))}
                                            {(!permit.documents || permit.documents.length === 0) && (
                                                <p className="text-center py-4 text-xs text-slate-400 italic">Belge bulunamadı...</p>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {/* Signatures Card */}
                                    <Card className="border-0 shadow-xl shadow-slate-200/50 bg-white rounded-3xl overflow-hidden">
                                        <CardHeader className="p-6 border-b border-slate-50 py-4 bg-slate-50/50">
                                            <CardTitle className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                                <Shield className="w-4 h-4 text-blue-600" />
                                                {language === 'tr' ? 'İmzalar' : 'Signatures'}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <div className="grid grid-cols-1 gap-4">
                                                {permit.signatures?.map((sig: any) => (
                                                    <div key={sig.id} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50">
                                                        <div className="h-14 flex items-center justify-center mb-3 bg-white rounded-xl border border-slate-100 overflow-hidden shadow-inner">
                                                            <img src={sig.signatureUrl} alt="sig" className="max-h-full opacity-80" />
                                                        </div>
                                                        <div className="text-center">
                                                            <p className="text-[10px] font-black text-slate-900 leading-none mb-1">{sig.signerName}</p>
                                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{sig.role}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                                {(!permit.signatures || permit.signatures.length === 0) && (
                                                    <p className="text-center py-4 text-xs text-slate-400 italic">İmza bulunamadı...</p>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>

                            {/* Right Column: Validity & Timeline */}
                            <div className="space-y-8">
                                {/* Validity Card */}
                                <Card className="border-0 shadow-xl shadow-slate-200/50 bg-white rounded-3xl overflow-hidden">
                                    <CardHeader className="p-6 border-b border-white/10 bg-slate-900 text-white">
                                        <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                            <Clock className="w-4 h-4" />
                                            {language === 'tr' ? 'Geçerlilik' : 'Validity'}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-8 space-y-6">
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                                                    <Calendar className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                                        {t.newPermit.validFrom}
                                                    </p>
                                                    <p className="text-sm font-black text-slate-900 tracking-tight">
                                                        {format(new Date(permit.validFrom), 'dd MMM yyyy, HH:mm')}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-400">
                                                    <Calendar className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-[9px] font-black text-red-300 uppercase tracking-widest mb-1">
                                                        {t.newPermit.validUntil}
                                                    </p>
                                                    <p className="text-sm font-black text-slate-900 tracking-tight">
                                                        {format(new Date(permit.validUntil), 'dd MMM yyyy, HH:mm')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <Separator className="bg-slate-100/50" />
                                        <div className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50">
                                            <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 shadow-sm">
                                                <Activity className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                                    {language === 'tr' ? 'Oluşturan' : 'Created By'}
                                                </p>
                                                <p className="text-sm font-black text-slate-900 tracking-tight">{permit.createdBy?.fullName || 'Admin User'}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Audit Trail Card */}
                                <Card className="border-0 shadow-xl shadow-slate-200/50 bg-white rounded-3xl h-auto max-h-[500px] flex flex-col overflow-hidden">
                                    <CardHeader className="p-6 border-b border-slate-50 py-4 flex flex-row items-center justify-between bg-slate-50/50">
                                        <CardTitle className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                            <History className="w-4 h-4" />
                                            {language === 'tr' ? 'İşlem Geçmişi' : 'Audit Trail'}
                                        </CardTitle>
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    </CardHeader>
                                    <CardContent className="p-0 overflow-y-auto">
                                        <div className="divide-y divide-slate-100/50">
                                            {permit.auditLogs?.map((log: any) => (
                                                <div key={log.id} className="p-4 hover:bg-slate-50/50 transition-colors flex gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                                                        <CheckCircle className="w-4 h-4 text-slate-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] font-black text-slate-900 mb-0.5">{log.action}</p>
                                                        <p className="text-[10px] font-bold text-slate-500 mb-1">{log.details?.status ? `Status: ${log.details.status}` : ''}</p>
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                                                            {format(new Date(log.createdAt), 'HH:mm · dd MMM yyyy')}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                            {(!permit.auditLogs || permit.auditLogs.length === 0) && (
                                                <p className="text-center py-8 text-xs text-slate-400 italic">İşlem geçmişi bulunamadı...</p>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        <div id="tab-handovers" className="hidden">
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-bold text-lg">{language === 'tr' ? 'Vardiya Devir Teslimleri' : 'Shift Handovers'}</h3>
                                    <Button onClick={() => setShowHandoverModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-100">
                                        {language === 'tr' ? '+ Yeni Kayıt' : '+ New Handover'}
                                    </Button>
                                </div>

                                <div className="grid gap-4">
                                    {handovers.map((item) => (
                                        <div key={item.id} className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900">{format(new Date(item.createdAt), 'dd MMM yyyy, HH:mm')}</p>
                                                    <p className="text-xs text-slate-500 mt-1"><span className="font-bold">{language === 'tr' ? 'Notlar' : 'Notes'}:</span> {item.notes}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-8 border-t border-slate-50 pt-4">
                                                <div>
                                                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">{language === 'tr' ? 'Devreden' : 'Outgoing'}</p>
                                                    <p className="font-bold text-sm text-slate-900">{item.outgoingIssuerName}</p>
                                                    {item.outgoingSignatureUrl && <div className="h-8 mt-1"><img src={item.outgoingSignatureUrl} className="h-full opacity-80" alt="signature" /></div>}
                                                </div>
                                                <div>
                                                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">{language === 'tr' ? 'Devralan' : 'Incoming'}</p>
                                                    <p className="font-bold text-sm text-slate-900">{item.incomingIssuerName}</p>
                                                    {item.incomingSignatureUrl && <div className="h-8 mt-1"><img src={item.incomingSignatureUrl} className="h-full opacity-80" alt="signature" /></div>}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {handovers.length === 0 && (
                                        <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                                            <p className="text-slate-400 text-sm">{language === 'tr' ? 'Henüz devir teslim kaydı yok' : 'No handovers recorded yet'}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div id="tab-checklists" className="hidden">
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-bold text-lg">{language === 'tr' ? 'Günlük Güvenlik Kontrolleri' : 'Daily Safety Checks'}</h3>
                                    <Button onClick={() => setShowChecklistModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-100">
                                        {language === 'tr' ? '+ Yeni Kontrol' : '+ New Check'}
                                    </Button>
                                </div>

                                <div className="grid gap-4">
                                    {checklists.map((item) => (
                                        <div key={item.id} className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm hover:shadow-md transition-all">
                                            <div className="flex items-center gap-5">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border-2 ${item.isSafe ? 'border-green-100 bg-green-50 text-green-600' : 'border-red-100 bg-red-50 text-red-600'}`}>
                                                    {item.isSafe ? <CheckCircle className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <p className="font-black text-slate-900">{item.checkedByName}</p>
                                                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider bg-slate-100 px-2 py-0.5 rounded-lg">{format(new Date(item.checkDate), 'dd MMM, HH:mm')}</span>
                                                    </div>
                                                    <p className="text-xs font-medium text-slate-500">{item.comments || (language === 'tr' ? 'Yorum yok' : 'No comments')}</p>
                                                </div>
                                            </div>
                                            <Badge variant="outline" className={`px-3 py-1 border-2 font-black text-[10px] tracking-widest uppercase ${item.isSafe ? 'border-green-100 text-green-600 bg-green-50' : 'border-red-100 text-red-600 bg-red-50'}`}>
                                                {item.isSafe ? 'SAFE' : 'UNSAFE'}
                                            </Badge>
                                        </div>
                                    ))}
                                    {checklists.length === 0 && (
                                        <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                                            <p className="text-slate-400 text-sm">{language === 'tr' ? 'Henüz kontrol kaydı yok' : 'No safety checks recorded yet'}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>



                    <div id="tab-certificates" className="hidden p-8 max-w-7xl mx-auto">
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-lg">{t.certificates.title}</h3>
                                <Button onClick={() => setShowCertificateModal(true)} className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-100">
                                    {t.certificates.addCertificate}
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {certificates.map((cert) => (
                                    <Card key={cert.id} className="border-0 shadow-lg shadow-slate-100 bg-white rounded-2xl overflow-hidden hover:shadow-xl transition-all group">
                                        <div className="h-2 bg-purple-500 w-full" />
                                        <CardContent className="p-6 space-y-4">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <Badge variant="outline" className="mb-2 bg-purple-50 text-purple-700 border-purple-100 font-bold uppercase tracking-wider text-[10px]">
                                                        {cert.certificateType}
                                                    </Badge>
                                                    <h4 className="font-black text-slate-900 leading-tight">{cert.holderName}</h4>
                                                    <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-wide">{cert.certificateNo || 'No Number'}</p>
                                                </div>
                                                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                                                    <Award className="w-5 h-5" />
                                                </div>
                                            </div>

                                            <Separator className="bg-slate-50" />

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.certificates.issueDate}</p>
                                                    <p className="text-xs font-bold text-slate-700">{format(new Date(cert.issueDate), 'dd MMM yyyy')}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.certificates.expiryDate}</p>
                                                    <p className={`text-xs font-bold ${cert.expiryDate && new Date(cert.expiryDate) < new Date() ? 'text-red-500' : 'text-slate-700'}`}>
                                                        {cert.expiryDate ? format(new Date(cert.expiryDate), 'dd MMM yyyy') : t.certificates.indefinite}
                                                    </p>
                                                </div>
                                            </div>

                                            {cert.issuingAuthority && (
                                                <div className="pt-2">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.certificates.issuingAuthority}</p>
                                                    <p className="text-xs font-medium text-slate-600 truncate">{cert.issuingAuthority}</p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                                {certificates.length === 0 && (
                                    <div className="col-span-full p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Award className="w-8 h-8 text-slate-300" />
                                        </div>
                                        <p className="text-slate-400 font-medium">{t.certificates.noCertificates}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div id="tab-gastests" className="hidden p-8 max-w-7xl mx-auto">
                        <div className="space-y-6">

                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-lg">{t.gasTests.title}</h3>
                                <Button onClick={() => setShowGasTestModal(true)} className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-100">
                                    {t.gasTests.addTest}
                                </Button>
                            </div>

                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-xs uppercase font-black text-slate-400">
                                        <tr>
                                            <th className="px-6 py-4">{t.gasTests.date}</th>
                                            <th className="px-6 py-4">{t.gasTests.o2}</th>
                                            <th className="px-6 py-4">{t.gasTests.co2}</th>
                                            <th className="px-6 py-4">{t.gasTests.lel}</th>
                                            <th className="px-6 py-4">{t.gasTests.toxic}</th>
                                            <th className="px-6 py-4">{t.gasTests.co}</th>
                                            <th className="px-6 py-4">{t.gasTests.tester}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {gasTests.map((item) => (
                                            <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4 font-bold text-slate-900">
                                                    {format(new Date(item.createdAt), 'dd MMM')} <span className="text-slate-400">·</span> {item.testTime}
                                                </td>
                                                <td className="px-6 py-4 font-medium text-slate-600">{item.oxygen || '-'}</td>
                                                <td className="px-6 py-4 font-medium text-slate-600">{item.co2 || '-'}</td>
                                                <td className="px-6 py-4 font-medium text-slate-600">{item.lel || '-'}</td>
                                                <td className="px-6 py-4 font-medium text-slate-600">{item.toxic || '-'}</td>
                                                <td className="px-6 py-4 font-medium text-slate-600">{item.co || '-'}</td>
                                                <td className="px-6 py-4 font-bold text-slate-900">{item.testedBy}</td>
                                            </tr>
                                        ))}
                                        {gasTests.length === 0 && (
                                            <tr>
                                                <td colSpan={7} className="px-6 py-8 text-center text-slate-400 italic">
                                                    {t.gasTests.noRecords}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                </main >
            </div >

            {/* Rejection Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <Card className="w-full max-w-lg border-0 shadow-2xl rounded-3xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <CardHeader className="bg-red-600 text-white p-6">
                            <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
                                <XCircle className="w-5 h-5" />
                                {language === 'tr' ? 'İzni Reddet' : 'Reject Permit'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            <div>
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">
                                    {language === 'tr' ? 'Reddetme Nedeni' : 'Reason for Rejection'}
                                </Label>
                                <textarea
                                    className="w-full h-32 p-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-red-500/20 transition-all font-bold text-slate-700 outline-none resize-none"
                                    placeholder={language === 'tr' ? 'Lütfen hazırlayan kişinin düzeltmesi için detaylı bir sebep girin...' : 'Please enter a detailed reason for the creator to fix...'}
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-4">
                                <Button
                                    variant="ghost"
                                    className="flex-1 h-12 rounded-xl font-black uppercase tracking-widest text-[10px] text-slate-400 hover:text-slate-600"
                                    onClick={() => setShowRejectModal(false)}
                                >
                                    {language === 'tr' ? 'İptal' : 'Cancel'}
                                </Button>
                                <Button
                                    className="flex-1 h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-red-100"
                                    onClick={handleReject}
                                >
                                    {language === 'tr' ? 'Reddi Onayla' : 'Confirm Rejection'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </AuthGuard>
    );
}
