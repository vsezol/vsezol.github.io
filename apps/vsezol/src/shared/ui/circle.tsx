import clsx from 'clsx';
import { PropsWithChildren } from 'react';
import { Size } from './types';

export type CircleProps = {
  color?: 'rainbow' | string;
  border?: Extract<Size, 'xs' | 'sm'>;
} & PropsWithChildren;

const borderClass: Partial<Record<Size, string>> = {
  xs: 'p-0.5',
  sm: 'p-1',
};

const baseCircleClasses =
  'flex items-center justify-center box-border rounded-full aspect-square';

export const Circle = ({ children, border = 'sm', color }: CircleProps) => {
  return (
    <div
      className={clsx(baseCircleClasses, `bg-${color}`, borderClass[border])}
    >
      {children}
    </div>
  );
};
