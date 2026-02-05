"use client";

import { useLanguage } from '@/lib/LanguageContext';
import { User, Globe, LogOut } from 'lucide-react';
import { usersApi } from '@/lib/api';

export function Header() {
    const { t, language, setLanguage } = useLanguage();
    const user = usersApi.getCurrentUser();

    return (
        <div className="flex items-center gap-6">
            {/* Language Switcher */}
            <button
                onClick={() => setLanguage(language === 'tr' ? 'en' : 'tr')}
                className="h-10 px-4 bg-white border border-slate-200 rounded-xl flex items-center gap-3 hover:bg-slate-50 transition-all shadow-sm group"
            >
                <Globe className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
                <span className="font-black text-sm text-blue-950 tracking-wide">{language === 'tr' ? 'TR' : 'EN'}</span>
            </button>

            {/* Vertical Divider */}
            <div className="w-px h-8 bg-slate-200"></div>

            {/* User Profile */}
            <div className="flex items-center gap-3 pl-2">
                <div className="text-right hidden md:block">
                    <p className="text-sm font-black text-slate-900 leading-none mb-1">{user?.fullName || t.header.role}</p>
                    <p className="text-xs font-bold text-slate-400 capitalize">{user?.role || t.header.profile}</p>
                </div>
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-slate-200 shadow-sm text-slate-600">
                    <User className="w-5 h-5" />
                </div>

                <button
                    onClick={() => usersApi.logout()}
                    className="ml-2 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    title="Logout"
                >
                    <LogOut className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
