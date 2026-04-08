import * as React from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeTogglerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'outline' | 'ghost' | 'solid';
  size?: 'icon' | 'sm' | 'md' | 'lg';
  direction?: 'horizontal' | 'vertical';
  modes?: ThemeMode[];
}

export declare function ThemeTogglerButton(props: ThemeTogglerButtonProps): React.JSX.Element;
