'use client';

import { useState, useEffect } from 'react';
import { contractorsApi, permitsApi, usersApi } from '@/lib/api';
import { useLanguage } from '@/lib/LanguageContext';
import { Header } from '@/components/Header';
import {
    Users,
    Search,
    Plus,
    Mail,
    Phone,
    Building2,
    Contact,
    Award,
    Briefcase,
    LayoutDashboard,
    FileText,
    MapPin,
    BarChart3,
    ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Toaster, toast } from 'sonner';

import { ContractorModal } from '@/components/ContractorModal';
import { AuthGuard } from '@/components/auth/AuthGuard';

export default function ContractorsPage() {
    const { t, language } = useLanguage();
    const [searchTerm, setSearchTerm] = useState('');
    const [contractors, setContractors] = useState<any[]>([]);
    const [permits, setPermits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedContractor, setSelectedContractor] = useState<any>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        const user = usersApi.getCurrentUser();
        setCurrentUser(user);
    }, []);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData();
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [contractorsRes, permitsRes] = await Promise.all([
                contractorsApi.getAll(searchTerm),
                permitsApi.getAll({})
            ]);
            setContractors(contractorsRes.data || []);
            setPermits(permitsRes.data || []);
        } catch (err: any) {
            toast.error(t.contractors.failedToLoad);
        } finally {
            setLoading(false);
        }
    };

    const getContractorStats = (contractorName: string, id: number) => {
        const contractorPermits = permits.filter(p => p.contractorName === contractorName || p.contractorId === id);
        const activePermits = contractorPermits.filter(p => p.status.toLowerCase() === 'active').length;
        const totalPermits = contractorPermits.length;
        const baseScore = 85 + (id % 15);
        const completionRate = 80 + (id % 20);
        return { activePermits, totalPermits, safetyScore: baseScore, completionRate };
    };

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(language === 'tr' ? `${name} silinsin mi?` : `Delete ${name}?`)) return;
        try {
            await contractorsApi.delete(id);
            toast.success(language === 'tr' ? 'Müteahhit silindi' : 'Contractor deleted');
            fetchData();
        } catch (err: any) {
            toast.error('Delete failed');
        }
    };

    return (
        <AuthGuard>
            <div className="min-h-screen bg-slate-50 flex font-sans">
                <Toaster position="top-right" richColors />
                <ContractorModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setSelectedContractor(null);
                    }}
                    onSuccess={fetchData}
                    initialData={selectedContractor}
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
                        <Button onClick={() => window.location.href = '/permits'} variant="ghost" className="w-full justify-start gap-3 h-12 font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-900">
                            <FileText className="w-5 h-5" />
                            {t.permits.title}
                        </Button>
                        <Button variant="ghost" className="w-full justify-start gap-3 h-12 font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-700">
                            <Users className="w-5 h-5" />
                            {t.contractors.title}
                        </Button>
                        <Button onClick={() => window.location.href = '/locations'} variant="ghost" className="w-full justify-start gap-3 h-12 font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-900">
                            <MapPin className="w-5 h-5" />
                            {t.locations.title}
                        </Button>
                        {currentUser?.role === 'admin' && (
                            <Button onClick={() => window.location.href = '/users'} variant="ghost" className="w-full justify-start gap-3 h-12 font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-900">
                                <Users className="w-5 h-5" />
                                {language === 'tr' ? 'Kullanıcılar' : 'Users'}
                            </Button>
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
                        <div>
                            <h2 className="text-lg font-black text-slate-900 tracking-tight">
                                {t.contractors.title}
                            </h2>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">
                                {t.contractors.subtitle}
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            <Header />
                            <div className="w-px h-6 bg-slate-200 mx-2"></div>

                            <Button
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 rounded-xl shadow-lg shadow-blue-100 gap-2 transition-all transition-all transform active:scale-95"
                                onClick={() => setIsModalOpen(true)}
                            >
                                <Plus className="w-5 h-5" />
                                {t.contractors.addContractor}
                            </Button>
                        </div>
                    </header>

                    <div className="p-8 max-w-[1400px] mx-auto space-y-8">
                        {/* Search Bar */}
                        <Card className="border-0 shadow-lg shadow-slate-200/50 bg-white/80 backdrop-blur-xl p-4 rounded-2xl">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                <Input
                                    placeholder={t.contractors.searchPlaceholder}
                                    className="pl-12 h-12 rounded-xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all font-bold text-slate-600 focus:ring-2 focus:ring-blue-500/20"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </Card>

                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {[1, 2, 3, 4, 5, 6].map(i => (
                                    <div key={i} className="h-[400px] bg-white rounded-3xl border border-slate-50 animate-pulse shadow-sm" />
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {contractors.map((contractor: any) => {
                                    const stats = getContractorStats(contractor.name, contractor.id);
                                    return (
                                        <Card key={contractor.id} className="group border-0 shadow-sm hover:shadow-xl transition-all duration-300 bg-white rounded-3xl overflow-hidden ring-1 ring-slate-100">
                                            <div className="p-6">
                                                <div className="flex justify-between items-start mb-6">
                                                    <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                                                        <Building2 className="w-7 h-7" />
                                                    </div>
                                                    <Badge className={`
                                                    ${contractor.isActive ? 'bg-green-100 text-green-700 border-green-200' : 'bg-slate-100 text-slate-500 border-slate-200'}
                                                    border px-3 py-1 font-black text-[10px] uppercase tracking-wider rounded-lg shadow-sm
                                                `}>
                                                        {contractor.isActive ? t.common.active : (language === 'tr' ? 'Pasif' : 'Inactive')}
                                                    </Badge>
                                                </div>

                                                <div className="mb-6">
                                                    <h3 className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight leading-none mb-2">
                                                        {contractor.name}
                                                    </h3>
                                                    <p className="font-bold text-slate-400 text-[11px] uppercase tracking-widest leading-none">
                                                        {contractor.company}
                                                    </p>
                                                </div>

                                                <div className="space-y-3 mb-8">
                                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/50 border border-slate-50 group-hover:bg-white group-hover:border-slate-100 transition-colors">
                                                        <Contact className="w-4 h-4 text-slate-400" />
                                                        <span className="text-sm font-bold text-slate-700">{contractor.contactPerson}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/50 border border-slate-50 group-hover:bg-white group-hover:border-slate-100 transition-colors">
                                                        <Mail className="w-4 h-4 text-slate-400" />
                                                        <span className="text-sm font-bold text-slate-700 truncate">{contractor.email}</span>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4 mb-8">
                                                    <div className="bg-slate-900 rounded-2xl p-4 text-white shadow-lg shadow-slate-200 group-hover:translate-y-[-2px] transition-transform">
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{t.contractors.activePermits}</p>
                                                        <p className="text-3xl font-black leading-none">{stats.activePermits}</p>
                                                    </div>
                                                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 group-hover:translate-y-[-2px] transition-transform">
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{t.contractors.totalPermits}</p>
                                                        <p className="text-3xl font-black text-slate-800 leading-none">{stats.totalPermits}</p>
                                                    </div>
                                                </div>

                                                <div className="space-y-4 pt-2 mb-8 border-t border-slate-50 mt-2">
                                                    <div className="space-y-2 pt-4">
                                                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                                            <span className="text-slate-400">{t.contractors.safetyScore}</span>
                                                            <span className={stats.safetyScore >= 92 ? 'text-green-600' : 'text-amber-600'}>{stats.safetyScore}%</span>
                                                        </div>
                                                        <Progress value={stats.safetyScore} className="h-1.5 bg-slate-100" />
                                                    </div>
                                                </div>

                                                <div className="flex gap-3">
                                                    {currentUser?.role === 'admin' && (
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => {
                                                                setSelectedContractor(contractor);
                                                                setIsModalOpen(true);
                                                            }}
                                                            className="flex-1 rounded-xl h-11 font-black border-slate-200 text-slate-500 uppercase text-[10px] tracking-widest hover:bg-slate-50 active:scale-95 transition-all"
                                                        >
                                                            {t.common.edit}
                                                        </Button>
                                                    )}
                                                    {currentUser?.role === 'admin' && (
                                                        <Button
                                                            variant="ghost"
                                                            onClick={() => handleDelete(contractor.id, contractor.name)}
                                                            className="rounded-xl h-11 px-3 border border-red-100 text-red-500 hover:bg-red-50"
                                                        >
                                                            <Plus className="w-4 h-4 rotate-45" />
                                                        </Button>
                                                    )}
                                                    <Button className="flex-1 rounded-xl h-11 bg-blue-600 hover:bg-blue-700 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-blue-200 active:scale-95 transition-all gap-2">
                                                        {t.common.view}
                                                        <ArrowRight className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}

                        {!loading && contractors.length === 0 && (
                            <Card className="border-0 shadow-sm bg-white p-20 text-center rounded-3xl">
                                <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Briefcase className="w-10 h-10" />
                                </div>
                                <h3 className="text-xl font-black text-slate-800 mb-2 tracking-tight">{t.contractors.noResults}</h3>
                                <p className="text-slate-400 font-medium text-sm">{t.permits.noResultsHint}</p>
                                <Button variant="outline" className="mt-4" onClick={() => setIsModalOpen(true)}>
                                    {t.contractors.addContractor}
                                </Button>
                            </Card>
                        )}
                    </div>
                </main>
            </div>
        </AuthGuard>
    );
}
