export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastState {
  visible: boolean;
  message: string;
  variant: ToastVariant;
}

export type BadgeVariant =
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'
  | 'accent'
  | 'neutral'
  | 'outline';

export type ButtonVariant =
  | 'primary'
  | 'accent'
  | 'outline'
  | 'ghost'
  | 'danger';

export type ButtonSize = 'sm' | 'md' | 'lg';