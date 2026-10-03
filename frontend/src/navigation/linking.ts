import type { LinkingOptions } from '@react-navigation/native';
import type { RootStackParamList } from '@tipos/index';

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['tiendaadmin://', 'https://tiendaadmin.app'],
  config: {
    screens: {
      Auth: {
        screens: {
          Login: 'login',
        },
      },
      App: {
        screens: {
          Inicio: 'inicio',
          Productos: {
            screens: {
              ProductosList: 'productos',
              ProductoForm: 'productos/nuevo',
              ProductoDetalle: 'productos/:productId',
            },
          },
          Vender: 'vender',
          Ventas: {
            screens: {
              VentasList: 'ventas',
              VentaDetalle: 'ventas/:ventaId',
            },
          },
          Mas: 'mas',
        },
      },
    },
  },
};