'use client';

import React from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Search, Filter, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Label } from './ui/label';
// import { Calendar } from './ui/calendar'; // Skipping for now to avoid potential component issues
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { useLanguage } from '@/lib/LanguageContext';

export interface FilterOptions {
    searchQuery: string;
    location: string;
    contractor: string;
    permitType: string;
}

interface SearchAndFilterProps {
    filters: FilterOptions;
    onFiltersChange: (filters: FilterOptions) => void;
    permits: any[];
}

export function SearchAndFilter({ filters, onFiltersChange, permits }: SearchAndFilterProps) {
    const { t, language } = useLanguage();
    const [isFilterOpen, setIsFilterOpen] = React.useState(false);

    // Get unique locations and contractors for dropdowns
    const uniqueLocations = Array.from(new Set(permits.map(p => p.locationName))).sort();
    const uniqueContractors = Array.from(new Set(permits.map(p => p.contractorName))).sort();

    const handleSearchChange = (value: string) => {
        onFiltersChange({ ...filters, searchQuery: value });
    };

    const clearFilters = () => {
        onFiltersChange({
            searchQuery: '',
            location: 'all',
            contractor: 'all',
            permitType: 'all',
        });
    };

    const activeFiltersCount = [
        filters.location !== 'all',
        filters.contractor !== 'all',
        filters.permitType !== 'all',
    ].filter(Boolean).length;

    const permitTypes = [
        { value: 'all', label: language === 'tr' ? 'Tüm Türler' : 'All Types' },
        { value: 'Hot Work', label: t.permitTypes['Hot Work'] },
        { value: 'Cold Work', label: t.permitTypes['Cold Work'] },
        { value: 'Electrical', label: t.permitTypes['Electrical'] },
        { value: 'Confined Space', label: t.permitTypes['Confined Space'] },
        { value: 'Working at Heights', label: t.permitTypes['Working at Heights'] },
    ];

    return (
        <div className="space-y-4">
            <div className="flex gap-4">
                <div className="flex-1 relative group">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <Input
                        placeholder={language === 'tr' ? "İzin no, açıklama veya yüklenici ile ara..." : "Search by permit no, description, or contractor..."}
                        value={filters.searchQuery}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="pl-11 h-12 bg-white border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
                    />
                </div>

                <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="h-12 px-6 rounded-xl border-slate-200 hover:bg-slate-50 font-semibold gap-2 transition-all">
                            <Filter className="w-4 h-4" />
                            {language === 'tr' ? 'Filtreler' : 'Filters'}
                            {activeFiltersCount > 0 && (
                                <Badge className="ml-1 bg-blue-600 text-white border-0 px-2 py-0.5 text-[11px] font-bold">
                                    {activeFiltersCount}
                                </Badge>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[320px] p-6 rounded-2xl shadow-2xl border-slate-100" align="end">
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-slate-900">{language === 'tr' ? 'İzinleri Filtrele' : 'Filter Permits'}</h3>
                                {activeFiltersCount > 0 && (
                                    <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-2 rounded-lg">
                                        <X className="w-4 h-4 mr-1" />
                                        {language === 'tr' ? 'Temizle' : 'Clear'}
                                    </Button>
                                )}
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">{language === 'tr' ? 'İzin Türü' : 'Permit Type'}</Label>
                                    <Select value={filters.permitType} onValueChange={(v) => onFiltersChange({ ...filters, permitType: v })}>
                                        <SelectTrigger className="rounded-xl border-slate-200 h-10">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {permitTypes.map(type => (
                                                <SelectItem key={type.value} value={type.value}>
                                                    {type.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">{language === 'tr' ? 'Lokasyon' : 'Location'}</Label>
                                    <Select value={filters.location} onValueChange={(v) => onFiltersChange({ ...filters, location: v })}>
                                        <SelectTrigger className="rounded-xl border-slate-200 h-10">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">{language === 'tr' ? 'Tüm Lokasyonlar' : 'All Locations'}</SelectItem>
                                            {uniqueLocations.map(loc => (
                                                <SelectItem key={loc} value={loc}>
                                                    {loc}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">{language === 'tr' ? 'Yüklenici' : 'Contractor'}</Label>
                                    <Select value={filters.contractor} onValueChange={(v) => onFiltersChange({ ...filters, contractor: v })}>
                                        <SelectTrigger className="rounded-xl border-slate-200 h-10">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">{language === 'tr' ? 'Tüm Yükleniciler' : 'All Contractors'}</SelectItem>
                                            {uniqueContractors.map(con => (
                                                <SelectItem key={con} value={con}>
                                                    {con}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>

            {activeFiltersCount > 0 && (
                <div className="flex flex-wrap gap-2 pt-1 animate-in fade-in slide-in-from-top-1">
                    {filters.permitType !== 'all' && (
                        <Badge variant="secondary" className="bg-white border-slate-200 text-slate-600 pl-3 pr-1 py-1 rounded-full text-xs font-semibold gap-1.5 shadow-sm">
                            {t.permitTypes[filters.permitType as keyof typeof t.permitTypes] || filters.permitType}
                            <div className="hover:bg-slate-100 p-0.5 rounded-full transition-colors cursor-pointer" onClick={() => onFiltersChange({ ...filters, permitType: 'all' })}>
                                <X className="w-3 h-3" />
                            </div>
                        </Badge>
                    )}
                    {filters.location !== 'all' && (
                        <Badge variant="secondary" className="bg-white border-slate-200 text-slate-600 pl-3 pr-1 py-1 rounded-full text-xs font-semibold gap-1.5 shadow-sm">
                            {filters.location}
                            <div className="hover:bg-slate-100 p-0.5 rounded-full transition-colors cursor-pointer" onClick={() => onFiltersChange({ ...filters, location: 'all' })}>
                                <X className="w-3 h-3" />
                            </div>
                        </Badge>
                    )}
                    {filters.contractor !== 'all' && (
                        <Badge variant="secondary" className="bg-white border-slate-200 text-slate-600 pl-3 pr-1 py-1 rounded-full text-xs font-semibold gap-1.5 shadow-sm">
                            {filters.contractor}
                            <div className="hover:bg-slate-100 p-0.5 rounded-full transition-colors cursor-pointer" onClick={() => onFiltersChange({ ...filters, contractor: 'all' })}>
                                <X className="w-3 h-3" />
                            </div>
                        </Badge>
                    )}
                </div>
            )}
        </div>
    );
}
