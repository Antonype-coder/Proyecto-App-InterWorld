import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import MasHomeScreen from '@screens/mas/MasHomeScreen';
import PerfilScreen from '@screens/mas/PerfilScreen';
import EditarPerfilScreen from '@screens/mas/EditarPerfilScreen';
import CambiarPasswordScreen from '@screens/mas/CambiarPasswordScreen';
import ConfiguracionScreen from '@screens/configuracion/ConfiguracionScreen';
import AparienciaScreen from '@screens/configuracion/AparienciaScreen';
import NotificacionesScreen from '@screens/notificaciones/NotificacionesScreen';
import AuditoriaScreen from '@screens/auditoria/AuditoriaScreen';
import ClientesListScreen from '@screens/clientes/ClientesListScreen';
import ClienteFormScreen from '@screens/clientes/ClienteFormScreen';
import ClienteEstadoCuentaScreen from '@screens/clientes/ClienteEstadoCuentaScreen';
import ClienteLealtadScreen from '@screens/lealtad/ClienteLealtadScreen';
import CategoriasListScreen from '@screens/categorias/CategoriasListScreen';
import CategoriaFormScreen from '@screens/categorias/CategoriaFormScreen';
import ProveedoresListScreen from '@screens/proveedores/ProveedoresListScreen';
import ProveedorFormScreen from '@screens/proveedores/ProveedorFormScreen';
import ProveedorDetalleScreen from '@screens/proveedores/ProveedorDetalleScreen';
import InventarioScreen from '@screens/inventario/InventarioScreen';
import MovimientoFormScreen from '@screens/inventario/MovimientoFormScreen';
import CajaScreen from '@screens/caja/CajaScreen';
import AbrirCajaScreen from '@screens/caja/AbrirCajaScreen';
import CerrarCajaScreen from '@screens/caja/CerrarCajaScreen';
import HistorialCajaScreen from '@screens/caja/HistorialCajaScreen';
import MovimientoCajaFormScreen from '@screens/caja/MovimientoCajaFormScreen';
import ReportesScreen from '@screens/reportes/ReportesScreen';
import UsuariosScreen from '@screens/usuarios/UsuariosScreen';
import DevolucionesListScreen from '@screens/devoluciones/DevolucionesListScreen';
import DevolucionDetalleScreen from '@screens/devoluciones/DevolucionDetalleScreen';
import PromocionesListScreen from '@screens/promociones/PromocionesListScreen';
import PromocionFormScreen from '@screens/promociones/PromocionFormScreen';
import OrdenesCompraListScreen from '@screens/ordenes-compra/OrdenesCompraListScreen';
import OrdenCompraFormScreen from '@screens/ordenes-compra/OrdenCompraFormScreen';
import OrdenCompraDetalleScreen from '@screens/ordenes-compra/OrdenCompraDetalleScreen';
import LealtadRankingScreen from '@screens/lealtad/LealtadRankingScreen';
import CentroAyudaScreen from '@screens/ayuda/CentroAyudaScreen';
import AcercaDeScreen from '@screens/ayuda/AcercaDeScreen';
import type { MasStackParamList } from '@tipos/index';

const Stack = createNativeStackNavigator<MasStackParamList>();

export default function MasStack(): React.ReactElement {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MasHome" component={MasHomeScreen} />

      {/* Cuenta */}
      <Stack.Screen name="Perfil" component={PerfilScreen} />
      <Stack.Screen name="EditarPerfil" component={EditarPerfilScreen} />
      <Stack.Screen name="CambiarPassword" component={CambiarPasswordScreen} />

      {/* Preferencias */}
      <Stack.Screen name="Configuracion" component={ConfiguracionScreen} />
      <Stack.Screen name="Apariencia" component={AparienciaScreen} />
      <Stack.Screen name="Notificaciones" component={NotificacionesScreen} />
      <Stack.Screen name="Auditoria" component={AuditoriaScreen} />

      {/* Operación */}
      <Stack.Screen name="Clientes" component={ClientesListScreen} />
      <Stack.Screen name="ClienteForm" component={ClienteFormScreen} />
      <Stack.Screen
        name="ClienteEstadoCuenta"
        component={ClienteEstadoCuentaScreen}
      />
      <Stack.Screen name="ClienteLealtad" component={ClienteLealtadScreen} />
      <Stack.Screen name="Categorias" component={CategoriasListScreen} />
      <Stack.Screen name="CategoriaForm" component={CategoriaFormScreen} />
      <Stack.Screen name="Proveedores" component={ProveedoresListScreen} />
      <Stack.Screen name="ProveedorForm" component={ProveedorFormScreen} />
      <Stack.Screen name="ProveedorDetalle" component={ProveedorDetalleScreen} />
      <Stack.Screen name="Inventario" component={InventarioScreen} />
      <Stack.Screen name="MovimientoForm" component={MovimientoFormScreen} />

      {/* Caja */}
      <Stack.Screen name="Caja" component={CajaScreen} />
      <Stack.Screen name="AbrirCaja" component={AbrirCajaScreen} />
      <Stack.Screen name="CerrarCaja" component={CerrarCajaScreen} />
      <Stack.Screen name="CajaHistorial" component={HistorialCajaScreen} />
      <Stack.Screen
        name="CajaMovimientoForm"
        component={MovimientoCajaFormScreen}
      />

      {/* Administración */}
      <Stack.Screen name="Reportes" component={ReportesScreen} />
      <Stack.Screen name="Usuarios" component={UsuariosScreen} />
      <Stack.Screen name="Devoluciones" component={DevolucionesListScreen} />
      <Stack.Screen
        name="DevolucionDetalle"
        component={DevolucionDetalleScreen}
      />
      <Stack.Screen name="Promociones" component={PromocionesListScreen} />
      <Stack.Screen name="PromocionForm" component={PromocionFormScreen} />
      <Stack.Screen name="OrdenesCompra" component={OrdenesCompraListScreen} />
      <Stack.Screen name="OrdenCompraForm" component={OrdenCompraFormScreen} />
      <Stack.Screen
        name="OrdenCompraDetalle"
        component={OrdenCompraDetalleScreen}
      />
      <Stack.Screen name="LealtadRanking" component={LealtadRankingScreen} />

      {/* Ayuda */}
      <Stack.Screen name="CentroAyuda" component={CentroAyudaScreen} />
      <Stack.Screen name="AcercaDe" component={AcercaDeScreen} />
    </Stack.Navigator>
  );
}