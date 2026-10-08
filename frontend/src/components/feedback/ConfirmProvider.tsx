import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';
import ConfirmDialog, {
  type ConfirmVariant,
} from './ConfirmDialog';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn>(() =>
  Promise.resolve(false),
);

/**
 * Hook para confirmaciones.
 *
 * Uso:
 *   const confirm = useConfirm();
 *   const ok = await confirm({
 *     title: 'Eliminar producto',
 *     message: 'Esta acción no se puede deshacer.',
 *     confirmLabel: 'Eliminar',
 *     variant: 'danger',
 *   });
 *   if (ok) { ... }
 */
export function useConfirm(): ConfirmFn {
  return useContext(ConfirmContext);
}

interface ConfirmProviderProps {
  children: React.ReactNode;
}

export function ConfirmProvider({
  children,
}: ConfirmProviderProps): React.ReactElement {
  const [state, setState] = useState<{
    visible: boolean;
    options: ConfirmOptions;
  }>({
    visible: false,
    options: { title: '', message: '' },
  });

  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setState({ visible: true, options });
    });
  }, []);

  const handleConfirm = () => {
    resolverRef.current?.(true);
    resolverRef.current = null;
    setState((s) => ({ ...s, visible: false }));
  };

  const handleCancel = () => {
    resolverRef.current?.(false);
    resolverRef.current = null;
    setState((s) => ({ ...s, visible: false }));
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <ConfirmDialog
        visible={state.visible}
        title={state.options.title}
        message={state.options.message}
        confirmLabel={state.options.confirmLabel}
        cancelLabel={state.options.cancelLabel}
        variant={state.options.variant}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </ConfirmContext.Provider>
  );
}