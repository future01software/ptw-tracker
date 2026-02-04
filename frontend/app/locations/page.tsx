'use client';

import { useState, useEffect } from 'react';
import { locationsApi, permitsApi } from '@/lib/api';
import { useLanguage } from '@/lib/LanguageContext';
import { Header } from '@/components/Header';
import {
    MapPin,
    Search,
    Plus,
    Building,
    Layers,
    Navigation2,
    LayoutDashboard,
    FileText,
    Users,
    BarChart3,
    ArrowRight,
    AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Toaster, toast } from 'sonner';
import { LocationModal } from '@/components/LocationModal';

export default function LocationsPage() {
    const { t, language } = useLanguage();
    const [searchTerm, setSearchTerm] = useState('');
    const [locations, setLocations] = useState<any[]>([]);
    const [permits, setPermits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

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
            const [locationsRes, permitsRes] = await Promise.all([
                locationsApi.getAll(searchTerm),
                permitsApi.getAll({})
            ]);
            setLocations(locationsRes.data || []);
            setPermits(permitsRes.data || []);
        } catch (err: any) {
            toast.error(t.locations.failedToLoad);
        } finally {
            setLoading(false);
        }
    };

    const getLocationStats = (locationName: string, id: number) => {
        const locationPermits = permits.filter(p => p.locationName === locationName || p.locationId === id);
        const activePermits = locationPermits.filter(p => p.status.toLowerCase() === 'active').length;
        const totalPermits = locationPermits.length;
        return { activePermits, totalPermits };
    };

    const riskLevelConfig: Record<string, { color: string, bg: string, border: string }> = {
        'High': { color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-100' },
        'Medium': { color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-100' },
        'Low': { color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-100' },
    };

    return (
        <div className="min-h-screen bg-slate-50 flex font-sans">
            <Toaster position="top-right" richColors />
            <LocationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchData}
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
                    <Button onClick={() => window.location.href = '/contractors'} variant="ghost" className="w-full justify-start gap-3 h-12 font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-900">
                        <Users className="w-5 h-5" />
                        {t.contractors.title}
                    </Button>
                    <Button variant="ghost" className="w-full justify-start gap-3 h-12 font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-700">
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
                            {t.locations.title}
                        </h2>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">
                            {t.locations.subtitle}
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
                            {t.locations.addLocation}
                        </Button>
                    </div>
                </header>

                <div className="p-8 max-w-[1400px] mx-auto space-y-8">
                    {/* Search Bar */}
                    <Card className="border-0 shadow-lg shadow-slate-200/50 bg-white/80 backdrop-blur-xl p-4 rounded-2xl">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            <Input
                                placeholder={t.locations.searchPlaceholder}
                                className="pl-12 h-12 rounded-xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all font-bold text-slate-600 focus:ring-2 focus:ring-blue-500/20"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </Card>

                    {/* Locations Table */}
                    <Card className="border-0 shadow-sm bg-white overflow-hidden rounded-2xl">
                        <Table>
                            <TableHeader className="bg-slate-50 border-b border-slate-100">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="py-5 px-8 text-[10px] font-black uppercase tracking-widest text-slate-400">{t.common.location}</TableHead>
                                    <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">{t.locations.building}</TableHead>
                                    <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">{t.locations.zone}</TableHead>
                                    <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">{t.locations.riskLevel}</TableHead>
                                    <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">{t.locations.activePermits}</TableHead>
                                    <TableHead className="py-5 px-8 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">{t.common.actions}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    [1, 2, 3, 4, 5].map(i => (
                                        <TableRow key={i} className="animate-pulse border-b border-slate-50">
                                            <TableCell colSpan={6} className="h-20 bg-white/50" />
                                        </TableRow>
                                    ))
                                ) : (
                                    locations.map((location) => {
                                        const stats = getLocationStats(location.name, location.id);
                                        const risk = riskLevelConfig[location.riskLevel] || { color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-100' };

                                        return (
                                            <TableRow key={location.id} className="group hover:bg-slate-50 transition-colors border-b border-slate-50/80 cursor-pointer">
                                                <TableCell className="py-5 px-8">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-500 flex items-center justify-center border border-slate-100 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm">
                                                            <Navigation2 className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-slate-900 tracking-tight leading-tight group-hover:text-blue-600 transition-colors">{location.name}</p>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[200px] mt-0.5">
                                                                {location.description || `${location.floor} - ${location.zone}`}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-5">
                                                    <div className="flex items-center gap-2">
                                                        <Building className="w-3.5 h-3.5 text-slate-300" />
                                                        <span className="text-sm font-bold text-slate-600">{location.building}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-5">
                                                    <div className="flex items-center gap-2">
                                                        <Layers className="w-3.5 h-3.5 text-slate-300" />
                                                        <span className="text-sm font-bold text-slate-600">{location.zone}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-5">
                                                    <Badge className={`
                                                        ${risk.bg} ${risk.color} ${risk.border}
                                                        border px-3 py-1 rounded-lg font-black text-[10px] uppercase tracking-wider shadow-sm
                                                    `}>
                                                        {(t.riskLevels as any)[location.riskLevel] || location.riskLevel}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex -space-x-1.5">
                                                            {[...Array(Math.min(stats.activePermits, 3))].map((_, i) => (
                                                                <div key={i} className="w-7 h-7 rounded-full border-2 border-white bg-blue-100 text-blue-600 flex items-center justify-center text-[9px] font-black group-hover:translate-y-[-2px] transition-transform">
                                                                    P
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-slate-900 leading-none">{stats.activePermits}</p>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">
                                                                {language === 'tr' ? `${stats.totalPermits} Toplam` : `${stats.totalPermits} Total`}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-5 px-8 text-right">
                                                    <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button variant="ghost" size="sm" className="h-9 rounded-xl font-bold text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all">
                                                            {t.common.edit}
                                                        </Button>
                                                        <Button size="sm" className="h-9 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[10px] tracking-widest px-4 shadow-lg shadow-blue-100 group-hover:scale-105 transition-all gap-2">
                                                            {t.common.view}
                                                            <ArrowRight className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </Card>

                    {!loading && locations.length === 0 && (
                        <Card className="border-0 shadow-sm bg-white p-20 text-center rounded-3xl">
                            <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Building className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 mb-2 tracking-tight">{t.locations.noResults}</h3>
                            <p className="text-slate-400 font-medium text-sm">{t.permits.noResultsHint}</p>
                        </Card>
                    )}
                </div>
            </main>
        </div>
    );
}
