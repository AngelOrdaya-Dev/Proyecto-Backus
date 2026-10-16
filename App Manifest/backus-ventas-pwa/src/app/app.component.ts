import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { CatalogoService, Producto } from './services/catalogo.service';
import { StorageService, Pedido, LineaPedido, EstadoPedido } from './services/storage.service';

interface CartItem {
  producto: Producto;
  cantidad: number;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Backus Ventas PWA';

  // Conexión
  isRealOnline = navigator.onLine;
  simularOffline = false;

  get isOnline(): boolean {
    return this.isRealOnline && !this.simularOffline;
  }

  // Navegación de pestañas
  tabActiva: 'catalogo' | 'carrito' | 'pedidos' | 'diagnostico' = 'catalogo';

  // Catálogo de productos
  productos: Producto[] = [];
  productosFiltrados: Producto[] = [];
  cargandoCatalogo = false;
  errorCatalogo = '';
  busqueda = '';
  categoriaSeleccionada = 'Todos';
  categorias: string[] = ['Todos', 'Cervezas', 'Artesanales', 'Bebidas'];

  // Carrito de compras / Pedido activo
  carrito: CartItem[] = [];
  clienteNombre = 'Bodega Los Álamos (RUC: 20458921471)';
  notasPedido = '';
  metodoPago = 'Efectivo contra entrega';

  // Cantidades temporales para cada producto en el catálogo
  cantidadesTemp: { [id: number]: number } = {};

  // Pedidos guardados en IndexedDB
  pedidosGuardados: Pedido[] = [];
  sincronizando = false;

  // Feedback Toast
  toastMensaje = '';
  toastTipo: 'exito' | 'info' | 'alerta' | 'error' | '' = '';
  toastTimer: any;

  // PWA Install Prompt
  deferredPrompt: any = null;
  appInstalada = false;

  // Estado del Service Worker
  swRegistrado = false;

  private onlineHandler = () => {
    this.isRealOnline = true;
    this.lanzarToast('Conexión a Internet restablecida.', 'exito');
  };

  private offlineHandler = () => {
    this.isRealOnline = false;
    this.lanzarToast('Conexión perdida. Modo Offline activado automáticamente.', 'alerta');
  };

  constructor(
    private catalogoService: CatalogoService,
    private storageService: StorageService
  ) {}

