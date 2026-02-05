'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { analyticsApi, usersApi } from '@/lib/api';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import {
    LayoutDashboard,
    FileText,
    Users,
    MapPin,
    BarChart3,
    ArrowRight,
    TrendingUp,
    ShieldAlert,
    Activity,
    Calendar,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Toaster, toast } from 'sonner';
import { AuthGuard } from '@/components/auth/AuthGuard';

export default function AnalyticsPage() {
    const { t, language } = useLanguage();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        const user = usersApi.getCurrentUser();
        setCurrentUser(user);
    }, []);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const res = await analyticsApi.getSummary();
            setData(res.data);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch analytics');
            toast.error(language === 'tr' ? 'Analitik verileri yüklenemedi' : 'Failed to fetch analytics');
        } finally {
            setLoading(false);
        }
    };

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'];

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">{t.common.loading}...</p>
            </div>
        </div>
    );

    const statusData = data?.byStatus?.map((s: any) => ({
        name: (t.statuses as any)[s.status.toLowerCase()] || s.status,
        value: s._count
    })) || [];

    const riskData = data?.byRisk?.map((r: any) => ({
        name: (t.riskLevels as any)[r.riskLevel] || r.riskLevel,
        count: r._count
    })) || [];

    const trendData = Object.entries(data?.monthlyTrend || {}).map(([month, count]) => ({
        month,
        count
    }));

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
                        {currentUser?.role === 'admin' && (
                            <Button onClick={() => window.location.href = '/users'} variant="ghost" className="w-full justify-start gap-3 h-12 font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-900">
                                <Users className="w-5 h-5" />
                                {language === 'tr' ? 'Kullanıcılar' : 'Users'}
                            </Button>
                        )}
                        <Button variant="ghost" className="w-full justify-start gap-3 h-12 font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-700">
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
                                {language === 'tr' ? 'Analitik' : 'Analytics'}
                            </h2>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">
                                {language === 'tr' ? 'Sistem Performans Verileri' : 'System Performance Data'}
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            <LanguageSwitcher />
                            <div className="w-px h-6 bg-slate-200 mx-2"></div>
                            <Button variant="outline" className="h-10 border-slate-200 font-bold rounded-xl text-blue-600 hover:bg-blue-50 gap-2">
                                <TrendingUp className="w-4 h-4" />
                                {language === 'tr' ? 'Rapor İndir' : 'Download Report'}
                            </Button>
                        </div>
                    </header>

                    <div className="p-8 max-w-[1400px] mx-auto space-y-8">

                        {/* Hero Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <Card className="border-0 shadow-sm bg-blue-600 text-white p-6 rounded-3xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 -mr-12 -mt-12 rounded-full transition-transform group-hover:scale-125 duration-700"></div>
                                <Activity className="w-8 h-8 opacity-20 absolute bottom-6 right-6" />
                                <p className="text-xs font-black uppercase tracking-widest opacity-60 mb-1">{language === 'tr' ? 'Toplam İzin' : 'Total Permits'}</p>
                                <h3 className="text-4xl font-black mb-4">{data.totalPermits}</h3>
                                <div className="flex items-center gap-2 bg-white/10 w-fit px-2 py-1 rounded-lg">
                                    <ArrowUpRight className="w-3 h-3" />
                                    <span className="text-[10px] font-bold">+12.5%</span>
                                </div>
                            </Card>

                            <Card className="border-0 shadow-sm bg-white p-6 rounded-3xl border border-slate-100 relative group">
                                <ShieldAlert className="w-8 h-8 text-red-100 absolute bottom-6 right-6 group-hover:text-red-500 transition-colors duration-500" />
                                <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">{language === 'tr' ? 'Yüksek Risk' : 'High Risk'}</p>
                                <h3 className="text-4xl font-black text-slate-900 mb-4">{riskData.find((r: any) => r.name === t.riskLevels.High)?.count || 0}</h3>
                                <div className="flex items-center gap-2 text-red-600">
                                    <ArrowUpRight className="w-3 h-3" />
                                    <span className="text-[10px] font-bold">+2 today</span>
                                </div>
                            </Card>

                            <Card className="border-0 shadow-sm bg-white p-6 rounded-3xl border border-slate-100 relative group">
                                <Calendar className="w-8 h-8 text-slate-100 absolute bottom-6 right-6 group-hover:text-blue-500 transition-colors duration-500" />
                                <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">{language === 'tr' ? 'Ortalama Süre' : 'Average Duration'}</p>
                                <h3 className="text-4xl font-black text-slate-900 mb-4">4.2h</h3>
                                <div className="flex items-center gap-2 text-green-600">
                                    <ArrowDownRight className="w-3 h-3" />
                                    <span className="text-[10px] font-bold">-0.5h from avg</span>
                                </div>
                            </Card>

                            <Card className="border-0 shadow-sm bg-white p-6 rounded-3xl border border-slate-100 relative group">
                                <Users className="w-8 h-8 text-slate-100 absolute bottom-6 right-6 group-hover:text-slate-900 transition-colors duration-500" />
                                <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">{language === 'tr' ? 'Katılımcı Yüklenici' : 'Active Contractors'}</p>
                                <h3 className="text-4xl font-black text-slate-900 mb-4">{data.byContractor?.length || 0}</h3>
                                <div className="flex items-center gap-2 text-blue-600">
                                    <ArrowUpRight className="w-3 h-3" />
                                    <span className="text-[10px] font-bold">Stable</span>
                                </div>
                            </Card>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Trend Chart */}
                            <Card className="border-0 shadow-xl shadow-slate-200/50 bg-white rounded-3xl p-8">
                                <div className="flex justify-between items-center mb-10">
                                    <div>
                                        <h3 className="text-lg font-black text-slate-900 tracking-tight">{language === 'tr' ? 'İzin Oluşturma Trendi' : 'Permit Creation Trend'}</h3>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Growth over time</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                                            <span className="text-[10px] font-black uppercase text-slate-400">Activity</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="h-[350px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={trendData}>
                                            <defs>
                                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis
                                                dataKey="month"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                                                dy={10}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                                            />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="count"
                                                stroke="#3b82f6"
                                                strokeWidth={4}
                                                fillOpacity={1}
                                                fill="url(#colorCount)"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>

                            {/* Status Chart */}
                            <Card className="border-0 shadow-xl shadow-slate-200/50 bg-white rounded-3xl p-8">
                                <div className="flex justify-between items-center mb-10">
                                    <div>
                                        <h3 className="text-lg font-black text-slate-900 tracking-tight">{language === 'tr' ? 'Durum Dağılımı' : 'Status Distribution'}</h3>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Workflow breakdown</p>
                                    </div>
                                </div>
                                <div className="flex items-center h-[350px]">
                                    <div className="flex-1 h-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={statusData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={80}
                                                    outerRadius={110}
                                                    paddingAngle={8}
                                                    dataKey="value"
                                                >
                                                    {statusData.map((entry: any, index: number) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="space-y-4 pr-4">
                                        {statusData.map((s: any, i: number) => (
                                            <div key={i} className="flex items-center gap-3">
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black uppercase text-slate-400 leading-none mb-1">{s.name}</span>
                                                    <span className="text-sm font-black text-slate-900 leading-none">{s.value}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </Card>

                            {/* Risk Levels Chart */}
                            <Card className="border-0 shadow-xl shadow-slate-200/50 bg-white rounded-3xl p-8 lg:col-span-2">
                                <div className="flex justify-between items-center mb-10">
                                    <div>
                                        <h3 className="text-lg font-black text-slate-900 tracking-tight">{language === 'tr' ? 'Risk Seviyeleri Analizi' : 'Risk Level Analysis'}</h3>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Safety rating breakdown</p>
                                    </div>
                                </div>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={riskData} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                                            <XAxis type="number" hide />
                                            <YAxis
                                                dataKey="name"
                                                type="category"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 11, fontWeight: 800, fill: '#1e293b' }}
                                                width={100}
                                            />
                                            <Tooltip
                                                cursor={{ fill: '#f8fafc' }}
                                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                                            />
                                            <Bar dataKey="count" radius={[0, 10, 10, 0]} barSize={40}>
                                                {riskData.map((entry: any, index: number) => {
                                                    let color = '#3b82f6'; // Low
                                                    if (entry.name === t.riskLevels.High) color = '#ef4444';
                                                    if (entry.name === t.riskLevels.Medium) color = '#f59e0b';
                                                    return <Cell key={`cell-${index}`} fill={color} />;
                                                })}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>
                        </div>
                    </div>
                </main>
            </div>
        </AuthGuard>
    );
}
