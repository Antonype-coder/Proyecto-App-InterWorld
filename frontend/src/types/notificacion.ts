export interface Notificacion {
  id: number;
  usuario_id: number | null;
  tipo: string;
  titulo: string;
  mensaje: string;
  nivel: 'info' | 'success' | 'warning' | 'danger';
  leida: number;
  leida_at: string | null;
  referencia_tipo: string | null;
  referencia_id: number | null;
  expira_at: string | null;
  created_at: string;
}

export interface NotificacionesResponse {
  items: Notificacion[];
  no_leidas: number;
}