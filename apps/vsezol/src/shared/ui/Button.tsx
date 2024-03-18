import { PropsWithChildren } from 'react';

export const Button = ({ children }: PropsWithChildren) => {
  return <button className="btn btn-primary">{children}</button>;
};
