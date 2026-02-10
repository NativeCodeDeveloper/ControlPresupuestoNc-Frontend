import { cn } from '../../lib/utils';

export const Button = ({
    children,
    variant = 'default',
    size = 'default',
    className,
    ...props
}) => {
    const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

    const variants = {
        default: "bg-foreground text-background hover:bg-foreground/90",
        primary: "bg-[hsl(var(--corporate-blue))] text-white hover:bg-[hsl(var(--corporate-blue-light))]",
        outline: "border border-border bg-transparent hover:bg-foreground/5 text-foreground",
        ghost: "hover:bg-foreground/5 text-foreground",
        destructive: "bg-[hsl(var(--corporate-red))] text-white hover:bg-[hsl(var(--corporate-red))]/90"
    };

    const sizes = {
        sm: "h-8 px-3 text-xs",
        default: "h-10 px-4 py-2 text-sm",
        lg: "h-11 px-6 text-base"
    };

    return (
        <button
            className={cn(
                baseStyles,
                variants[variant],
                sizes[size],
                className
            )}
            {...props}
        >
            {children}
        </button>
    );
};
