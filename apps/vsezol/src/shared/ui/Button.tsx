import { clsx } from 'clsx';
import { PropsWithChildren } from 'react';
import { Size } from './types';

export type ButtonProps = {
  size: Size;
  ariaLabel?: string;
} & PropsWithChildren;

const sizeClass: Partial<Record<Size, string>> = {
  xs: 'btn-xs',
  sm: 'btn-sm',
  lg: 'btn-lg',
};

export const Button = ({ children, size, ariaLabel }: ButtonProps) => {
  return (
    <button
      aria-label={ariaLabel}
      className={clsx('btn', 'btn-ghost', sizeClass?.[size])}
    >
      {children}
    </button>
  );
};
