import { useState } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { permitsApi } from '@/lib/api';
import { CheckCircle, AlertTriangle } from 'lucide-react';

interface ChecklistModalProps {
    isOpen: boolean;
    onClose: () => void;
    permitId: string;
    onSuccess: () => void;
}

export function ChecklistModal({ isOpen, onClose, permitId, onSuccess }: ChecklistModalProps) {
    const { t, language } = useLanguage();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        checkedByName: '',
        isSafe: true,
        comments: ''
    });

    const handleSubmit = async () => {
        if (!formData.checkedByName) {
            toast.error(language === 'tr' ? 'Lütfen kontrol eden adını girin' : 'Please enter checker name');
            return;
        }

        try {
            setLoading(true);
            await permitsApi.createChecklist(permitId, formData);
            toast.success(language === 'tr' ? 'Kontrol kaydedildi' : 'Checklist recorded');
            onSuccess();
            onClose();
        } catch (err: any) {
            toast.error(err.message || 'Failed to record checklist');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{language === 'tr' ? 'Günlük Güvenlik Kontrolü' : 'Daily Safety Checklist'}</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">

                    {/* Safe / Unsafe Toggle */}
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, isSafe: true })}
                            className={`flex-1 p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${formData.isSafe ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-200 text-slate-400 hover:border-slate-300'}`}
                        >
                            <CheckCircle className="w-8 h-8" />
                            <span className="font-bold text-sm uppercase">{language === 'tr' ? 'Güvenli (Safe)' : 'Safe'}</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, isSafe: false })}
                            className={`flex-1 p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${!formData.isSafe ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-200 text-slate-400 hover:border-slate-300'}`}
                        >
                            <AlertTriangle className="w-8 h-8" />
                            <span className="font-bold text-sm uppercase">{language === 'tr' ? 'Güvensiz (Unsafe)' : 'Unsafe'}</span>
                        </button>
                    </div>

                    <div className="space-y-2">
                        <Label>{language === 'tr' ? 'Kontrol Eden' : 'Checked By'}</Label>
                        <Input
                            placeholder="Ad Soyad"
                            value={formData.checkedByName}
                            onChange={e => setFormData({ ...formData, checkedByName: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>{language === 'tr' ? 'Yorumlar / Bulgular' : 'Comments / Findings'}</Label>
                        <Textarea
                            placeholder={language === 'tr' ? 'Gaz ölçümü normal, saha temiz...' : 'Gas readings normal, area clean...'}
                            value={formData.comments}
                            onChange={e => setFormData({ ...formData, comments: e.target.value })}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>{t.common.cancel}</Button>
                    <Button onClick={handleSubmit} disabled={loading} className={`text-white ${formData.isSafe ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                        {loading ? '...' : (language === 'tr' ? 'Kaydet' : 'Save Check')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
