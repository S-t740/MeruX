import { CalloutData } from '@/types/lesson-json';
import { Info, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const variantConfig = {
    info: {
        icon: Info,
        border: 'border-hub-indigo/30',
        bg: 'bg-hub-indigo/5',
        iconColor: 'text-hub-indigo',
        titleColor: 'text-hub-indigo',
    },
    warning: {
        icon: AlertTriangle,
        border: 'border-hub-amber/30',
        bg: 'bg-hub-amber/5',
        iconColor: 'text-hub-amber',
        titleColor: 'text-hub-amber',
    },
    success: {
        icon: CheckCircle,
        border: 'border-hub-teal/30',
        bg: 'bg-hub-teal/5',
        iconColor: 'text-hub-teal',
        titleColor: 'text-hub-teal',
    },
};

export function CalloutBlock({ data }: { data: CalloutData }) {
    const cfg = variantConfig[data.variant] || variantConfig.info;
    const Icon = cfg.icon;

    return (
        <div className={cn('rounded-xl border p-4 flex gap-3', cfg.border, cfg.bg)}>
            <Icon className={cn('w-5 h-5 shrink-0 mt-0.5', cfg.iconColor)} />
            <div className="space-y-1 min-w-0">
                <p className={cn('text-xs font-bold uppercase tracking-widest', cfg.titleColor)}>
                    {data.title}
                </p>
                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                    {data.text}
                </p>
            </div>
        </div>
    );
}
