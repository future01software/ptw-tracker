'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Calendar, MapPin, User, Eye, CheckCircle, Play, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { useLanguage } from '@/lib/LanguageContext';

interface PermitListProps {
    permits: any[];
    onSelectPermit: (permit: any) => void;
    onUpdateStatus?: (permitId: string, newStatus: string) => void;
}

export function PermitList({ permits, onSelectPermit, onUpdateStatus }: PermitListProps) {
    const { t, language } = useLanguage();

    const statusColors: Record<string, string> = {
        'pending': 'bg-amber-100 text-amber-800 border-amber-200',
        'approved': 'bg-green-100 text-green-800 border-green-200',
        'active': 'bg-blue-100 text-blue-800 border-blue-200',
        'completed': 'bg-slate-100 text-slate-800 border-slate-200',
        'expired': 'bg-red-100 text-red-800 border-red-200',
        'rejected': 'bg-red-100 text-red-800 border-red-200',
        'draft': 'bg-slate-100 text-slate-600 border-slate-200',
    };

    const riskColors: Record<string, string> = {
        'high': 'text-red-600',
        'medium': 'text-amber-600',
        'low': 'text-green-600',
    };

    if (permits.length === 0) {
        return (
            <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-slate-200">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-50 rounded-full mb-4">
                    <AlertTriangle className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">
                    {language === 'tr' ? 'İzin bulunamadı' : 'No permits found'}
                </h3>
                <p className="text-slate-500">
                    {language === 'tr' ? 'Bu kriterlere uygun çalışma izni mevcut değil.' : 'There are no permits matching these criteria.'}
                </p>
            </div>
        );
    }

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {permits.map(permit => (
                <Card key={permit.id} className="group hover:shadow-xl transition-all duration-300 border-slate-200 overflow-hidden flex flex-col">
                    <CardHeader className="pb-4">
                        <div className="flex items-start justify-between mb-3">
                            <Badge variant="outline" className={`${statusColors[permit.status.toLowerCase()] || 'bg-slate-100'} border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider`}>
                                {(t.statuses as any)[permit.status.toLowerCase()] || permit.status}
                            </Badge>
                            <div className={`flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider ${riskColors[permit.riskLevel.toLowerCase()]}`}>
                                <AlertTriangle className="w-3 h-3" />
                                {(t.riskLevels as any)[permit.riskLevel.toLowerCase()] || permit.riskLevel}
                            </div>
                        </div>
                        <CardTitle className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                            {permit.permitNumber}
                        </CardTitle>
                        <CardDescription className="text-sm font-medium text-slate-500">
                            {(t.permitTypes as any)[permit.ptwType] || permit.ptwType}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-between">
                        <div className="space-y-3 mb-6">
                            <div className="flex items-center gap-2.5 text-sm text-slate-600">
                                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                                    <MapPin className="w-4 h-4 text-slate-400" />
                                </div>
                                <span className="font-medium">{permit.locationName}</span>
                            </div>
                            <div className="flex items-center gap-2.5 text-sm text-slate-600">
                                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                                    <User className="w-4 h-4 text-slate-400" />
                                </div>
                                <span className="font-medium">{permit.contractorName}</span>
                            </div>
                            <div className="flex items-center gap-2.5 text-sm text-slate-600">
                                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                                    <Calendar className="w-4 h-4 text-slate-400" />
                                </div>
                                <span className="font-medium">
                                    {format(new Date(permit.validUntil), 'dd MMM yyyy, HH:mm')}
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 font-semibold border-slate-200 hover:bg-slate-50"
                                onClick={() => onSelectPermit(permit)}
                            >
                                <Eye className="w-4 h-4 mr-2" />
                                {t.common.view}
                            </Button>

                            {onUpdateStatus && permit.status === 'pending' && (
                                <Button
                                    size="sm"
                                    className="flex-1 font-semibold bg-green-600 hover:bg-green-700 text-white shadow-sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onUpdateStatus(permit.id, 'active');
                                    }}
                                >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    {language === 'tr' ? 'Onayla' : 'Approve'}
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
