import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/lib/LanguageContext';
import { locationsApi } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface LocationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function LocationModal({ isOpen, onClose, onSuccess }: LocationModalProps) {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        building: '',
        floor: '',
        zone: '',
        description: '',
        riskLevel: 'Low'
    });

    const handleSubmit = async () => {
        if (!formData.name || !formData.riskLevel) {
            toast.error('Name and Risk Level are required');
            return;
        }

        try {
            setLoading(true);
            await locationsApi.create(formData);
            toast.success(t.locations.successMessage);
            onSuccess();
            onClose();
            setFormData({
                name: '',
                building: '',
                floor: '',
                zone: '',
                description: '',
                riskLevel: 'Low'
            });
        } catch (err: any) {
            toast.error('Failed to create location');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{t.locations.modalTitle}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>{t.locations.name} *</Label>
                        <Input
                            placeholder="Location Name"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-2">
                            <Label>{t.locations.building}</Label>
                            <Input
                                placeholder="A"
                                value={formData.building}
                                onChange={e => setFormData({ ...formData, building: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>{t.locations.floor}</Label>
                            <Input
                                placeholder="1"
                                value={formData.floor}
                                onChange={e => setFormData({ ...formData, floor: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>{t.locations.zone}</Label>
                            <Input
                                placeholder="Z1"
                                value={formData.zone}
                                onChange={e => setFormData({ ...formData, zone: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>{t.locations.riskLevel} *</Label>
                        <Select value={formData.riskLevel} onValueChange={(v) => setFormData({ ...formData, riskLevel: v })}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select risk" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Low">Low</SelectItem>
                                <SelectItem value="Medium">Medium</SelectItem>
                                <SelectItem value="High">High</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>{t.locations.description}</Label>
                        <Textarea
                            placeholder="Description..."
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        {t.common.cancel}
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {t.locations.saveLocation}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
