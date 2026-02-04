'use client';

import { useState, useEffect } from 'react';
import { permitsApi } from '@/lib/api';
import { useLanguage } from '@/lib/LanguageContext';
import { Header } from '@/components/Header';
import {
    FileText,
    Users,
    MapPin,
    Search,
    Plus,
    LayoutDashboard,
    BarChart3,
    ArrowRight,
    Calendar,
    AlertTriangle,
    Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Toaster, toast } from 'sonner';
import { format } from 'date-fns';
import { ExportMenu } from '@/components/ExportMenu';

export default function PermitsPage() {
    const { t, language } = useLanguage();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [riskFilter, setRiskFilter] = useState('all');
    const [permits, setPermits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchPermits();
    }, [statusFilter, typeFilter, riskFilter, searchTerm]);

    const fetchPermits = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await permitsApi.getAll({
                status: statusFilter,
                ptwType: typeFilter,
                riskLevel: riskFilter,
                search: searchTerm
            });
            setPermits(response.data || []);
        } catch (err: any) {
            console.error('Failed to fetch permits:', err);
            setError(err.message || t.permits.failedToLoad);
            toast.error(language === 'tr' ? 'Veriler yüklenemedi' : 'Failed to load permits');
        } finally {
            setLoading(false);
        }
    };

    const statusColors: Record<string, string> = {
        'active': 'bg-blue-100 text-blue-700 border-blue-200',
        'pending': 'bg-amber-100 text-amber-700 border-amber-200',
        'completed': 'bg-green-100 text-green-700 border-green-200',
        'draft': 'bg-slate-100 text-slate-600 border-slate-200',
        'cancelled': 'bg-red-100 text-red-700 border-red-200',
        'expired': 'bg-red-50 text-red-600 border-red-100',
    };

    const riskColors: Record<string, string> = {
        'High': 'text-red-600 bg-red-50 border-red-100',
        'Medium': 'text-amber-600 bg-amber-50 border-amber-100',
        'Low': 'text-green-600 bg-green-50 border-green-100',
    };

    const typeColors: Record<string, string> = {
        'Hot Work': 'bg-red-500',
        'Cold Work': 'bg-blue-500',
        'Electrical': 'bg-amber-500',
        'Confined Space': 'bg-purple-500',
        'Height Work': 'bg-pink-500',
    };

    return (
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
                    <Button variant="ghost" className="w-full justify-start gap-3 h-12 font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-700">
                        <FileText className="w-5 h-5" />
                        {t.permits.title}
                    </Button>
                    <Button onClick={() => window.location.href = '/contractors'} variant="ghost" className="w-full justify-start gap-3 h-12 font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-900">
                        <Users className="w-5 h-5" />
                        {t.contractors.title}
                    </Button>
                    <Button onClick={() => window.location.href = '/locations'} variant="ghost" className="w-full justify-start gap-3 h-12 font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-900">
                        <MapPin className="w-5 h-5" />
                        {t.locations.title}
                    </Button>
                    <Button onClick={() => window.location.href = '/analytics'} variant="ghost" className="w-full justify-start gap-3 h-12 font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-900">
                        <BarChart3 className="w-5 h-5" />
                        {language === 'tr' ? 'Analitik' : 'Analytics'}
                    </Button>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-w-0 pb-20">
                {/* Header */}
                <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-30 shadow-sm shadow-slate-100/50">
                    <div>
                        <h2 className="text-lg font-black text-slate-900 tracking-tight">
                            {t.permits.title}
                        </h2>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">
                            {t.permits.subtitle}
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <Header />
                        <div className="w-px h-6 bg-slate-200 mx-2"></div>

                        <ExportMenu permits={permits} />

                        <Button
                            onClick={() => window.location.href = '/permits/new'}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 rounded-xl shadow-lg shadow-blue-100 gap-2 transition-all transform active:scale-95"
                        >
                            <Plus className="w-5 h-5" />
                            {t.permits.newPermit}
                        </Button>
                    </div>
                </header>

                <div className="p-8 max-w-[1400px] mx-auto space-y-8">

                    {/* Glassmorphism Filters */}
                    <Card className="border-0 shadow-lg shadow-slate-200/50 bg-white/80 backdrop-blur-xl border-t border-white overflow-hidden">
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                {/* Search */}
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">
                                        {t.common.search}
                                    </label>
                                    <div className="relative group">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                        <Input
                                            placeholder={t.permits.searchPlaceholder}
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-10 h-11 bg-slate-50 border-slate-200 rounded-xl focus:bg-white transition-all shadow-inner border-0 ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500/20"
                                        />
                                    </div>
                                </div>

                                {/* Status Filter */}
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">
                                        {t.common.status}
                                    </label>
                                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger className="h-11 bg-slate-50 border-slate-200 rounded-xl focus:bg-white transition-all shadow-inner border-0 ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500/20 font-medium">
                                            <SelectValue placeholder={t.permits.allStatus} />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-slate-100 shadow-2xl">
                                            <SelectItem value="all">{t.permits.allStatus}</SelectItem>
                                            <SelectItem value="active">{t.statuses.active}</SelectItem>
                                            <SelectItem value="pending">{t.statuses.pending}</SelectItem>
                                            <SelectItem value="completed">{t.statuses.completed}</SelectItem>
                                            <SelectItem value="draft">{t.statuses.draft}</SelectItem>
                                            <SelectItem value="cancelled">{t.statuses.cancelled}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Type Filter */}
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">
                                        {t.common.type}
                                    </label>
                                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                                        <SelectTrigger className="h-11 bg-slate-50 border-slate-200 rounded-xl focus:bg-white transition-all shadow-inner border-0 ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500/20 font-medium">
                                            <SelectValue placeholder={t.permits.allTypes} />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-slate-100 shadow-2xl">
                                            <SelectItem value="all">{t.permits.allTypes}</SelectItem>
                                            {Object.entries(t.permitTypes).map(([key, val]) => (
                                                <SelectItem key={key} value={key}>{val as string}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Risk Filter */}
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">
                                        {t.common.risk}
                                    </label>
                                    <Select value={riskFilter} onValueChange={setRiskFilter}>
                                        <SelectTrigger className="h-11 bg-slate-50 border-slate-200 rounded-xl focus:bg-white transition-all shadow-inner border-0 ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500/20 font-medium">
                                            <SelectValue placeholder={t.permits.allRisks} />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-slate-100 shadow-2xl">
                                            <SelectItem value="all">{t.permits.allRisks}</SelectItem>
                                            <SelectItem value="High">{t.riskLevels.High}</SelectItem>
                                            <SelectItem value="Medium">{t.riskLevels.Medium}</SelectItem>
                                            <SelectItem value="Low">{t.riskLevels.Low}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Permits Table */}
                    <Card className="border-0 shadow-sm bg-white overflow-hidden rounded-2xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100">
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">{t.permits.tablePermitNumber}</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">{t.permits.tableType}</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">{t.permits.tableStatus}</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">{t.permits.tableLocation}</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">{t.permits.tableContractor}</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">{t.permits.tableRisk}</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">{t.permits.tableActions}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-20 text-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                                    <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">{t.common.loading}...</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : permits.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-20 text-center">
                                                <div className="flex flex-col items-center gap-4 opacity-40">
                                                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
                                                        <FileText className="w-10 h-10 text-slate-300" />
                                                    </div>
                                                    <div>
                                                        <p className="text-lg font-bold text-slate-900">{t.permits.noResults}</p>
                                                        <p className="text-sm text-slate-500 max-w-xs mx-auto mt-1">{t.permits.noResultsHint}</p>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        permits.map((permit) => (
                                            <tr
                                                key={permit.id}
                                                className="group border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer"
                                                onClick={() => window.location.href = `/permits/${permit.id}`}
                                            >
                                                <td className="px-6 py-5">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                                                            {permit.permitNumber}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter flex items-center gap-1 mt-0.5">
                                                            <Calendar className="w-3 h-3 opacity-50" />
                                                            {format(new Date(permit.createdAt), 'dd.MM.yyyy')}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-2 h-2 rounded-full ${typeColors[permit.ptwType] || 'bg-slate-400'}`}></div>
                                                        <span className="text-sm font-bold text-slate-600 opacity-90">
                                                            {(t.permitTypes as any)[permit.ptwType] || permit.ptwType}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <Badge className={`${statusColors[permit.status.toLowerCase()] || 'bg-slate-100'} border shadow-sm px-3 py-1 text-[11px] font-black uppercase tracking-wider rounded-lg`}>
                                                        {(t.statuses as any)[permit.status.toLowerCase()] || permit.status}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-2 text-slate-600">
                                                        <MapPin className="w-3.5 h-3.5 text-slate-300" />
                                                        <span className="text-sm font-bold">{permit.locationName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-2 text-slate-600">
                                                        <Users className="w-3.5 h-3.5 text-slate-300" />
                                                        <span className="text-sm font-bold truncate max-w-[150px]">{permit.contractorName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className={`flex items-center gap-1 text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${riskColors[permit.riskLevel] || 'text-slate-400 border-slate-100'}`}>
                                                        <AlertTriangle className="w-3 h-3" />
                                                        {(t.riskLevels as any)[permit.riskLevel] || permit.riskLevel}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-9 px-4 font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl group/btn transition-all"
                                                    >
                                                        {t.common.view}
                                                        <ArrowRight className="w-4 h-4 ml-2 transform group-hover/btn:translate-x-1 transition-transform" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Summary Footer */}
                        {!loading && !error && permits.length > 0 && (
                            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                    {t.permits.showing} {permits.length} {t.permits.countSuffix}
                                </p>
                                <div className="flex items-center gap-2">
                                    <div className="bg-green-500 w-2 h-2 rounded-full"></div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{language === 'tr' ? 'Veriler Güncel' : 'Live Sync On'}</p>
                                </div>
                            </div>
                        )}
                    </Card>
                </div>
            </main>
        </div>
    );
}
