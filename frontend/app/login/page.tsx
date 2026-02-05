"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usersApi } from "@/lib/api";
import { Lock, Mail, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        // If already logged in, redirect to dashboard
        const user = usersApi.getCurrentUser();
        if (user) {
            router.push("/dashboard");
        }
    }, [router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await usersApi.login({ email, password });
            if (response.success) {
                toast.success("Giriş başarılı!");
                router.push("/dashboard");
            } else {
                toast.error(response.error || "Giriş yapılamadı.");
            }
        } catch (error: any) {
            toast.error(error.message || "Bir hata oluştu.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-gray-100">
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-2xl shadow-lg mb-6 text-white">
                        <Lock size={40} />
                    </div>
                    <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">PTW Tracker</h2>
                    <p className="mt-2 text-gray-500 font-medium">İş İzin Yönetim Sistemi</p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-semibold text-gray-700 block mb-1">E-posta</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm"
                                    placeholder="admin@ptw.local"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-semibold text-gray-700 block mb-1">Şifre</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg shadow-blue-500/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <Loader2 className="animate-spin h-5 w-5" />
                        ) : (
                            "Giriş Yap"
                        )}
                    </button>

                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start space-x-3 mt-4">
                        <AlertCircle size={20} className="text-blue-600 shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-700">
                            <p className="font-semibold mb-1">Test Bilgileri:</p>
                            <p>E-posta: <span className="font-mono text-xs">admin@ptw.local</span></p>
                            <p>Şifre: <span className="font-mono text-xs">password123</span></p>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
