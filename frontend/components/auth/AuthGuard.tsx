"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { usersApi } from "@/lib/api";
import { Loader2 } from "lucide-react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        const authCheck = () => {
            const user = usersApi.getCurrentUser();
            if (!user) {
                setAuthorized(false);
                router.push(`/login?returnUrl=${encodeURIComponent(pathname)}`);
            } else {
                setAuthorized(true);
            }
        };

        authCheck();
    }, [router, pathname]);

    if (!authorized) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Loader2 className="animate-spin h-10 w-10 text-blue-600" />
            </div>
        );
    }

    return <>{children}</>;
}
