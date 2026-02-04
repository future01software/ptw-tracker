import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { permitsApi } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2, Award } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

interface CertificateModalProps {
    isOpen: boolean;
    onClose: () => void;
    permitId: string;
    onSuccess: () => void;
}

export function CertificateModal({ isOpen, onClose, permitId, onSuccess }: CertificateModalProps) {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        certificateType: '',
        certificateNo: '',
        holderName: '',
        issueDate: '',
        expiryDate: '',
        issuingAuthority: '',
        notes: ''
    });

    const certificateTypeKeys = [
        'gas',
        'excavation',
        'confined',
        'eked'
    ];

    const handleSubmit = async () => {
        if (!formData.certificateType || !formData.holderName || !formData.issueDate) {
            toast.error(t.certificates.validationError);
            return;
        }

        try {
            setLoading(true);
            await permitsApi.addCertificate(permitId, {
                ...formData,
                issueDate: new Date(formData.issueDate).toISOString(),
                expiryDate: formData.expiryDate ? new Date(formData.expiryDate).toISOString() : null
            });
            toast.success(t.certificates.successMessage);
            onSuccess();
            onClose();
            setFormData({
                certificateType: '',
                certificateNo: '',
                holderName: '',
                issueDate: '',
                expiryDate: '',
                issuingAuthority: '',
                notes: ''
            });
        } catch (err: any) {
            toast.error(t.certificates.errorMessage + ': ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-purple-600" />
                        {t.certificates.modalTitle}
                    </DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-500">{t.certificates.type} *</Label>
                        <Select value={formData.certificateType} onValueChange={(v) => setFormData({ ...formData, certificateType: v })}>
                            <SelectTrigger className="h-10">
                                <SelectValue placeholder={t.certificates.selectType} />
                            </SelectTrigger>
                            <SelectContent>
                                {certificateTypeKeys.map(key => (
                                    <SelectItem key={key} value={(t.certificates.types as any)[key]}>
                                        {(t.certificates.types as any)[key]}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-500">{t.certificates.holder} *</Label>
                            <Input
                                placeholder={t.certificates.holderPlaceholder}
                                value={formData.holderName}
                                onChange={e => setFormData({ ...formData, holderName: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-500">{t.certificates.number}</Label>
                            <Input
                                placeholder={t.certificates.numberPlaceholder}
                                value={formData.certificateNo}
                                onChange={e => setFormData({ ...formData, certificateNo: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-500">{t.certificates.issueDate} *</Label>
                            <Input
                                type="date"
                                value={formData.issueDate}
                                onChange={e => setFormData({ ...formData, issueDate: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-500">{t.certificates.expiryDate}</Label>
                            <Input
                                type="date"
                                value={formData.expiryDate}
                                onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-500">{t.certificates.issuingAuthority}</Label>
                        <Input
                            placeholder={t.certificates.authorityPlaceholder}
                            value={formData.issuingAuthority}
                            onChange={e => setFormData({ ...formData, issuingAuthority: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-500">{t.certificates.notes}</Label>
                        <Textarea
                            placeholder={t.certificates.notesPlaceholder}
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            rows={2}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>{t.certificates.cancel}</Button>
                    <Button onClick={handleSubmit} disabled={loading} className="bg-purple-600 text-white hover:bg-purple-700">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t.certificates.save}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
