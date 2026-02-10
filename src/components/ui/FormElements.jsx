import { MoreHorizontal } from 'lucide-react';
import { cn } from '../../lib/utils';

export const Input = ({ label, className, ...props }) => (
    <div className={cn("space-y-1.5 basic-input", className)}>
        {label && (
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-muted-foreground">
                {label}
            </label>
        )}
        <input
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-[hsl(var(--corporate-blue))]/40 focus-visible:border-[hsl(var(--corporate-blue))]"
            {...props}
        />
    </div>
);

export const Select = ({ label, children, className, ...props }) => (
    <div className={cn("space-y-1.5", className)}>
        {label && (
            <label className="text-sm font-medium leading-none text-muted-foreground">
                {label}
            </label>
        )}
        <div className="relative">
            <select
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none focus:ring-[hsl(var(--corporate-blue))]/40 focus:border-[hsl(var(--corporate-blue))]"
                {...props}
            >
                {children}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                <MoreHorizontal size={14} className="rotate-90" />
            </div>
        </div>
    </div>
);
