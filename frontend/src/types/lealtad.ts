export type NivelLealtad = 'bronze' | 'silver' | 'gold';

export interface LealtadInfo {
  cliente: {
    id: number;
    nombre: string;
    puntos_actuales: number;
    nivel_lealtad: NivelLealtad;
    total_compras: string;
  };
  puntos_actuales: number;
  nivel: NivelLealtad;
  valor_disponible: number;
  proximo_nivel: { nombre: string; puntos_faltantes: number } | null;
  reglas: {
    puntos_por_peso: number;
    peso_por_punto: number;
    valor_punto: number;
    niveles: { bronze: number; silver: number; gold: number };
  };
}

export interface PuntoHistorial {
  id: number;
  cliente_id: number;
  usuario_id: number | null;
  usuario_nombre?: string;
  venta_id: number | null;
  tipo: 'ganado' | 'canjeado' | 'ajuste' | 'expirado';
  puntos: number;
  saldo_anterior: number;
  saldo_nuevo: number;
  motivo: string | null;
  created_at: string;
}

export interface ClienteRanking {
  id: number;
  nombre: string;
  documento: string | null;
  puntos_actuales: number;
  nivel_lealtad: NivelLealtad;
  total_compras: string;
}