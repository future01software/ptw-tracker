import { useLanguage } from '@/lib/LanguageContext';
import { cn } from '@/lib/utils';
import { Check, Circle, Clock, ArrowRight } from 'lucide-react';

interface PermitWorkflowStepperProps {
    status: string;
}

export function PermitWorkflowStepper({ status }: PermitWorkflowStepperProps) {
    const { language } = useLanguage();

    // Map statuses to steps
    // Steps: Plan -> Prep -> Review -> Supervision (Active) -> Completion

    const steps = [
        {
            id: 'plan',
            label: language === 'tr' ? 'Planlama' : 'Plan Job',
            subLabel: language === 'tr' ? 'Yönetici' : 'Manager',
            activeStatuses: ['draft', 'pending', 'active', 'completed', 'engineering_review', 'approved'],
            completedStatuses: ['pending', 'active', 'completed', 'engineering_review', 'approved']
        },
        {
            id: 'prep',
            label: language === 'tr' ? 'Hazırlık' : 'Preparation',
            subLabel: language === 'tr' ? 'Alıcı' : 'Recipient',
            activeStatuses: ['draft', 'pending', 'active', 'completed', 'engineering_review', 'approved'],
            completedStatuses: ['pending', 'active', 'completed', 'engineering_review', 'approved']
        },
        {
            id: 'review',
            label: language === 'tr' ? 'İnceleme & Onay' : 'Review & Issue',
            subLabel: language === 'tr' ? 'İzin Veren' : 'Issuer',
            activeStatuses: ['pending', 'engineering_review', 'active', 'completed', 'approved'],
            completedStatuses: ['active', 'completed', 'approved']
        },
        {
            id: 'supervision',
            label: language === 'tr' ? 'Denetim' : 'Supervision',
            subLabel: language === 'tr' ? 'Saha' : 'Worker',
            activeStatuses: ['active', 'approved', 'completed'],
            completedStatuses: ['completed']
        },
        {
            id: 'completion',
            label: language === 'tr' ? 'Tamamlanma' : 'Completion',
            subLabel: language === 'tr' ? 'İzleme' : 'Monitor',
            activeStatuses: ['completed'],
            completedStatuses: ['completed']
        }
    ];

    return (
        <div className="w-full bg-white border border-slate-200 rounded-3xl p-6 shadow-sm mb-8">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                <ArrowRight className="w-4 h-4" />
                {language === 'tr' ? 'İş Akış Durumu' : 'Workflow Status'}
            </h3>

            <div className="relative flex items-center justify-between">
                {/* Connecting Line */}
                <div className="absolute top-5 left-0 w-full h-1 bg-slate-100 -z-0 rounded-full"></div>

                {steps.map((step, index) => {
                    const isActive = step.activeStatuses.includes(status.toLowerCase());
                    const isCompleted = step.completedStatuses.includes(status.toLowerCase());
                    const isCurrent = isActive && !isCompleted;

                    let stateColor = 'bg-slate-100 text-slate-400 border-slate-200'; // Default
                    if (isCompleted) stateColor = 'bg-green-600 text-white border-green-600 shadow-lg shadow-green-200';
                    else if (isActive) stateColor = 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200 animate-pulse';

                    // Explicit override for current stage to stand out if needed, but 'isActive' logic covers it broadly
                    // If status is 'pending', 'Plan' and 'Prep' are completed. 'Review' is active.

                    // Check specifically for current step
                    // If status is 'draft', step 1 and 2 might be active/partial.
                    // Let's refine logical mapping:
                    // Draft -> Plan (Active)
                    // Draft + Docs -> Prep (Active)
                    // Pending -> Review (Active)
                    // Active -> Supervision (Active)
                    // Completed -> Completion (Completed)

                    return (
                        <div key={step.id} className="flex flex-col items-center relative z-10 w-full">
                            <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-500",
                                stateColor,
                                isCompleted ? "scale-100" : "scale-110"
                            )}>
                                {isCompleted ? <Check className="w-5 h-5" /> : (isActive ? <Clock className="w-5 h-5" /> : <Circle className="w-5 h-5 text-slate-300 fill-slate-100" />)}
                            </div>
                            <div className="text-center mt-3">
                                <p className={cn(
                                    "text-[10px] font-black uppercase tracking-widest transition-colors duration-300",
                                    (isActive || isCompleted) ? "text-slate-900" : "text-slate-400"
                                )}>
                                    {step.label}
                                </p>
                                <p className="text-[9px] font-bold text-slate-400 mt-1 hidden sm:block">
                                    {step.subLabel}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
