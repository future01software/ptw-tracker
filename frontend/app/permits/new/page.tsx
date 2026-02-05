'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { permitsApi, contractorsApi, locationsApi, usersApi } from '@/lib/api';
import { useLanguage } from '@/lib/LanguageContext';
import { Header } from '@/components/Header';
import {
    FileText,
    Users,
    MapPin,
    LayoutDashboard,
    BarChart3,
    ArrowLeft,
    ArrowRight,
    Check,
    Shield,
    Plus,
    Clock,
    Save,
    AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast, Toaster } from 'sonner';
import { AuthGuard } from '@/components/auth/AuthGuard';

const WORK_TYPES = ['Sahada', 'Gemide', 'Yüksekte', 'Binada', 'Ateşli', 'Altyapıda', 'Kapalı Mekanda', 'Gece'];

const HAZARDS = [
    'Basınçlı Sıvı yada Gaz', 'Zehirli Madde', 'Elektrik Çarpması', 'Düşme Tehlikesi',
    'Sıcak Madde', 'Alev Alıcı Madde', 'Yangın,parlama,patlama', 'Radyasyon',
    'Makine Kaynaklı Kıvılcım', 'Açık Alev', 'Takılma,kayma', 'Kötü Hava Koşulları',
    'Yüksek Gerilim', 'Yüksek Ses', 'İnşaat Çalışması'
];

const PRECAUTIONS = [
    'Havalandırma', 'Harici Aydınlatma', 'Basınç Düşürülmesi', 'Gözlemci Bulundurulması',
    'Yangın Söndürücü', 'Yangın Battaniyesi', 'İşbaşı Toplantısı', 'Çalışma Sahasının Islak Tutulması',
    'Yanıcı Maddelerin Uzaklaştırılması', 'Ex-Proof Tesisat', 'İzolasyon', 'Bariyer Kullanılması',
    'Anti-Statik İş Elbisesi', 'Güç Kilitleme'
];

const PPE_LIST = [
    'Göz Koruyucusu', 'Kulak Koruyucusu', 'Yüz Maskesi', 'Kimyasal Koruyucu Elbise',
    'Paraşüt Tip Emniyet Kemeri', 'Baret', 'Toz Maskesi', 'Can Yeleği', 'Eldiven',
    'Sıcağa Karşı Koruma', 'Reflektif Yelek', 'İş Ayakkabısı', 'Tulum (İş Elbisesi)',
    'Kaynakçı Başlığı', 'Duman Maskesi', 'Tozluk / Kolluk'
];

const SPECIAL_CHECKLISTS: Record<string, string[]> = {
    'Working at Heights': [
        'Emniyet kemeri ve lanyarda hasar kontrolü yapıldı mı?',
        'Yaşam hattı bağlantı noktaları güvenli mi?',
        'Hava hızı 35 km/s altında mı?',
        'Alt alan emniyet şeridi ile kapatıldı mı?'
    ],
    'Hot Work': [
        'Yangın tüpü/battaniyesi hazır mı?',
        'Yanıcı maddeler 10m uzağa taşındı mı?',
        'Kaynak makinesi şasesi uygun yapıldı mı?',
        'Sürekli gaz ölçümü yapılacak mı?'
    ],
    'Confined Space': [
        'Atmosferik ölçüm yapıldı (Oksijen %19.5-23.5)?',
        'Gözlemci (Watchman) kapıda bekliyor mu?',
        'Haberleşme cihazları test edildi mi?',
        'Giriş/Çıkış kayıt defteri oluşturuldu mu?'
    ]
};