  ngOnInit(): void {
    window.addEventListener('online', this.onlineHandler);
    window.addEventListener('offline', this.offlineHandler);

    // Capturar evento PWA beforeinstallprompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
    });

    window.addEventListener('appinstalled', () => {
      this.appInstalada = true;
      this.deferredPrompt = null;
      this.lanzarToast('¡Backus PWA se ha instalado con éxito en tu dispositivo!', 'exito');
    });

    // Verificar Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(reg => {
        this.swRegistrado = !!reg;
      });
    }

    this.cargarCatalogo();
    this.cargarPedidos();
  }

  ngOnDestroy(): void {
    window.removeEventListener('online', this.onlineHandler);
    window.removeEventListener('offline', this.offlineHandler);
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  // --- Catálogo y Filtros (Reglas BV-01 y BV-02) ---
  cargarCatalogo(): void {
    this.cargandoCatalogo = true;
    this.errorCatalogo = '';
    this.catalogoService.obtenerCatalogo().subscribe({
      next: (data) => {
        this.productos = data;
        this.productos.forEach(p => {
          if (!this.cantidadesTemp[p.id]) {
            this.cantidadesTemp[p.id] = 1;
          }
        });
        this.filtrarProductos();
        this.cargandoCatalogo = false;
      },
      error: () => {
        this.errorCatalogo = 'Error al cargar catálogo. Se verificará en caché local.';
        this.cargandoCatalogo = false;
      }
    });
  }

  filtrarProductos(): void {
    let lista = this.productos;

    // Filtro por categoría combinable
    if (this.categoriaSeleccionada !== 'Todos') {
      lista = lista.filter(p => p.categoria.toLowerCase() === this.categoriaSeleccionada.toLowerCase());
    }

    // Filtro por nombre sin distinguir mayúsculas/minúsculas (BV-01 y BV-02)
    if (this.busqueda.trim()) {
      const q = this.busqueda.toLowerCase().trim();
      lista = lista.filter(p =>
        p.producto.toLowerCase().includes(q) ||
        (p.subcategoria && p.subcategoria.toLowerCase().includes(q)) ||
        (p.descripcion && p.descripcion.toLowerCase().includes(q))
      );
    }

    this.productosFiltrados = lista;
  }

  cambiarCategoria(cat: string): void {
    this.categoriaSeleccionada = cat;
    this.filtrarProductos();
  }

  // Regla BV-03: Cantidad entera positiva
  ajustarCantidadTemp(productoId: number, delta: number): void {
    const actual = this.cantidadesTemp[productoId] || 1;
    const nueva = Math.max(1, Math.min(99, Math.floor(actual + delta)));
    this.cantidadesTemp[productoId] = nueva;
  }

  // --- Carrito de Compras ---
  agregarAlCarrito(producto: Producto): void {
    const cantidad = Math.floor(this.cantidadesTemp[producto.id] || 1);

    // Validación BV-03: Solo enteros positivos
    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      this.lanzarToast('Cantidad inválida. Debe ser un entero positivo mayor que cero.', 'alerta');
      return;
    }

    const existente = this.carrito.find(item => item.producto.id === producto.id);

    if (existente) {
      existente.cantidad += cantidad;
    } else {
      this.carrito.push({
        producto,
        cantidad
      });
    }

    // Resetear cantidad temporal a 1
    this.cantidadesTemp[producto.id] = 1;
    this.lanzarToast(`+${cantidad} ${producto.producto} agregado al pedido`, 'info');
  }

  modificarCantidadCarrito(index: number, delta: number): void {
    const item = this.carrito[index];
    const nuevaCantidad = item.cantidad + delta;
    if (nuevaCantidad <= 0) {
      this.carrito.splice(index, 1);
    } else {
      item.cantidad = Math.floor(nuevaCantidad);
    }
  }

  eliminarDelCarrito(index: number): void {
    this.carrito.splice(index, 1);
  }

  vaciarCarrito(): void {
    this.carrito = [];
    this.lanzarToast('El pedido actual ha sido vaciado.', 'info');
  }

  get totalItemsCarrito(): number {
    return this.carrito.reduce((sum, item) => sum + item.cantidad, 0);
  }

  // Regla BV-04: Subtotal = precio x cantidad con 2 decimales
  get subtotalCarrito(): number {
    const sub = this.carrito.reduce((sum, item) => sum + (item.producto.precio * item.cantidad), 0);
    return Number(sub.toFixed(2));
  }

  get igvCarrito(): number {
    return Number((this.subtotalCarrito * 0.18).toFixed(2));
  }

  get totalCarrito(): number {
    return this.subtotalCarrito;
  }

  // --- Enviar o Guardar Pedido (Reglas BV-04, BV-05, BV-06, BV-07) ---
  async procesarPedido(): Promise<void> {
    if (this.carrito.length === 0) {
      this.lanzarToast('El pedido está vacío. Añade productos desde el catálogo.', 'alerta');
      return;
    }

    // Validar cantidades no nulas ni negativas
    for (const item of this.carrito) {
      if (!Number.isInteger(item.cantidad) || item.cantidad <= 0) {
        this.lanzarToast(`Cantidad no permitida para ${item.producto.producto}.`, 'alerta');
        return;
      }
    }

    // Modelo oficial LineaPedido exigido en el PDF de SENATI
    const lineas: LineaPedido[] = this.carrito.map(item => ({
      productoId: item.producto.id,
      producto: item.producto.producto,
      precioUnitario: item.producto.precio,
      cantidad: item.cantidad,
      subtotal: Number((item.producto.precio * item.cantidad).toFixed(2)),
      volumen: item.producto.volumen,
      imagen: item.producto.imagen
    }));

    // Modelo oficial Pedido exigido en el PDF de SENATI
    const nuevoPedido: Omit<Pedido, 'id'> = {
      fecha: new Date().toISOString(),
      lineas,
      total: this.totalCarrito,
      estado: 'PENDIENTE', // Criterio Transversal: Sin API real, todo pedido inicia como PENDIENTE
      origen: this.isOnline ? 'ONLINE' : 'OFFLINE',
      cliente: this.clienteNombre.trim() || 'Bodega Registrada',
      mensaje: this.notasPedido.trim(),
      metodoPago: this.metodoPago
    };

    try {
      // Regla BV-05: Persistencia en IndexedDB antes de confirmar
      await this.storageService.guardarPedido(nuevoPedido);
      await this.cargarPedidos();
      this.vaciarCarrito();
      this.notasPedido = '';
      this.tabActiva = 'pedidos'; // Redirigir automáticamente a la pestaña IndexedDB para visualizar el pedido persistido

      // Regla BV-06: Mensaje claro y honesto (sin falsas afirmaciones de servidor)
      if (this.isOnline) {
        this.lanzarToast('Pedido registrado en IndexedDB [PENDIENTE]. Con conexión: listo para sincronizar al integrar API.', 'exito');
      } else {
        this.lanzarToast('Modo Offline: Pedido guardado en IndexedDB [PENDIENTE]. Se mantendrá seguro hasta reconexión.', 'alerta');
      }
    } catch (err) {
      console.error('Error al persistir el pedido en IndexedDB:', err);
      // Regla BV-07: Error de IndexedDB informado sin falso éxito
      this.lanzarToast('Error al persistir el pedido en IndexedDB. No se guardaron cambios.', 'error');
    }
  }

  // --- Gestión IndexedDB ---
  async cargarPedidos(): Promise<void> {
    try {
      this.pedidosGuardados = await this.storageService.obtenerPedidos();
    } catch (e) {
      this.pedidosGuardados = [];
    }
  }

  async sincronizarPedidosPendientes(): Promise<void> {
    const pendientes = this.pedidosGuardados.filter(p => p.estado === 'PENDIENTE');
    if (pendientes.length === 0) {
      this.lanzarToast('No hay pedidos pendientes de sincronización.', 'info');
      return;
    }

    if (!this.isOnline) {
      this.lanzarToast('No puedes intentar sincronizar mientras estés en modo Offline.', 'alerta');
      return;
    }

    this.sincronizando = true;
    for (const pedido of pendientes) {
      if (pedido.id) {
        await new Promise(r => setTimeout(r, 450)); // Simulación de latencia de red
        await this.storageService.actualizarEstado(pedido.id, 'SINCRONIZADO');
      }
    }
    this.sincronizando = false;
    await this.cargarPedidos();
    this.lanzarToast(`¡${pendientes.length} pedidos marcados como SINCRONIZADOS!`, 'exito');
  }

  async eliminarPedido(id?: number): Promise<void> {
    if (!id) return;
    try {
      await this.storageService.eliminarPedido(id);
      await this.cargarPedidos();
      this.lanzarToast('Pedido eliminado de IndexedDB.', 'info');
    } catch (e) {
      this.lanzarToast('Error al eliminar el pedido de IndexedDB.', 'error');
    }
  }

  async limpiarTodosPedidos(): Promise<void> {
    if (confirm('¿Deseas vaciar todos los pedidos locales almacenados en IndexedDB?')) {
      try {
        await this.storageService.limpiarTodos();
        await this.cargarPedidos();
        this.lanzarToast('Base de datos IndexedDB local limpiada.', 'info');
      } catch (e) {
        this.lanzarToast('Error al limpiar la base de datos.', 'error');
      }
    }
  }

  get pedidosPendientesCount(): number {
    return this.pedidosGuardados.filter(p => p.estado === 'PENDIENTE').length;
  }

  // Formato #00124 mostrado en el wireframe de la página 10 del PDF
  formatearId(id?: number): string {
    return id ? '#' + id.toString().padStart(5, '0') : '#00000';
  }

  // Creación de Pedido de Demostración para evaluación de IndexedDB
  async crearPedidoPrueba(): Promise<void> {
    const pedidoDemo: Omit<Pedido, 'id'> = {
      fecha: new Date().toISOString(),
      cliente: 'Bodega San Martín (Demo Exposición)',
      lineas: [
        {
          productoId: 1,
          producto: 'Cusqueña Dorada 330ml',
          precioUnitario: 9.50,
          cantidad: 2,
          subtotal: 19.00,
          volumen: '330 ml',
          imagen: 'assets/images/products/cusquena-dorada.svg'
        },
        {
          productoId: 2,
          producto: 'Pilsen Callao 310ml',
          precioUnitario: 8.50,
          cantidad: 3,
          subtotal: 25.50,
          volumen: '310 ml',
          imagen: 'assets/images/products/pilsen-callao.svg'
        }
      ],
      total: 44.50,
      estado: 'PENDIENTE',
      origen: this.isOnline ? 'ONLINE' : 'OFFLINE',
      mensaje: 'Pedido de demostración para evaluación docente en IndexedDB',
      metodoPago: 'Efectivo contra entrega'
    };

    try {
      const id = await this.storageService.guardarPedido(pedidoDemo);
      await this.cargarPedidos();
      this.tabActiva = 'pedidos';
      this.lanzarToast(`¡Pedido #${id.toString().padStart(5, '0')} guardado en IndexedDB con éxito!`, 'exito');
    } catch (err) {
      console.error('Error al guardar pedido de prueba en IndexedDB:', err);
      this.lanzarToast('Error al persistir el pedido en IndexedDB.', 'error');
    }
  }

  // --- Toggle de Simulación de Red ---
  toggleSimuladorOffline(): void {
    this.simularOffline = !this.simularOffline;
    if (this.simularOffline) {
      this.lanzarToast('Simulación activada: Modo Offline forzado para demostración.', 'alerta');
    } else {
      this.lanzarToast('Simulación desactivada: Restaurado a estado de red real.', 'exito');
    }
  }

  // --- Instalación PWA ---
  instalarPWA(): void {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      this.deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          this.lanzarToast('¡Gracias por instalar Backus Ventas PWA!', 'exito');
        }
        this.deferredPrompt = null;
      });
    } else {
      this.lanzarToast('La app ya está instalada o tu navegador soporta instalación desde la barra de direcciones.', 'info');
    }
  }

  // --- Utilidades ---
  lanzarToast(mensaje: string, tipo: 'exito' | 'info' | 'alerta' | 'error'): void {
    this.toastMensaje = mensaje;
    this.toastTipo = tipo;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastMensaje = '';
      this.toastTipo = '';
    }, 4500);
  }

  formatearPrecio(precio: number): string {
    return `S/ ${precio.toFixed(2)}`;
  }
}
