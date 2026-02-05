'use client';

import { useState, useEffect } from 'react';
import { usersApi } from '@/lib/api';
import { useLanguage } from '@/lib/LanguageContext';
import { Header } from '@/components/Header';
import {
    Users,
    Search,
    UserPlus,
    Shield,
    ShieldCheck,
    ShieldAlert,
    MoreVertical,
    Mail,
    Calendar,
    LayoutDashboard,
    FileText,
    MapPin,
    BarChart3,
    CheckCircle2,
    XCircle
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Toaster, toast } from 'sonner';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { format } from 'date-fns';

export default function UsersPage() {
    const { t, language } = useLanguage();
    const [users, setUsers] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        const user = usersApi.getCurrentUser();
        setCurrentUser(user);
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await usersApi.getAll();
            setUsers(res.data || []);
        } catch (err: any) {
            toast.error(language === 'tr' ? 'Kullanıcılar yüklenemedi' : 'Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleRoleUpdate = async (userId: string, newRole: string) => {
        try {
            await usersApi.update(userId, { role: newRole });
            toast.success(language === 'tr' ? 'Rol güncellendi' : 'Role updated successfully');
            fetchUsers();
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    const filteredUsers = users.filter(user =>
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const roleConfig: Record<string, { label: string, color: string, icon: any }> = {
        'admin': {
            label: language === 'tr' ? 'Yönetici' : 'Admin',
            color: 'text-purple-700 bg-purple-50 border-purple-100',
            icon: ShieldCheck
        },
        'approver': {
            label: language === 'tr' ? 'Onaylayıcı' : 'Approver',
            color: 'text-blue-700 bg-blue-50 border-blue-100',
            icon: Shield
        },
        'requester': {
            label: language === 'tr' ? 'Talep Eden' : 'Requester',
            color: 'text-amber-700 bg-amber-50 border-amber-100',
            icon: ShieldAlert
        }
    };

    if (currentUser?.role !== 'admin') {
        return (
            <AuthGuard>
                <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-center">
                    <Card className="max-w-md w-full p-8 rounded-3xl border-0 shadow-2xl">
                        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-black text-slate-900 mb-2">Unauthorized Access</h2>
                        <p className="text-slate-500 font-medium">Only administrators can access this page.</p>
                        <Button onClick={() => window.location.href = '/dashboard'} className="mt-6 bg-slate-900 text-white rounded-xl px-8 h-12 font-bold uppercase tracking-widest text-[10px]">
                            Go Back
                        </Button>
                    </Card>
                </div>
            </AuthGuard>
        );
    }

    return (
        <AuthGuard>
            <div className="min-h-screen bg-slate-50 flex font-sans">
                <Toaster position="top-right" richColors />

                {/* Sidebar (Desktop) */}
                <aside className="hidden lg:flex w-72 bg-white border-r border-slate-200 flex-col sticky top-0 h-screen">
                    <div className="p-8 pb-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">PTW<span className="text-blue-600">Admin</span></h1>
                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Management System</p>
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
                            {language === 'tr' ? 'Kullanıcılar' : 'Users'}
                        </Button>
                        <Button onClick={() => window.location.href = '/contractors'} variant="ghost" className="w-full justify-start gap-3 h-12 font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-900">
                            <ShieldAlert className="w-5 h-5" />
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

                <main className="flex-1 min-w-0 pb-20">
                    <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-30 shadow-sm shadow-slate-100/50">
                        <div>
                            <h2 className="text-lg font-black text-slate-900 tracking-tight">
                                {language === 'tr' ? 'Kullanıcı Yönetimi' : 'User Management'}
                            </h2>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">
                                {language === 'tr' ? 'Sistem erişimi ve roller' : 'System access and roles'}
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            <Header />
                            <div className="w-px h-6 bg-slate-200 mx-2"></div>
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 rounded-xl shadow-lg shadow-blue-100 gap-2 transition-all transform active:scale-95">
                                <UserPlus className="w-5 h-5" />
                                {language === 'tr' ? 'Yenı Kullanıcı' : 'New User'}
                            </Button>
                        </div>
                    </header>

                    <div className="p-8 max-w-[1400px] mx-auto space-y-8">
                        {/* Search */}
                        <Card className="border-0 shadow-lg shadow-slate-200/50 bg-white/80 backdrop-blur-xl p-4 rounded-2xl">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                <Input
                                    placeholder={language === 'tr' ? 'İsim veya e-posta ile ara...' : 'Search by name or email...'}
                                    className="pl-12 h-12 rounded-xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all font-bold text-slate-600 focus:ring-2 focus:ring-blue-500/20"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </Card>

                        {/* Users Table */}
                        <Card className="border-0 shadow-sm bg-white overflow-hidden rounded-2xl">
                            <Table>
                                <TableHeader className="bg-slate-50 border-b border-slate-100">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="py-5 px-8 text-[10px] font-black uppercase tracking-widest text-slate-400">User</TableHead>
                                        <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Role</TableHead>
                                        <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Join Date</TableHead>
                                        <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</TableHead>
                                        <TableHead className="py-5 px-8 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        [1, 2, 3, 4, 5].map(i => (
                                            <TableRow key={i} className="animate-pulse border-b border-slate-50">
                                                <TableCell colSpan={5} className="h-20 bg-white/50" />
                                            </TableRow>
                                        ))
                                    ) : (
                                        filteredUsers.map((user) => {
                                            const role = roleConfig[user.role] || roleConfig['requester'];
                                            const RoleIcon = role.icon;

                                            return (
                                                <TableRow key={user.id} className="group hover:bg-slate-50 transition-colors border-b border-slate-50/80">
                                                    <TableCell className="py-5 px-8">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-black text-xs border border-slate-200">
                                                                {user.fullName.split(' ').map((n: string) => n[0]).join('')}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-black text-slate-900 tracking-tight leading-tight">{user.fullName}</p>
                                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                                    <Mail className="w-3 h-3 text-slate-300" />
                                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user.email}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-5">
                                                        <Badge className={`${role.color} border px-3 py-1 rounded-lg font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 w-fit`}>
                                                            <RoleIcon className="w-3 h-3" />
                                                            {role.label}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="py-5">
                                                        <div className="flex items-center gap-2 text-slate-600">
                                                            <Calendar className="w-3.5 h-3.5 text-slate-300" />
                                                            <span className="text-xs font-bold tracking-tight">
                                                                {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-5 text-center">
                                                        <div className="flex items-center gap-1.5 text-green-600 bg-green-50 px-2 py-1 rounded flex shrink-0 w-fit">
                                                            <CheckCircle2 className="w-3 h-3" />
                                                            <span className="text-[9px] font-black uppercase tracking-widest">Active</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-5 px-8 text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100">
                                                                    <MoreVertical className="w-4 h-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="w-48 rounded-xl border-slate-100 shadow-xl p-2 font-sans">
                                                                <DropdownMenuLabel className="text-[9px] uppercase font-black text-slate-400 px-2 py-1.5 tracking-widest">Change Role</DropdownMenuLabel>
                                                                <DropdownMenuItem onClick={() => handleRoleUpdate(user.id, 'admin')} className="rounded-lg font-bold text-xs gap-2 py-2 cursor-pointer focus:bg-purple-50 focus:text-purple-700">
                                                                    <ShieldCheck className="w-4 h-4" /> {language === 'tr' ? 'Yönetici Yap' : 'Make Admin'}
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handleRoleUpdate(user.id, 'approver')} className="rounded-lg font-bold text-xs gap-2 py-2 cursor-pointer focus:bg-blue-50 focus:text-blue-700">
                                                                    <Shield className="w-4 h-4" /> {language === 'tr' ? 'Onaylayıcı Yap' : 'Make Approver'}
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handleRoleUpdate(user.id, 'requester')} className="rounded-lg font-bold text-xs gap-2 py-2 cursor-pointer focus:bg-amber-50 focus:text-amber-700">
                                                                    <ShieldAlert className="w-4 h-4" /> {language === 'tr' ? 'Talep Eden Yap' : 'Make Requester'}
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator className="bg-slate-50 my-1" />
                                                                <DropdownMenuItem className="rounded-lg font-bold text-xs gap-2 py-2 cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700">
                                                                    <XCircle className="w-4 h-4" /> {language === 'tr' ? 'Devre Dışı Bırak' : 'Deactivate'}
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </Card>
                    </div>
                </main>
            </div>
        </AuthGuard>
    );
}
