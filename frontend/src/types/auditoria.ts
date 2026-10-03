export interface AuditoriaLog {
  id: number;
  usuario_id: number | null;
  usuario_nombre?: string | null;
  accion: string;
  entidad: string;
  entidad_id: number | null;
  descripcion: string | null;
  datos_anteriores: string | null;
  datos_nuevos: string | null;
  ip: string | null;
  user_agent: string | null;
  created_at: string;
}