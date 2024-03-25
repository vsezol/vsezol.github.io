import { PropsWithChildren } from 'react';

export type TooltipProps = {
  text: string;
  disabled?: boolean;
} & PropsWithChildren;

export const Tooltip = ({ children, text, disabled = false }: TooltipProps) => {
  return (
    <div
      className="tooltip tooltip-bottom tooltip-base-content"
      data-tip={!disabled ? text : undefined}
    >
      {children}
    </div>
  );
};
