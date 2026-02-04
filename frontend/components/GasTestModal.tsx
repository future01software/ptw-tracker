import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { permitsApi } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

interface GasTestModalProps {
    isOpen: boolean;
    onClose: () => void;
    permitId: string;
    onSuccess: () => void;
}

export function GasTestModal({ isOpen, onClose, permitId, onSuccess }: GasTestModalProps) {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        testTime: '',
        oxygen: '',
        co2: '',
        lel: '',
        toxic: '',
        co: '',
        testedBy: ''
    });

    const handleSubmit = async () => {
        if (!formData.testedBy || !formData.testTime) {
            toast.error('Tested By and Test Time are required');
            return;
        }

        try {
            setLoading(true);
            await permitsApi.addGasTest(permitId, formData);
            toast.success('Gas test record added');
            onSuccess();
            onClose();
            setFormData({
                testTime: '',
                oxygen: '',
                co2: '',
                lel: '',
                toxic: '',
                co: '',
                testedBy: ''
            });
        } catch (err: any) {
            toast.error('Failed to add record: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{t.gasTests.modalTitle}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>{t.gasTests.date}</Label>
                            <Input
                                type="time"
                                value={formData.testTime}
                                onChange={e => setFormData({ ...formData, testTime: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>{t.gasTests.tester}</Label>
                            <Input
                                placeholder="Ad Soyad"
                                value={formData.testedBy}
                                onChange={e => setFormData({ ...formData, testedBy: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                            <Label className="text-xs">{t.gasTests.o2}</Label>
                            <Input
                                placeholder="%"
                                value={formData.oxygen}
                                onChange={e => setFormData({ ...formData, oxygen: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">{t.gasTests.co2}</Label>
                            <Input
                                placeholder="ppm"
                                value={formData.co2}
                                onChange={e => setFormData({ ...formData, co2: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">{t.gasTests.lel}</Label>
                            <Input
                                placeholder="%"
                                value={formData.lel}
                                onChange={e => setFormData({ ...formData, lel: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">{t.gasTests.toxic}</Label>
                            <Input
                                placeholder="ppm"
                                value={formData.toxic}
                                onChange={e => setFormData({ ...formData, toxic: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">{t.gasTests.co}</Label>
                            <Input
                                placeholder="ppm"
                                value={formData.co}
                                onChange={e => setFormData({ ...formData, co: e.target.value })}
                            />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>{t.gasTests.cancel}</Button>
                    <Button onClick={handleSubmit} disabled={loading} className="bg-blue-600 text-white">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t.gasTests.save}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
