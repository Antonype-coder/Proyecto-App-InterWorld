export interface FAQ {
  id: string;
  categoria: 'ventas' | 'productos' | 'clientes' | 'inventario' | 'caja' | 'reportes' | 'cuenta';
  pregunta: string;
  respuesta: string;
}

export const FAQS: FAQ[] = [
  // VENTAS
  {
    id: 'v1',
    categoria: 'ventas',
    pregunta: '¿Cómo hago una venta rápida?',
    respuesta:
      'Ve a la pestaña "Vender" (carrito en el centro), busca el producto por nombre o código, toca para agregarlo al carrito, ajusta cantidades y toca "Cobrar".',
  },
  {
    id: 'v2',
    categoria: 'ventas',
    pregunta: '¿Cómo uso el escáner de códigos de barras?',
    respuesta:
      'Dentro del POS, toca el botón azul con el ícono de código de barras (a la derecha del buscador). Apunta la cámara al código del producto y se agregará automáticamente al carrito.',
  },
  {
    id: 'v3',
    categoria: 'ventas',
    pregunta: '¿Cómo vendo a crédito?',
    respuesta:
      'En el POS, agrega los productos, cambia el tipo de pago a "Crédito", selecciona el cliente y cobra. La deuda se sumará al saldo del cliente.',
  },
  {
    id: 'v4',
    categoria: 'ventas',
    pregunta: '¿Puedo anular una venta ya registrada?',
    respuesta:
      'Sí, pero solo si eres administrador. Abre la venta desde "Ventas", toca "Anular venta" y escribe el motivo. El stock se repondrá y si fue a crédito se revertirá la deuda.',
  },
  {
    id: 'v5',
    categoria: 'ventas',
    pregunta: '¿Cómo hago una devolución?',
    respuesta:
      'Abre la venta original, toca "Devolver productos", selecciona las cantidades a devolver, escribe el motivo y confirma. Puedes hacer devolución total o parcial.',
  },

  // PRODUCTOS
  {
    id: 'p1',
    categoria: 'productos',
    pregunta: '¿Cómo agrego un producto nuevo?',
    respuesta:
      'Ve a "Productos", toca el botón "+" y llena el formulario. Puedes escanear el código de barras con la cámara y tomar una foto del producto.',
  },
  {
    id: 'p2',
    categoria: 'productos',
    pregunta: '¿Qué es el "stock mínimo"?',
    respuesta:
      'Es el nivel mínimo de unidades antes de que aparezca una alerta. Cuando el stock baja a este nivel, se te notifica para reponer.',
  },
  {
    id: 'p3',
    categoria: 'productos',
    pregunta: '¿Cómo edito un producto?',
    respuesta:
      'Ve a "Productos", toca el producto y luego el lápiz arriba a la derecha. Solo administradores pueden editar.',
  },

  // CLIENTES
  {
    id: 'c1',
    categoria: 'clientes',
    pregunta: '¿Cómo creo un cliente?',
    respuesta:
      'Ve a "Más" → "Clientes", toca el "+". Llena los datos y define un cupo de crédito si vas a venderle a crédito.',
  },
  {
    id: 'c2',
    categoria: 'clientes',
    pregunta: '¿Cómo registro un pago de deuda?',
    respuesta:
      'Ve a "Clientes", abre el cliente, toca "Registrar pago", ingresa el monto y método de pago. La deuda se reduce automáticamente.',
  },
  {
    id: 'c3',
    categoria: 'clientes',
    pregunta: '¿Qué es el "cupo de crédito"?',
    respuesta:
      'Es el monto máximo que un cliente puede deber. Si intentas venderle a crédito y excede el cupo, el sistema bloquea la venta.',
  },
  {
    id: 'c4',
    categoria: 'clientes',
    pregunta: '¿Cómo funciona el programa de lealtad?',
    respuesta:
      'Los clientes ganan 1 punto por cada $1.000 en compras. Los puntos se pueden canjear como descuento. Cada 1 punto = $100 de descuento. Los niveles son Bronze, Silver y Gold.',
  },

  // INVENTARIO
  {
    id: 'i1',
    categoria: 'inventario',
    pregunta: '¿Cómo registro una entrada de inventario?',
    respuesta:
      'Ve a "Más" → "Inventario", toca el "+", selecciona el producto, tipo "Entrada", cantidad y motivo. El stock se suma automáticamente.',
  },
  {
    id: 'i2',
    categoria: 'inventario',
    pregunta: '¿Qué diferencia hay entre entrada, salida y ajuste?',
    respuesta:
      'Entrada suma stock (compras), salida resta stock (mermas, robos), ajuste fija el stock exacto (inventario físico).',
  },

  // CAJA
  {
    id: 'ca1',
    categoria: 'caja',
    pregunta: '¿Cómo abro la caja?',
    respuesta:
      'Ve a "Más" → "Caja", toca "Abrir caja", ingresa el monto inicial (el efectivo con el que empiezas el turno).',
  },
  {
    id: 'ca2',
    categoria: 'caja',
    pregunta: '¿Cómo cierro la caja?',
    respuesta:
      'Con la caja abierta, toca "Cerrar caja", cuenta el efectivo físico e ingresa el monto declarado. El sistema calcula la diferencia.',
  },
  {
    id: 'ca3',
    categoria: 'caja',
    pregunta: '¿Qué es la "diferencia" al cerrar caja?',
    respuesta:
      'Es la resta entre lo que declaraste y lo que el sistema calculó. Si es positiva hay sobrante, si es negativa hay faltante.',
  },

  // REPORTES
  {
    id: 'r1',
    categoria: 'reportes',
    pregunta: '¿Qué reportes puedo exportar?',
    respuesta:
      'Ventas, inventario valorizado y cartera. Cada uno en formato PDF o Excel. Toca el botón correspondiente en "Reportes".',
  },
  {
    id: 'r2',
    categoria: 'reportes',
    pregunta: '¿Cómo cambio el período de los reportes?',
    respuesta:
      'En "Reportes" hay tres botones: 7 días, 30 días y 90 días. Toca el que quieras y los datos se actualizan.',
  },

  // CUENTA
  {
    id: 'cu1',
    categoria: 'cuenta',
    pregunta: '¿Cómo cambio mi contraseña?',
    respuesta:
      'Ve a "Más" → toca tu nombre → "Editar perfil". Baja hasta "Cambiar contraseña" e ingresa la nueva dos veces.',
  },
  {
    id: 'cu2',
    categoria: 'cuenta',
    pregunta: '¿Qué diferencia hay entre Admin y Vendedor?',
    respuesta:
      'El Admin puede gestionar usuarios, ver reportes, anular ventas y editar productos. El Vendedor solo puede vender y consultar información.',
  },
  {
    id: 'cu3',
    categoria: 'cuenta',
    pregunta: '¿Cómo cierro sesión?',
    respuesta:
      'Ve a "Más" y toca "Cerrar sesión" al final. Tendrás que ingresar de nuevo tus credenciales.',
  },
];

export const CATEGORIAS_FAQ: { value: FAQ['categoria']; label: string; icon: string }[] = [
  { value: 'ventas', label: 'Ventas', icon: 'cart-outline' },
  { value: 'productos', label: 'Productos', icon: 'package-variant-closed' },
  { value: 'clientes', label: 'Clientes', icon: 'account-group-outline' },
  { value: 'inventario', label: 'Inventario', icon: 'swap-horizontal' },
  { value: 'caja', label: 'Caja', icon: 'cash-register' },
  { value: 'reportes', label: 'Reportes', icon: 'chart-line' },
  { value: 'cuenta', label: 'Cuenta', icon: 'account-cog-outline' },
];