export default function NewPermitPage() {
    const { t, language } = useLanguage();
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [locations, setLocations] = useState<any[]>([]);
    const [contractors, setContractors] = useState<any[]>([]);
    const [userId, setUserId] = useState<string>('');

    const [formData, setFormData] = useState({
        // Step 1: Basic Info & Env
        type: '',
        riskLevel: '',
        activityDescription: '',
        workArea: '',
        equipment: [] as string[],
        workEntity: '', // Company or Dept Name
        workTypes: [] as string[], // Sahada, Gemide, Yüksekte...

        // Step 2: Location & Parties
        locationId: '',
        contractorId: '',
        emergencyContact: '',
        validFrom: '',
        validUntil: '',
        personnelList: [] as { name: string; role: string }[],

        // Step 3: Detailed Safety
        selectedHazards: [] as string[],
        selectedPrecautions: [] as string[],
        selectedPPE: [] as string[],
        safetyChecklist: [] as string[], // Type-specific items
        otherHazards: '',
        otherPrecautions: '',
        otherPPE: '',
        siteTestRequired: false,
        requiredCertificates: [] as string[],

        // Step 4: Review
        status: 'pending'
    });

    const [personnelInput, setPersonnelInput] = useState({ name: '', role: 'Worker' });

    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        const user = usersApi.getCurrentUser();
        setCurrentUser(user);
        if (user) {
            setUserId(user.id);
        }
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [locationsRes, contractorsRes] = await Promise.all([
                locationsApi.getAll(),
                contractorsApi.getAll()
            ]);

            setLocations(locationsRes.data || []);
            setContractors(contractorsRes.data || []);
        } catch (err: any) {
            toast.error(t.newPermit.failedToLoad);
        } finally {
            setLoading(false);
        }
    };

    const validateStep = (step: number) => {
        if (step === 1) {
            return formData.type && formData.riskLevel && formData.activityDescription && formData.workEntity;
        }
        if (step === 2) {
            return formData.locationId && formData.validFrom && formData.validUntil && formData.emergencyContact && formData.personnelList.length > 0;
        }
        if (step === 3) {
            const hasHazards = formData.selectedHazards.length > 0 || formData.otherHazards;
            const hasPrecautions = formData.selectedPrecautions.length > 0 || formData.otherPrecautions;
            const hasPPE = formData.selectedPPE.length > 0 || formData.otherPPE;

            const checklistItems = SPECIAL_CHECKLISTS[formData.type] || [];
            const isChecklistFilled = checklistItems.every(item => formData.safetyChecklist.includes(item));

            return hasHazards && hasPrecautions && hasPPE && isChecklistFilled;
        }
        return true;
    };

    const handleNext = () => {
        if (!validateStep(currentStep)) {
            toast.error(language === 'tr' ? 'Lütfen tüm zorunlu alanları doldurun.' : 'Please fill all required fields.');
            return;
        }
        if (currentStep < 4) setCurrentStep(currentStep + 1);
        window.scrollTo(0, 0);
    };

    const handlePrevious = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1);
        window.scrollTo(0, 0);
    };

    const handleSubmit = async () => {
        try {
            setSubmitting(true);
            const selectedLocation = locations.find(l => String(l.id) === String(formData.locationId));
            const selectedContractor = contractors.find(c => String(c.id) === String(formData.contractorId));

            const permitData = {
                ptwType: formData.type,
                description: formData.activityDescription,
                locationName: selectedLocation?.name || formData.workArea,
                contractorName: selectedContractor?.name || 'AssanPort',
                riskLevel: formData.riskLevel,
                validFrom: new Date(formData.validFrom).toISOString(),
                validUntil: new Date(formData.validUntil).toISOString(),
                createdById: userId,
                status: formData.status,
                workArea: formData.workArea,
                equipment: formData.equipment,
                ptwSubType: (formData as any).ptwSubType,
                // Map old fields for backward compatibility if needed, or just use new ones
                safetyPrecautions: formData.selectedPrecautions,
                ppeRequired: formData.selectedPPE,
                emergencyContact: formData.emergencyContact,

                // New Safiport Fields
                workEntity: formData.workEntity,
                workTypes: JSON.stringify(formData.workTypes),
                personnelList: JSON.stringify(formData.personnelList),
                selectedHazards: JSON.stringify(formData.selectedHazards),
                selectedPrecautions: JSON.stringify(formData.selectedPrecautions),
                selectedPPE: JSON.stringify(formData.selectedPPE),
                safetyChecklist: JSON.stringify(formData.safetyChecklist),
                otherHazards: formData.otherHazards,
                otherPrecautions: formData.otherPrecautions,
                otherPPE: formData.otherPPE,
                siteTestRequired: formData.siteTestRequired || formData.type === 'Confined Space' || formData.type === 'Hot Work' || formData.workTypes.includes('Kapalı Mekanda') || formData.workTypes.includes('Ateşli'),
                requiredCertificates: JSON.stringify(formData.requiredCertificates),
            };

            await permitsApi.create(permitData);
            toast.success(t.newPermit.successMessage);
            router.push('/permits');
        } catch (err: any) {
            toast.error(t.newPermit.errorMessage + ': ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleSaveDraft = () => {
        localStorage.setItem('permitDraft', JSON.stringify({ ...formData, status: 'draft' }));
        toast.success(t.newPermit.draftSaved);
    };

    const toggleArrayItem = (array: string[], item: string) => {
        return array.includes(item)
            ? array.filter(i => i !== item)
            : [...array, item];
    };

    const steps = [
        { id: 1, title: t.newPermit.step1, icon: <FileText className="w-4 h-4" /> },
        { id: 2, title: t.newPermit.step2, icon: <MapPin className="w-4 h-4" /> },
        { id: 3, title: t.newPermit.step3, icon: <Shield className="w-4 h-4" /> },
        { id: 4, title: t.newPermit.step4, icon: <Check className="w-4 h-4" /> },
    ];

    return (
        <AuthGuard>
            <div className="min-h-screen bg-slate-50 flex font-sans">
                <Toaster position="top-right" richColors />

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
                        {currentUser?.role === 'admin' && (
                            <Button onClick={() => window.location.href = '/users'} variant="ghost" className="w-full justify-start gap-3 h-12 font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-900">
                                <Users className="w-5 h-5" />
                                {language === 'tr' ? 'Kullanıcılar' : 'Users'}
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
                                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                                    {t.newPermit.title}
                                </h2>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">
                                    {t.newPermit.subtitle}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <Button variant="outline" className="border-slate-200 text-slate-600 font-bold px-5 rounded-xl text-xs h-10" onClick={handleSaveDraft}>
                                <Save className="w-4 h-4 mr-2" />
                                {t.newPermit.saveDraft}
                            </Button>
                            <Header />
                        </div>
                    </header>

                    <div className="p-8 max-w-4xl mx-auto">
                        {/* Horizontal Progress */}
                        <div className="mb-12 relative px-4">
                            <div className="flex justify-between items-center relative z-10">
                                {steps.map((step) => (
                                    <div key={step.id} className="flex flex-col items-center group">
                                        <div className={`
                                        w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 border-2
                                        ${currentStep === step.id ? 'bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-200 scale-110' :
                                                currentStep > step.id ? 'bg-green-500 text-white border-green-500' :
                                                    'bg-white text-slate-300 border-slate-200 shadow-sm'}
                                    `}>
                                            {currentStep > step.id ? <Check className="w-6 h-6" /> : step.icon}
                                        </div>
                                        <p className={`mt-3 text-[10px] font-black uppercase tracking-widest text-center ${currentStep === step.id ? 'text-blue-600' : 'text-slate-400'}`}>
                                            {step.title}
                                        </p>
                                    </div>
                                ))}
                            </div>
                            {/* Background Line */}
                            <div className="absolute top-6 left-10 right-10 h-0.5 bg-slate-200 -z-0">
                                <div
                                    className="h-full bg-blue-500 transition-all duration-500 ease-out"
                                    style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                                />
                            </div>
                        </div>

                        <Card className="border-0 shadow-xl shadow-slate-200/50 bg-white rounded-3xl overflow-hidden">
                            <CardContent className="p-10">
                                {/* Step 1: Core Details */}
                                {currentStep === 1 && (
                                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                                    <FileText className="w-5 h-5" />
                                                </div>
                                                <h2 className="text-xl font-black text-slate-900 tracking-tight">{t.newPermit.step1}</h2>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-3">
                                                    <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400">{t.newPermit.permitType} *</Label>
                                                    <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                                                        <SelectTrigger className="h-12 rounded-xl border-slate-100 bg-slate-50/50 font-bold">
                                                            <SelectValue placeholder={t.newPermit.selectType} />
                                                        </SelectTrigger>
                                                        <SelectContent className="rounded-xl border-slate-100 shadow-2xl">
                                                            {Object.entries(t.permitTypes).map(([key, val]) => (
                                                                <SelectItem key={key} value={key} className="font-bold">{val as string}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-3">
                                                    <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400">{t.newPermit.riskLevel} *</Label>
                                                    <Select value={formData.riskLevel} onValueChange={(v) => setFormData({ ...formData, riskLevel: v })}>
                                                        <SelectTrigger className="h-12 rounded-xl border-slate-100 bg-slate-50/50 font-bold">
                                                            <SelectValue placeholder={t.newPermit.selectRisk} />
                                                        </SelectTrigger>
                                                        <SelectContent className="rounded-xl border-slate-100 shadow-2xl font-bold">
                                                            <SelectItem value="Low" className="text-green-600">Low</SelectItem>
                                                            <SelectItem value="Medium" className="text-orange-600">Medium</SelectItem>
                                                            <SelectItem value="High" className="text-red-600">High</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            {/* Dynamic Fields based on Type */}
                                            {formData.type === 'Mobile Crane' && (
                                                <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex gap-3 text-amber-800">
                                                    <AlertTriangle className="w-5 h-5 shrink-0" />
                                                    <div className="text-sm">
                                                        <p className="font-bold mb-1">{language === 'tr' ? 'Önemli Uyarı' : 'Important Notice'}</p>
                                                        <p>{language === 'tr' ? 'Mobil vinç çalışmaları için en az 3 iş günü öncesinden Mühendislik Onayı gereklidir.' : 'Engineering Assessment requires at least 3 working days notice for Mobile Crane operations.'}</p>
                                                    </div>
                                                </div>
                                            )}

                                            {formData.type === 'Electrical' && (
                                                <div className="flex items-center space-x-2 border p-4 rounded-xl bg-slate-50 border-slate-100">
                                                    <div
                                                        className={`w-5 h-5 rounded border flex items-center justify-center cursor-pointer ${(formData as any).ptwSubType === 'Prescribed' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-300'}`}
                                                        onClick={() => setFormData({ ...formData, ptwSubType: (formData as any).ptwSubType === 'Prescribed' ? '' : 'Prescribed' } as any)}
                                                    >
                                                        {(formData as any).ptwSubType === 'Prescribed' && <Check className="w-3 h-3" />}
                                                    </div>
                                                    <Label className="cursor-pointer font-bold text-slate-700" onClick={() => setFormData({ ...formData, ptwSubType: (formData as any).ptwSubType === 'Prescribed' ? '' : 'Prescribed' } as any)}>
                                                        {language === 'tr' ? 'Reçeteli Elektrik İşi (Lisanslı Elektrikçi Gerektirir)' : 'Prescribed Electrical Work (Requires Licensed Electrician)'}
                                                    </Label>
                                                </div>
                                            )}

                                            <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                                <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400">İşi Yapacak Firma / Departman *</Label>
                                                <Input
                                                    className="h-12 rounded-xl border-slate-100 bg-white font-bold"
                                                    placeholder="Örn: Mekanik Bakım, Yüklenici Firma Adı..."
                                                    value={formData.workEntity}
                                                    onChange={e => setFormData({ ...formData, workEntity: e.target.value })}
                                                />
                                            </div>

                                            <div className="space-y-3">
                                                <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Çalışma Tipi (Work Type)</Label>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                                    {WORK_TYPES.map(type => (
                                                        <div
                                                            key={type}
                                                            onClick={() => setFormData({ ...formData, workTypes: toggleArrayItem(formData.workTypes, type) })}
                                                            className={`h-10 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all text-xs font-bold ${formData.workTypes.includes(type) ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-slate-100 text-slate-400'}`}
                                                        >
                                                            {type}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400">{t.newPermit.activityDescription} *</Label>
                                                <Textarea
                                                    placeholder={t.newPermit.descriptionPlaceholder}
                                                    value={formData.activityDescription}
                                                    onChange={(e) => setFormData({ ...formData, activityDescription: e.target.value })}
                                                    className="min-h-[140px] rounded-2xl border-slate-100 bg-slate-50/50 p-6 text-slate-700 font-bold focus:bg-white focus:ring-blue-500/10 transition-all"
                                                />
                                            </div>

                                            <div className="space-y-3">
                                                <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400">{t.newPermit.workArea}</Label>
                                                <div className="relative group">
                                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                                                    <Input
                                                        className="pl-11 h-12 rounded-xl border-slate-100 bg-slate-50/50 font-bold focus:bg-white transition-all"
                                                        placeholder={t.newPermit.workAreaPlaceholder}
                                                        value={formData.workArea}
                                                        onChange={(e) => setFormData({ ...formData, workArea: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Step 2: Location & Timing (Condensed for space) */}
                                {currentStep === 2 && (
                                    <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-8">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                                                <MapPin className="w-5 h-5" />
                                            </div>
                                            <h2 className="text-xl font-black text-slate-900 tracking-tight">{t.newPermit.step2}</h2>
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400">{t.common.location} *</Label>
                                            <Select value={formData.locationId} onValueChange={(v) => setFormData({ ...formData, locationId: v })}>
                                                <SelectTrigger className="h-12 rounded-xl border-slate-100 bg-slate-50/50 font-bold">
                                                    <SelectValue placeholder={t.newPermit.selectLocation} />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl border-slate-100 shadow-2xl">
                                                    {locations.map(loc => (
                                                        <SelectItem key={loc.id} value={String(loc.id)} className="font-bold">{loc.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        {/* Timing & Contact Fields */}
                                        <div className="grid grid-cols-2 gap-8">
                                            <div className="space-y-3">
                                                <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400">{t.newPermit.validFrom} *</Label>
                                                <Input type="datetime-local" className="h-12 rounded-xl border-slate-100 bg-slate-50/50 font-bold" value={formData.validFrom} onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })} />
                                            </div>
                                            <div className="space-y-3">
                                                <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400">{t.newPermit.validUntil} *</Label>
                                                <Input type="datetime-local" className="h-12 rounded-xl border-slate-100 bg-slate-50/50 font-bold" value={formData.validUntil} onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })} />
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400">{t.newPermit.emergencyContact} *</Label>
                                            <Input placeholder="+90 (---) --- -- --" className="h-12 rounded-xl border-slate-100 bg-slate-50/50 font-bold" value={formData.emergencyContact} onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })} />
                                        </div>

                                        {/* Personnel List */}
                                        <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Çalışacak Personel Listesi (Personnel)</Label>
                                                <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-bold">{formData.personnelList.length} Kişi</span>
                                            </div>

                                            <div className="flex gap-2">
                                                <Input
                                                    className="flex-1 h-10 rounded-lg border-slate-200 font-bold text-xs"
                                                    placeholder="Ad Soyad (Name Surname)"
                                                    value={personnelInput.name}
                                                    onChange={e => setPersonnelInput({ ...personnelInput, name: e.target.value })}
                                                />
                                                <Select value={personnelInput.role} onValueChange={(v) => setPersonnelInput({ ...personnelInput, role: v })}>
                                                    <SelectTrigger className="w-32 h-10 rounded-lg border-slate-200 font-bold text-xs">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-xl font-bold">
                                                        <SelectItem value="Worker">Worker</SelectItem>
                                                        <SelectItem value="Foreman">Foreman</SelectItem>
                                                        <SelectItem value="Supervisor">Supervisor</SelectItem>
                                                        <SelectItem value="Safety">Safety</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <Button
                                                    type="button"
                                                    className="bg-blue-600 text-white rounded-lg px-4"
                                                    onClick={() => {
                                                        if (personnelInput.name) {
                                                            setFormData({
                                                                ...formData,
                                                                personnelList: [...formData.personnelList, { ...personnelInput }]
                                                            });
                                                            setPersonnelInput({ name: '', role: 'Worker' });
                                                        }
                                                    }}
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </Button>
                                            </div>

                                            <div className="grid grid-cols-1 gap-2">
                                                {formData.personnelList.map((p, idx) => (
                                                    <div key={idx} className="flex justify-between items-center bg-white p-2 px-3 rounded-lg border border-slate-200 shadow-sm">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                                                {p.name.charAt(0)}
                                                            </div>
                                                            <span className="text-xs font-bold text-slate-700">{p.name}</span>
                                                            <Badge variant="outline" className="text-[9px] h-4 px-1 font-bold border-slate-100 text-slate-400">{p.role}</Badge>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 w-6 text-slate-400 hover:text-red-500 p-0"
                                                            onClick={() => setFormData({
                                                                ...formData,
                                                                personnelList: formData.personnelList.filter((_, i) => i !== idx)
                                                            })}
                                                        >
                                                            &times;
                                                        </Button>
                                                    </div>
                                                ))}
                                                {formData.personnelList.length === 0 && (
                                                    <p className="text-xs text-slate-400 text-center py-2 italic">Henüz personel eklenmedi...</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Step 3: Safety (Condensed) */}
                                {currentStep === 3 && (
                                    <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-8">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                                                <Shield className="w-5 h-5" />
                                            </div>
                                            <h2 className="text-xl font-black text-slate-900 tracking-tight">Güvenlik Kontrolleri (Safety Checks)</h2>
                                        </div>

                                        {/* Hazards */}
                                        <div>
                                            <Label className="text-[11px] font-black uppercase tracking-widest text-red-500 mb-4 block">Tehlikeler (Hazards)</Label>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                                                {HAZARDS.map(item => (
                                                    <div key={item}
                                                        className={`p-3 rounded-lg border cursor-pointer flex items-center gap-3 transition-all ${formData.selectedHazards.includes(item) ? 'bg-red-50 border-red-200 shadow-sm' : 'border-slate-100 hover:bg-slate-50'}`}
                                                        onClick={() => setFormData({ ...formData, selectedHazards: toggleArrayItem(formData.selectedHazards, item) })}
                                                    >
                                                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${formData.selectedHazards.includes(item) ? 'bg-red-500 border-red-500 text-white' : 'border-slate-300'}`}>
                                                            {formData.selectedHazards.includes(item) && <Check className="w-3 h-3" />}
                                                        </div>
                                                        <span className="text-[10px] font-bold text-slate-700 leading-tight">{item}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <Input
                                                placeholder="Diğer Tehlike (Other Hazard)..."
                                                value={formData.otherHazards}
                                                onChange={e => setFormData({ ...formData, otherHazards: e.target.value })}
                                                className="h-10 text-xs bg-slate-50 border-slate-200"
                                            />
                                        </div>

                                        {/* Precautions */}
                                        <div>
                                            <Label className="text-[11px] font-black uppercase tracking-widest text-blue-500 mb-4 block">Önlemler (Precautions)</Label>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                                                {PRECAUTIONS.map(item => (
                                                    <div key={item}
                                                        className={`p-3 rounded-lg border cursor-pointer flex items-center gap-3 transition-all ${formData.selectedPrecautions.includes(item) ? 'bg-blue-50 border-blue-200 shadow-sm' : 'border-slate-100 hover:bg-slate-50'}`}
                                                        onClick={() => setFormData({ ...formData, selectedPrecautions: toggleArrayItem(formData.selectedPrecautions, item) })}
                                                    >
                                                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${formData.selectedPrecautions.includes(item) ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300'}`}>
                                                            {formData.selectedPrecautions.includes(item) && <Check className="w-3 h-3" />}
                                                        </div>
                                                        <span className="text-[10px] font-bold text-slate-700 leading-tight">{item}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <Input
                                                placeholder="Diğer Önlem (Other Precaution)..."
                                                value={formData.otherPrecautions}
                                                onChange={e => setFormData({ ...formData, otherPrecautions: e.target.value })}
                                                className="h-10 text-xs bg-slate-50 border-slate-200"
                                            />
                                        </div>

                                        {/* PPE */}
                                        <div>
                                            <Label className="text-[11px] font-black uppercase tracking-widest text-green-500 mb-4 block">Kişisel Koruyucu Donanımlar (PPE)</Label>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                                                {PPE_LIST.map(item => (
                                                    <div key={item}
                                                        className={`p-3 rounded-lg border cursor-pointer flex items-center gap-3 transition-all ${formData.selectedPPE.includes(item) ? 'bg-green-50 border-green-200 shadow-sm' : 'border-slate-100 hover:bg-slate-50'}`}
                                                        onClick={() => setFormData({ ...formData, selectedPPE: toggleArrayItem(formData.selectedPPE, item) })}
                                                    >
                                                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${formData.selectedPPE.includes(item) ? 'bg-green-600 border-green-600 text-white' : 'border-slate-300'}`}>
                                                            {formData.selectedPPE.includes(item) && <Check className="w-3 h-3" />}
                                                        </div>
                                                        <span className="text-[10px] font-bold text-slate-700 leading-tight">{item}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <Input
                                                placeholder="Diğer KKD (Other PPE)..."
                                                value={formData.otherPPE}
                                                onChange={e => setFormData({ ...formData, otherPPE: e.target.value })}
                                                className="h-10 text-xs bg-slate-50 border-slate-200"
                                            />
                                        </div>

                                        {/* Specific Safety Checklist (Based on Type) */}
                                        {SPECIAL_CHECKLISTS[formData.type] && (
                                            <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100 space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                                                        <Check className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <Label className="text-[11px] font-black uppercase tracking-widest text-blue-600 block">Özel Güvenlik Kontrol Listesi</Label>
                                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{(t.permitTypes as any)[formData.type]} için zorunlu kontroller</p>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    {SPECIAL_CHECKLISTS[formData.type].map(item => (
                                                        <div
                                                            key={item}
                                                            onClick={() => setFormData({ ...formData, safetyChecklist: toggleArrayItem(formData.safetyChecklist, item) })}
                                                            className={`p-3 rounded-xl border-2 flex items-center gap-3 cursor-pointer transition-all ${formData.safetyChecklist.includes(item) ? 'bg-white border-blue-500 shadow-sm' : 'bg-white/50 border-slate-100 hover:border-slate-200'}`}
                                                        >
                                                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${formData.safetyChecklist.includes(item) ? 'bg-blue-600 border-blue-600' : 'border-slate-200'}`}>
                                                                {formData.safetyChecklist.includes(item) && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                                                            </div>
                                                            <span className={`text-xs font-bold transition-colors ${formData.safetyChecklist.includes(item) ? 'text-blue-700' : 'text-slate-500'}`}>{item}</span>
                                                        </div>
                                                    ))}
                                                </div>

                                                {SPECIAL_CHECKLISTS[formData.type].length !== formData.safetyChecklist.length && (
                                                    <p className="text-[10px] text-red-500 font-bold flex items-center gap-1.5 px-1 animate-pulse">
                                                        <AlertTriangle className="w-3 h-3" />
                                                        Lütfen tüm kontrol listesi maddelerini onaylayın.
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {/* Site Test Required Toggle */}
                                        <div className="bg-amber-50 rounded-xl p-6 border border-amber-200 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <Label className="text-[11px] font-black uppercase tracking-widest text-amber-600 block">{t.newPermit.siteTestRequired}</Label>
                                                    <p className="text-xs text-slate-500 mt-1">{t.newPermit.mandatoryMessage}</p>
                                                </div>
                                                <div
                                                    className={`w-14 h-7 rounded-full cursor-pointer transition-all relative ${formData.siteTestRequired || formData.type === 'Confined Space' || formData.type === 'Hot Work' || formData.workTypes.includes('Kapalı Mekanda') || formData.workTypes.includes('Ateşli')
                                                        ? 'bg-amber-500'
                                                        : 'bg-slate-300'
                                                        }`}
                                                    onClick={() => {
                                                        // Don't allow disabling for hot work or confined space
                                                        if (formData.type === 'Confined Space' || formData.type === 'Hot Work' || formData.workTypes.includes('Kapalı Mekanda') || formData.workTypes.includes('Ateşli')) {
                                                            return;
                                                        }
                                                        setFormData({ ...formData, siteTestRequired: !formData.siteTestRequired });
                                                    }}
                                                >
                                                    <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all shadow ${formData.siteTestRequired || formData.type === 'Confined Space' || formData.type === 'Hot Work' || formData.workTypes.includes('Kapalı Mekanda') || formData.workTypes.includes('Ateşli')
                                                        ? 'right-1'
                                                        : 'left-1'
                                                        }`} />
                                                </div>
                                            </div>
                                            {(formData.type === 'Confined Space' || formData.type === 'Hot Work' || formData.workTypes.includes('Kapalı Mekanda') || formData.workTypes.includes('Ateşli')) && (
                                                <div className="flex items-center gap-2 text-amber-700 text-xs font-bold bg-amber-100 px-3 py-2 rounded-lg">
                                                    <AlertTriangle className="w-4 h-4" />
                                                    {t.newPermit.mandatoryWarning}
                                                </div>
                                            )}
                                        </div>

                                        {/* Certificates Section */}
                                        <div>
                                            <Label className="text-[11px] font-black uppercase tracking-widest text-purple-500 mb-4 block">{t.newPermit.requiredCertificates}</Label>
                                            <div className="flex flex-wrap gap-2">
                                                {Object.entries(t.certificates.types).map(([key, val]) => (
                                                    <div key={key}
                                                        className={`p-3 rounded-lg border cursor-pointer flex items-center gap-3 transition-all ${formData.requiredCertificates.includes(key) ? 'bg-purple-50 border-purple-200 shadow-sm' : 'border-slate-100 hover:bg-slate-50'}`}
                                                        onClick={() => setFormData({ ...formData, requiredCertificates: toggleArrayItem(formData.requiredCertificates, key) })}
                                                    >
                                                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${formData.requiredCertificates.includes(key) ? 'bg-purple-600 border-purple-600 text-white' : 'border-slate-300'}`}>
                                                            {formData.requiredCertificates.includes(key) && <Check className="w-3 h-3" />}
                                                        </div>
                                                        <span className="text-[10px] font-bold text-slate-700 leading-tight">{val as string}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Step 4: Final Review (Condensed) */}
                                {currentStep === 4 && (
                                    <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-8">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-10 h-10 rounded-xl bg-green-600 text-white flex items-center justify-center shadow-lg shadow-green-200">
                                                <Check className="w-5 h-5" />
                                            </div>
                                            <h2 className="text-xl font-black text-slate-900 tracking-tight">{t.newPermit.step4}</h2>
                                        </div>
                                        <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 space-y-4">
                                            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-50">
                                                <span className="text-[10px] font-black uppercase text-slate-400">{t.common.type}</span>
                                                <span className="text-sm font-black text-blue-600 uppercase tracking-tight">{(t.permitTypes as any)[formData.type]}</span>
                                            </div>
                                            <span className="text-sm font-black text-slate-900">{locations.find(l => String(l.id) === String(formData.locationId))?.name || '-'}</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-50">
                                            <span className="text-[10px] font-black uppercase text-slate-400">Tehlikeler</span>
                                            <span className="text-sm font-black text-red-600">{formData.selectedHazards.length} Selected</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-50">
                                            <span className="text-[10px] font-black uppercase text-slate-400">Önlemler</span>
                                            <span className="text-sm font-black text-blue-600">{formData.selectedPrecautions.length} Selected</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-50">
                                            <span className="text-[10px] font-black uppercase text-slate-400">KKD</span>
                                            <span className="text-sm font-black text-green-600">{formData.selectedPPE.length} Selected</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-50">
                                            <span className="text-[10px] font-black uppercase text-slate-400">Personel</span>
                                            <span className="text-sm font-black text-slate-900">{formData.personnelList.length} Kişi</span>
                                        </div>
                                    </div>
                                )}
                            </CardContent>

                            {/* Footer Actions */}
                            <div className="bg-slate-50 p-8 border-t border-slate-100 flex items-center justify-between">
                                <Button variant="ghost" className="font-black text-slate-400 uppercase text-[11px] tracking-widest px-6 h-12 rounded-xl disabled:opacity-0" onClick={handlePrevious} disabled={currentStep === 1}>
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    {t.newPermit.prevStep}
                                </Button>

                                <div className="flex gap-4">
                                    {currentStep < 4 ? (
                                        <Button className="bg-blue-600 hover:bg-blue-700 text-white font-black h-13 px-8 rounded-2xl shadow-xl shadow-blue-100 transition-all active:scale-95 gap-3 uppercase text-[11px] tracking-widest" onClick={handleNext}>
                                            {t.newPermit.nextStep}
                                            <ArrowRight className="w-5 h-5" />
                                        </Button>
                                    ) : (
                                        <Button className="bg-green-600 hover:bg-green-700 text-white font-black h-13 px-10 rounded-2xl shadow-xl shadow-green-100 transition-all active:scale-95 gap-3 uppercase text-[11px] tracking-widest" onClick={handleSubmit} disabled={submitting}>
                                            {submitting ? <Clock className="w-4 h-4 animate-spin" /> : <Plus className="w-5 h-5" />}
                                            {submitting ? t.common.loading : t.newPermit.submitPermit}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </Card>
                    </div>
                </main >
            </div >
        </AuthGuard>
    );
}
