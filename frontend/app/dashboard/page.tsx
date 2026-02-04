'use client';

import { useState, useEffect, useMemo } from 'react';
import { permitsApi } from '@/lib/api';
import { useLanguage } from '@/lib/LanguageContext';
import { Header } from '@/components/Header';
import { socket } from '@/lib/socket';
import { toast, Toaster } from 'sonner';
import {
    Bell,
    FileText,
    Plus,
    LayoutDashboard,
    Users,
    MapPin,
    BarChart3,
    Clock,
    CheckCircle2,
    Activity,
    Search
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PermitList } from '@/components/PermitList';
import { SearchAndFilter, FilterOptions } from '@/components/SearchAndFilter';
import { NotificationSystem, clearOldNotifications } from '@/components/NotificationSystem';
import { KanbanBoard } from '@/components/KanbanBoard';
import { ExportMenu } from '@/components/ExportMenu';
import { LayoutGrid, List } from 'lucide-react';

export default function DashboardPage() {
    const { t, language } = useLanguage();
    const [stats, setStats] = useState<any>(null);
    const [permits, setPermits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [activeTab, setActiveTab] = useState('all');
    const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
    const [filters, setFilters] = useState<FilterOptions>({
        searchQuery: '',
        location: 'all',
        contractor: 'all',
        permitType: 'all',
    });

    useEffect(() => {
        fetchDashboardData();
        clearOldNotifications();

        // Socket Listeners
        socket.on('new_permit', (data) => {
            fetchDashboardData(); // Refresh all
            toast.success(language === 'tr' ? 'Yeni İzin Oluşturuldu' : 'New Permit Created', {
                description: `${data.permitNumber} - ${data.locationName}`,
                icon: <Plus className="w-5 h-5 text-green-500" />
            });
        });

        socket.on('permit_updated', (data) => {
            fetchDashboardData();
            toast.info(language === 'tr' ? 'İzin Güncellendi' : 'Permit Updated', {
                description: `${data.permitNumber} durumu: ${data.status}`,
                icon: <Activity className="w-5 h-5 text-blue-500" />
            });
        });

        socket.on('permit_expiring_soon', (data) => {
            toast.warning(language === 'tr' ? 'Süresi Doluyor!' : 'Expiring Soon!', {
                description: `${data.permitNumber} nolu iznin süresi dolmak üzere.`,
                icon: <Clock className="w-5 h-5 text-amber-500" />,
                duration: 0, // Persistent
            });
        });

        return () => {
            socket.off('new_permit');
            socket.off('permit_updated');
            socket.off('permit_expiring_soon');
        };
    }, [language]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [statsRes, permitsRes] = await Promise.all([
                permitsApi.getStats(),
                permitsApi.getAll()
            ]);
            setStats(statsRes.data);
            setPermits(permitsRes.data);
        } catch (err: any) {
            setError(err.message || 'Failed to load dashboard');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id: string, status: string) => {
        try {
            await permitsApi.update(id, { status });
            // Socket will trigger refresh
        } catch (err: any) {
            toast.error('Update failed: ' + err.message);
        }
    };

    const filteredPermits = useMemo(() => {
        let result = permits;

        // Tab Filter
        if (activeTab !== 'all') {
            result = result.filter(p => p.status.toLowerCase() === activeTab);
        }

        // Search Filter
        if (filters.searchQuery) {
            const query = filters.searchQuery.toLowerCase();
            result = result.filter(p =>
                p.permitNumber?.toLowerCase().includes(query) ||
                p.description?.toLowerCase().includes(query) ||
                p.contractorName?.toLowerCase().includes(query) ||
                p.locationName?.toLowerCase().includes(query)
            );
        }

        // Location Filter
        if (filters.location !== 'all') {
            result = result.filter(p => p.locationName === filters.location);
        }

        // Contractor Filter
        if (filters.contractor !== 'all') {
            result = result.filter(p => p.contractorName === filters.contractor);
        }

        // Type Filter
        if (filters.permitType !== 'all') {
            result = result.filter(p => p.ptwType === filters.permitType);
        }

        return result;
    }, [permits, activeTab, filters]);

    const counts = useMemo(() => ({
        all: permits.length,
        pending: permits.filter(p => p.status.toLowerCase() === 'pending').length,
        active: permits.filter(p => p.status.toLowerCase() === 'active').length,
        completed: permits.filter(p => p.status.toLowerCase() === 'completed').length,
    }), [permits]);

    if (loading && permits.length === 0) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-medium">{t.dashboard.loadingDashboard}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex">
            <Toaster position="top-right" richColors />
            <NotificationSystem permits={permits} />

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
                    <Button variant="ghost" className="w-full justify-start gap-3 h-12 font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-700">
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
            <main className="flex-1 min-w-0 pb-12">
                {/* Header */}
                <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-30 shadow-sm shadow-slate-100/50">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        {t.dashboard.subtitle}
                        <div className="bg-green-500 w-2 h-2 rounded-full animate-pulse"></div>
                    </h2>
                    <div className="flex items-center gap-6">
                        <Header />
                    </div>
                </header>

                <div className="p-8 max-w-7xl mx-auto">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                        <Card className="border-0 shadow-sm bg-white overflow-hidden group">
                            <CardContent className="p-6 relative">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500"></div>
                                <div className="relative">
                                    <div className="bg-blue-100 w-12 h-12 rounded-xl flex items-center justify-center text-blue-600 mb-4 shadow-sm shadow-blue-100">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">{t.dashboard.totalPermits}</p>
                                    <div className="flex items-end gap-2">
                                        <p className="text-3xl font-black text-slate-900 leading-none">{stats?.totalPermits || 0}</p>
                                        <Badge variant="outline" className="bg-blue-50 border-blue-100 text-blue-600 font-bold mb-0.5 whitespace-nowrap">
                                            {t.dashboard.allTime}
                                        </Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-sm bg-white overflow-hidden group">
                            <CardContent className="p-6 relative">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500"></div>
                                <div className="relative">
                                    <div className="bg-green-100 w-12 h-12 rounded-xl flex items-center justify-center text-green-600 mb-4 shadow-sm shadow-green-100">
                                        <Activity className="w-6 h-6" />
                                    </div>
                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">{t.dashboard.activePermits}</p>
                                    <div className="flex items-end gap-2">
                                        <p className="text-3xl font-black text-slate-900 leading-none">{stats?.activePermits || 0}</p>
                                        <Badge variant="outline" className="bg-green-50 border-green-100 text-green-600 font-bold mb-0.5 whitespace-nowrap">
                                            {t.dashboard.currentlyActive}
                                        </Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-sm bg-white overflow-hidden group">
                            <CardContent className="p-6 relative">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500"></div>
                                <div className="relative">
                                    <div className="bg-amber-100 w-12 h-12 rounded-xl flex items-center justify-center text-amber-600 mb-4 shadow-sm shadow-amber-100">
                                        <Clock className="w-6 h-6" />
                                    </div>
                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">{t.dashboard.pendingApprovals}</p>
                                    <div className="flex items-end gap-2">
                                        <p className="text-3xl font-black text-slate-900 leading-none">{stats?.pendingApprovals || 0}</p>
                                        <Badge variant="outline" className="bg-amber-50 border-amber-100 text-amber-600 font-bold mb-0.5 whitespace-nowrap">
                                            {t.dashboard.awaitingApproval}
                                        </Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-sm bg-white overflow-hidden group">
                            <CardContent className="p-6 relative">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500"></div>
                                <div className="relative">
                                    <div className="bg-slate-100 w-12 h-12 rounded-xl flex items-center justify-center text-slate-600 mb-4 shadow-sm shadow-slate-100">
                                        <CheckCircle2 className="w-6 h-6" />
                                    </div>
                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">{t.dashboard.completedPermits}</p>
                                    <div className="flex items-end gap-2">
                                        <p className="text-3xl font-black text-slate-900 leading-none">{stats?.completedPermits || 0}</p>
                                        <Badge variant="outline" className="bg-slate-50 border-slate-100 text-slate-600 font-bold mb-0.5 whitespace-nowrap">
                                            {t.dashboard.successfullyCompleted}
                                        </Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Controls Bar */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
                        <div className="flex-1">
                            <div className="flex items-center justify-between gap-4 mb-4">
                                <SearchAndFilter
                                    filters={filters}
                                    onFiltersChange={setFilters}
                                    permits={permits}
                                />
                            </div>
                        </div>
                        <Button
                            onClick={() => window.location.href = '/permits/new'}
                            size="lg"
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 px-8 rounded-xl shadow-lg shadow-blue-200 flex items-center gap-3 transition-all active:scale-95"
                        >
                            <Plus className="w-5 h-5" />
                            {t.dashboard.newPermit}
                        </Button>
                    </div>

                    {/* Content Tabs */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                            <TabsList className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 h-12 inline-flex">
                                <TabsTrigger value="all" className="rounded-lg font-bold px-6 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all">
                                    {t.common.all} <span className="ml-1.5 opacity-60 font-medium">({counts.all})</span>
                                </TabsTrigger>
                                <TabsTrigger value="pending" className="rounded-lg font-bold px-6 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all">
                                    {t.statuses.pending} <span className="ml-1.5 opacity-60 font-medium">({counts.pending})</span>
                                </TabsTrigger>
                                <TabsTrigger value="active" className="rounded-lg font-bold px-6 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all">
                                    {t.statuses.active} <span className="ml-1.5 opacity-60 font-medium">({counts.active})</span>
                                </TabsTrigger>
                                <TabsTrigger value="completed" className="rounded-lg font-bold px-6 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all">
                                    {t.statuses.completed} <span className="ml-1.5 opacity-60 font-medium">({counts.completed})</span>
                                </TabsTrigger>
                            </TabsList>

                            <div className="flex items-center gap-3">
                                <div className="flex bg-white border border-slate-200 p-1 rounded-xl shadow-sm h-12 items-center">
                                    <Button
                                        variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                                        size="sm"
                                        onClick={() => setViewMode('list')}
                                        className={`rounded-lg px-4 h-9 font-bold transition-all ${viewMode === 'list' ? 'bg-slate-100 text-blue-600' : 'text-slate-500'}`}
                                    >
                                        <List className="w-4 h-4 mr-2" />
                                        List
                                    </Button>
                                    <Button
                                        variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
                                        size="sm"
                                        onClick={() => setViewMode('kanban')}
                                        className={`rounded-lg px-4 h-9 font-bold transition-all ${viewMode === 'kanban' ? 'bg-slate-100 text-blue-600' : 'text-slate-500'}`}
                                    >
                                        <LayoutGrid className="w-4 h-4 mr-2" />
                                        Kanban
                                    </Button>
                                </div>
                                <ExportMenu permits={filteredPermits} />
                            </div>
                        </div>

                        <TabsContent value={activeTab} className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                            {viewMode === 'list' ? (
                                <PermitList
                                    permits={filteredPermits}
                                    onSelectPermit={(p) => window.location.href = `/permits/${p.id}`}
                                    onUpdateStatus={handleUpdateStatus}
                                />
                            ) : (
                                <KanbanBoard
                                    permits={filteredPermits}
                                    onSelectPermit={(p) => window.location.href = `/permits/${p.id}`}
                                    onUpdateStatus={handleUpdateStatus}
                                />
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </main>
        </div>
    );
}
