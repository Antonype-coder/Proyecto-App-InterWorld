import { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { parseISO } from 'date-fns';
import { cajaApi, ventasApi } from '@api/index';

interface CajaLike {
  id: number;
  monto_apertura: string;
  abierta_at: string;
}

export interface CajaResumen {
  efectivo: number;
  ventasTotal: number;
  ventasCantidad: number;
  ingresos: number;
  egresos: number;
  apertura: number;
  loading: boolean;
}

const EMPTY: CajaResumen = {
  efectivo: 0,
  ventasTotal: 0,
  ventasCantidad: 0,
  ingresos: 0,
  egresos: 0,
  apertura: 0,
  loading: false,
};

function toTimestamp(value: string | null | undefined): number {
  if (!value) return 0;
  try {
    const normalized = value.includes('T') ? value : value.replace(' ', 'T');
    return parseISO(normalized).getTime();
  } catch {
    return 0;
  }
}

/**
 * Mantiene los totales de caja en vivo.
 *
 * - Refresca automáticamente cada `intervalMs` (default 2 s).
 * - Solo hace polling cuando la pantalla está enfocada.
 * - Fuerza una recarga inmediata cuando la app vuelve del background.
 * - Se detiene al desmontar o cuando no hay sesión abierta.
 */
export function useCajaResumen(
  sesion: CajaLike | null,
  intervalMs: number = 2000,
): CajaResumen {
  const [resumen, setResumen] = useState<CajaResumen>(EMPTY);
  const isFocused = useIsFocused();

  const sesionRef = useRef<CajaLike | null>(sesion);
  useEffect(() => {
    sesionRef.current = sesion;
  }, [sesion]);

  // Efecto principal: polling mientras la sesión exista y la pantalla esté visible
  useEffect(() => {
    const inicial = sesion;
    if (!inicial) {
      setResumen(EMPTY);
      return undefined;
    }

    let cancelled = false;

    const cargar = async (): Promise<void> => {
      const s = sesionRef.current;
      if (!s || s.id !== inicial.id) return;

      try {
        const [movs, ventasRes] = await Promise.all([
          cajaApi.movimientos(s.id).catch(() => []),
          ventasApi
            .listar({ limit: 500 })
            .catch(() => ({ items: [], total: 0 })),
        ]);

        if (cancelled) return;

        const inicio = toTimestamp(s.abierta_at);
        const vistas = new Set<number>();
        let ventasTotal = 0;
        let ventasCantidad = 0;

        for (const v of ventasRes.items) {
          if (vistas.has(v.id)) continue;
          vistas.add(v.id);
          if (v.estado !== 'completada') continue;
          const fecha = toTimestamp(v.created_at);
          if (fecha === 0) continue;
          if (fecha >= inicio - 60_000) {
            ventasTotal += parseFloat(v.total) || 0;
            ventasCantidad += 1;
          }
        }

        let ingresos = 0;
        let egresos = 0;
        for (const m of movs) {
          const monto = parseFloat(m.monto) || 0;
          if (m.tipo === 'ingreso') ingresos += monto;
          else if (m.tipo === 'egreso') egresos += monto;
        }

        const apertura = parseFloat(s.monto_apertura) || 0;
        const efectivo = apertura + ventasTotal + ingresos - egresos;

        setResumen({
          efectivo,
          ventasTotal,
          ventasCantidad,
          ingresos,
          egresos,
          apertura,
          loading: false,
        });
      } catch {
        if (!cancelled) {
          setResumen((prev) => ({ ...prev, loading: false }));
        }
      }
    };

    // Carga inicial inmediata
    setResumen((prev) => ({ ...prev, loading: true }));
    void cargar();

    // Polling: solo corre si la pantalla está visible
    let intervalId: ReturnType<typeof setInterval> | null = null;

    if (isFocused) {
      intervalId = setInterval(() => {
        void cargar();
      }, intervalMs);
    }

    // Suscripción a cambios de estado de la app (foreground / background)
    const appStateSub = AppState.addEventListener(
      'change',
      (nextState: AppStateStatus) => {
        if (nextState === 'active') {
          void cargar();
        }
      },
    );

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
      appStateSub.remove();
    };
  }, [
    sesion?.id,
    sesion?.abierta_at,
    sesion?.monto_apertura,
    intervalMs,
    isFocused,
  ]);

  return resumen;
}