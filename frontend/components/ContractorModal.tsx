import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/lib/LanguageContext';
import { contractorsApi } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2, Plus } from 'lucide-react';

interface ContractorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function ContractorModal({ isOpen, onClose, onSuccess }: ContractorModalProps) {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        company: '',
        contactPerson: '',
        email: '',
        phone: ''
    });

    const handleSubmit = async () => {
        if (!formData.name || !formData.company) {
            toast.error('Name and Company are required');
            return;
        }

        try {
            setLoading(true);
            await contractorsApi.create(formData);
            toast.success(t.contractors.successMessage);
            onSuccess();
            onClose();
            setFormData({
                name: '',
                company: '',
                contactPerson: '',
                email: '',
                phone: ''
            });
        } catch (err: any) {
            toast.error('Failed to create contractor');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{t.contractors.modalTitle}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>{t.contractors.name}</Label>
                        <Input
                            placeholder="Contractor Name"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>{t.contractors.company}</Label>
                        <Input
                            placeholder="Company Name"
                            value={formData.company}
                            onChange={e => setFormData({ ...formData, company: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>{t.contractors.contact}</Label>
                        <Input
                            placeholder="Contact Person"
                            value={formData.contactPerson}
                            onChange={e => setFormData({ ...formData, contactPerson: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>{t.contractors.email}</Label>
                            <Input
                                placeholder="Email"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>{t.contractors.phone}</Label>
                            <Input
                                placeholder="Phone"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        {t.common.cancel}
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {t.contractors.saveContractor}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
