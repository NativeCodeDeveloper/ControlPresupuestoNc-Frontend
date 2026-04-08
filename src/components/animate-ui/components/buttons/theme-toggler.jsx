'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { useTheme } from '../../../../context/ThemeContext';

const BUTTON_VARIANTS = {
    outline: 'bg-card text-foreground border-border hover:bg-accent hover:text-accent-foreground',
    ghost: 'bg-transparent text-foreground border-transparent hover:bg-accent hover:text-accent-foreground',
    solid: 'bg-primary text-primary-foreground border-transparent hover:opacity-90',
};

const BUTTON_SIZES = {
    icon: 'h-9 w-9 p-0',
    sm: 'h-8 px-2 text-xs',
    md: 'h-9 px-3 text-sm',
    lg: 'h-10 px-4 text-sm',
};

const MODE_LABELS = {
    light: 'Light',
    dark: 'Dark',
    system: 'System',
};

function getThemeIcon(theme) {
    if (theme === 'dark') {
        return <Moon size={16} />;
    }
    if (theme === 'system') {
        return <Monitor size={16} />;
    }
    return <Sun size={16} />;
}

export function ThemeTogglerButton({
    variant = 'outline',
    size = 'icon',
    direction = 'horizontal',
    modes = ['light', 'dark'],
    className,
}) {
    const { theme, resolvedTheme, setTheme } = useTheme();
    const allowedModes = Array.isArray(modes) && modes.length > 0 ? modes : ['light', 'dark'];

    const activeTheme = allowedModes.includes(theme)
        ? theme
        : (allowedModes.includes(resolvedTheme) ? resolvedTheme : allowedModes[0]);

    const activeModeIndex = allowedModes.indexOf(activeTheme);
    const nextTheme = allowedModes[(activeModeIndex + 1) % allowedModes.length];

    const iconTheme = activeTheme === 'system' ? 'system' : resolvedTheme;
    const icon = getThemeIcon(iconTheme);

    return (
        <button
            type="button"
            onClick={() => setTheme(nextTheme)}
            className={cn(
                'inline-flex items-center justify-center gap-2 rounded-lg border transition-colors duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                BUTTON_VARIANTS[variant] || BUTTON_VARIANTS.outline,
                BUTTON_SIZES[size] || BUTTON_SIZES.icon,
                size === 'icon' ? '' : (direction === 'vertical' ? 'flex-col' : 'flex-row'),
                className
            )}
            aria-label={`Cambiar tema a ${MODE_LABELS[nextTheme] || nextTheme}`}
            title={`Cambiar tema a ${MODE_LABELS[nextTheme] || nextTheme}`}
        >
            {icon}
            {size === 'icon' ? null : <span>{MODE_LABELS[activeTheme] || activeTheme}</span>}
        </button>
    );
}
