export interface ConfiguracionGrupo {
  [clave: string]: unknown;
}

export interface ConfiguracionData {
  [grupo: string]: ConfiguracionGrupo;
}