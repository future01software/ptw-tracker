'use client';

import React, { useEffect } from 'react';
import { toast } from 'sonner';
import { differenceInHours, differenceInMinutes, isPast } from 'date-fns';
import { AlertTriangle, Clock, CheckCircle, Bell } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

interface NotificationSystemProps {
    permits: any[];
}

export function NotificationSystem({ permits }: NotificationSystemProps) {
    const { language } = useLanguage();

    useEffect(() => {
        const checkNotifications = () => {
            const now = new Date();

            permits.forEach(permit => {
                const startDate = new Date(permit.validFrom);
                const endDate = new Date(permit.validUntil);

                // Check for expiring permits (active permits ending within 1 hour)
                if (permit.status.toLowerCase() === 'active') {
                    const minutesUntilExpiry = differenceInMinutes(endDate, now);

                    if (minutesUntilExpiry > 0 && minutesUntilExpiry <= 60) {
                        const notificationKey = `notification_expiring_${permit.id}_${endDate.getTime()}`;
                        if (!localStorage.getItem(notificationKey)) {
                            toast.warning(language === 'tr' ? 'İzin Süresi Doluyor' : 'Permit Expiring Soon', {
                                description: language === 'tr'
                                    ? `${permit.permitNumber} nolu iznin süresi ${minutesUntilExpiry} dakika içinde dolacak.`
                                    : `${permit.permitNumber} expires in ${minutesUntilExpiry} minutes`,
                                icon: <Clock className="w-5 h-5" />,
                                duration: 10000,
                            });
                            localStorage.setItem(notificationKey, 'shown');
                        }
                    }

                    // Check for expired permits
                    if (isPast(endDate)) {
                        const notificationKey = `notification_expired_${permit.id}_${endDate.getTime()}`;
                        if (!localStorage.getItem(notificationKey)) {
                            toast.error(language === 'tr' ? 'İzin Süresi Doldu' : 'Permit Expired', {
                                description: language === 'tr'
                                    ? `${permit.permitNumber} nolu iznin geçerlilik süresi dolmuştur.`
                                    : `${permit.permitNumber} has expired`,
                                icon: <AlertTriangle className="w-5 h-5" />,
                                duration: 15000,
                            });
                            localStorage.setItem(notificationKey, 'shown');
                        }
                    }
                }

                // Check for pending approvals
                if (permit.status.toLowerCase() === 'pending') {
                    const createdAt = new Date(permit.createdAt);
                    const hoursSinceCreation = differenceInHours(now, createdAt);

                    if (hoursSinceCreation >= 4) {
                        const notificationKey = `notification_pending_${permit.id}_${createdAt.getTime()}`;
                        if (!localStorage.getItem(notificationKey)) {
                            toast.info(language === 'tr' ? 'Onay Bekliyor' : 'Pending Approval', {
                                description: language === 'tr'
                                    ? `${permit.permitNumber} nolu izin ${hoursSinceCreation} saattir onay bekliyor.`
                                    : `${permit.permitNumber} has been pending for ${hoursSinceCreation} hours`,
                                icon: <Bell className="w-5 h-5" />,
                                duration: 10000,
                            });
                            localStorage.setItem(notificationKey, 'shown');
                        }
                    }
                }
            });
        };

        checkNotifications();
        const interval = setInterval(checkNotifications, 60000);
        return () => clearInterval(interval);
    }, [permits, language]);

    return null;
}

export function clearOldNotifications() {
    if (typeof window === 'undefined') return;
    const keys = Object.keys(localStorage);
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);

    keys.forEach(key => {
        if (key.startsWith('notification_')) {
            const parts = key.split('_');
            const timestamp = parseInt(parts[parts.length - 1]);
            if (timestamp && timestamp < oneDayAgo) {
                localStorage.removeItem(key);
            }
        }
    });
}
