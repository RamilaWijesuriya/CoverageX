import React from 'react';
import clsx from 'clsx';

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'fab' };
export const Button: React.FC<ButtonProps> = ({ variant = 'primary', className, ...props }) => (
  <button className={clsx('btn', `btn--${variant}`, className)} {...props} />
);