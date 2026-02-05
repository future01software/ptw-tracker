import { useState, useEffect } from 'react';
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
    initialData?: any;
}

export function ContractorModal({ isOpen, onClose, onSuccess, initialData }: ContractorModalProps) {
    const { t, language } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        company: '',
        contactPerson: '',
        email: '',
        phone: ''
    });

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    name: initialData.name || '',
                    company: initialData.company || '',
                    contactPerson: initialData.contactPerson || '',
                    email: initialData.email || '',
                    phone: initialData.phone || ''
                });
                setIsEditing(true);
            } else {
                setFormData({
                    name: '',
                    company: '',
                    contactPerson: '',
                    email: '',
                    phone: ''
                });
                setIsEditing(false);
            }
        }
    }, [isOpen, initialData]);

    const handleSubmit = async () => {
        if (!formData.name || !formData.company) {
            toast.error('Name and Company are required');
            return;
        }

        try {
            setLoading(true);
            if (isEditing && initialData?.id) {
                await contractorsApi.update(initialData.id, formData);
                toast.success(language === 'tr' ? 'Müteahhit güncellendi' : 'Contractor updated');
            } else {
                await contractorsApi.create(formData);
                toast.success(t.contractors.successMessage);
            }
            onSuccess();
            onClose();
        } catch (err: any) {
            toast.error(isEditing ? 'Failed to update contractor' : 'Failed to create contractor');
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
