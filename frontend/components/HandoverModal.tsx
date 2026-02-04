import { useState } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { permitsApi } from '@/lib/api';
import SignaturePad from '@/components/SignaturePad';

interface HandoverModalProps {
    isOpen: boolean;
    onClose: () => void;
    permitId: string;
    onSuccess: () => void;
}

export function HandoverModal({ isOpen, onClose, permitId, onSuccess }: HandoverModalProps) {
    const { t, language } = useLanguage();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        outgoingIssuerName: '',
        incomingIssuerName: '',
        notes: '',
        outgoingSignatureUrl: '',
        incomingSignatureUrl: ''
    });

    const [showSigPad, setShowSigPad] = useState<'outgoing' | 'incoming' | null>(null);

    const handleSubmit = async () => {
        if (!formData.outgoingIssuerName || !formData.incomingIssuerName || !formData.outgoingSignatureUrl || !formData.incomingSignatureUrl) {
            toast.error(language === 'tr' ? 'Lütfen tüm alanları doldurun ve imzalayın' : 'Please fill all fields and sign');
            return;
        }

        try {
            setLoading(true);
            await permitsApi.createHandover(permitId, formData);
            toast.success(language === 'tr' ? 'Devir teslim kaydedildi' : 'Handover recorded');
            onSuccess();
            onClose();
        } catch (err: any) {
            toast.error(err.message || 'Failed to record handover');
        } finally {
            setLoading(false);
        }
    };

    if (showSigPad) {
        return (
            <SignaturePad
                title={showSigPad === 'outgoing' ? (language === 'tr' ? 'Devreden İmza' : 'Outgoing Signature') : (language === 'tr' ? 'Devralan İmza' : 'Incoming Signature')}
                onSave={(url) => {
                    setFormData(prev => ({ ...prev, [showSigPad === 'outgoing' ? 'outgoingSignatureUrl' : 'incomingSignatureUrl']: url }));
                    setShowSigPad(null);
                }}
                onCancel={() => setShowSigPad(null)}
            />
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{language === 'tr' ? 'Vardiya Devir Teslimi' : 'Shift Handover'}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>{language === 'tr' ? 'Devreden (Giden)' : 'Outgoing Issuer'}</Label>
                            <Input
                                placeholder="Ad Soyad"
                                value={formData.outgoingIssuerName}
                                onChange={e => setFormData({ ...formData, outgoingIssuerName: e.target.value })}
                            />
                            {formData.outgoingSignatureUrl ? (
                                <div className="p-2 border rounded bg-green-50 text-xs text-green-700 flex items-center justify-center">
                                    {language === 'tr' ? 'İmzalandı' : 'Signed'}
                                </div>
                            ) : (
                                <Button variant="outline" size="sm" className="w-full" onClick={() => setShowSigPad('outgoing')}>
                                    {language === 'tr' ? 'İmza At' : 'Sign'}
                                </Button>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>{language === 'tr' ? 'Devralan (Gelen)' : 'Incoming Issuer'}</Label>
                            <Input
                                placeholder="Ad Soyad"
                                value={formData.incomingIssuerName}
                                onChange={e => setFormData({ ...formData, incomingIssuerName: e.target.value })}
                            />
                            {formData.incomingSignatureUrl ? (
                                <div className="p-2 border rounded bg-green-50 text-xs text-green-700 flex items-center justify-center">
                                    {language === 'tr' ? 'İmzalandı' : 'Signed'}
                                </div>
                            ) : (
                                <Button variant="outline" size="sm" className="w-full" onClick={() => setShowSigPad('incoming')}>
                                    {language === 'tr' ? 'İmza At' : 'Sign'}
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>{language === 'tr' ? 'Notlar / Durum' : 'Notes / Status'}</Label>
                        <Textarea
                            placeholder={language === 'tr' ? 'Güvenlik durumu, devam eden işler...' : 'Safety status, ongoing works...'}
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>{t.common.cancel}</Button>
                    <Button onClick={handleSubmit} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
                        {loading ? '...' : (language === 'tr' ? 'Kaydet' : 'Save Record')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
