import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { CatalogoService, Producto } from './services/catalogo.service';
import { StorageService, PedidoRegistro, PedidoItem } from './services/storage.service';

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
  pedidosGuardados: PedidoRegistro[] = [];
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

  // --- Catálogo y Filtros ---
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

    if (this.categoriaSeleccionada !== 'Todos') {
      lista = lista.filter(p => p.categoria.toLowerCase() === this.categoriaSeleccionada.toLowerCase());
    }

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

  ajustarCantidadTemp(productoId: number, delta: number): void {
    const actual = this.cantidadesTemp[productoId] || 1;
    const nueva = Math.max(1, Math.min(99, actual + delta));
    this.cantidadesTemp[productoId] = nueva;
  }

  // --- Carrito de Compras ---
  agregarAlCarrito(producto: Producto): void {
    const cantidad = this.cantidadesTemp[producto.id] || 1;
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
    item.cantidad += delta;
    if (item.cantidad <= 0) {
      this.carrito.splice(index, 1);
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

  get subtotalCarrito(): number {
    return this.carrito.reduce((sum, item) => sum + (item.producto.precio * item.cantidad), 0);
  }

  get igvCarrito(): number {
    return this.subtotalCarrito * 0.18;
  }

  get totalCarrito(): number {
    return this.subtotalCarrito;
  }

  // --- Enviar o Guardar Pedido ---
  async procesarPedido(): Promise<void> {
    if (this.carrito.length === 0) {
      this.lanzarToast('El pedido está vacío. Añade productos desde el catálogo.', 'alerta');
      return;
    }

    const itemsPedido: PedidoItem[] = this.carrito.map(item => ({
      producto: item.producto.producto,
      cantidad: item.cantidad,
      precioUnitario: item.producto.precio,
      subtotal: item.producto.precio * item.cantidad,
      volumen: item.producto.volumen,
      imagen: item.producto.imagen
    }));

    const nuevoPedido: Partial<PedidoRegistro> = {
      cliente: this.clienteNombre,
      items: itemsPedido,
      total: this.totalCarrito,
      mensaje: this.notasPedido,
      metodoPago: this.metodoPago,
      estado: this.isOnline ? 'sincronizado' : 'pendiente'
    };

    if (this.isOnline) {
      // Simular transmisión inmediata a API Backend Backus y guardado de respaldo
      try {
        await this.storageService.guardarPedido(nuevoPedido);
        await this.cargarPedidos();
        this.vaciarCarrito();
        this.notasPedido = '';
        this.lanzarToast('✅ ¡Pedido transmitido con éxito al servidor central de Backus!', 'exito');
      } catch (err) {
        this.lanzarToast('Error al procesar el pedido.', 'error');
      }
    } else {
      // Modo Offline: Guardado local obligatorio en IndexedDB
      try {
        nuevoPedido.estado = 'pendiente';
        await this.storageService.guardarPedido(nuevoPedido);
        await this.cargarPedidos();
        this.vaciarCarrito();
        this.notasPedido = '';
        this.lanzarToast('💾 Sin conexión: Pedido guardado en IndexedDB. Se sincronizará automáticamente al volver en línea.', 'alerta');
      } catch (err) {
        this.lanzarToast('Error al persistir el pedido en IndexedDB.', 'error');
      }
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
    const pendientes = this.pedidosGuardados.filter(p => p.estado === 'pendiente');
    if (pendientes.length === 0) {
      this.lanzarToast('Todos los pedidos locales ya están sincronizados.', 'info');
      return;
    }

    if (!this.isOnline) {
      this.lanzarToast('No puedes sincronizar mientras estés en modo Offline.', 'alerta');
      return;
    }

    this.sincronizando = true;
    for (const pedido of pendientes) {
      if (pedido.id) {
        await new Promise(r => setTimeout(r, 400)); // Efecto de sincronización visual
        await this.storageService.marcarComoSincronizado(pedido.id);
      }
    }
    this.sincronizando = false;
    await this.cargarPedidos();
    this.lanzarToast(`🚀 ¡${pendientes.length} pedidos han sido sincronizados exitosamente con Backus!`, 'exito');
  }

  async eliminarPedido(id?: number): Promise<void> {
    if (!id) return;
    await this.storageService.eliminarPedido(id);
    await this.cargarPedidos();
    this.lanzarToast('Pedido eliminado del almacenamiento local.', 'info');
  }

  async limpiarTodosPedidos(): Promise<void> {
    if (confirm('¿Deseas vaciar todos los pedidos locales almacenados en IndexedDB?')) {
      await this.storageService.limpiarTodos();
      await this.cargarPedidos();
      this.lanzarToast('Base de datos IndexedDB local limpiada.', 'info');
    }
  }

  get pedidosPendientesCount(): number {
    return this.pedidosGuardados.filter(p => p.estado === 'pendiente').length;
  }

  // --- Toggle de Simulación de Red ---
  toggleSimuladorOffline(): void {
    this.simularOffline = !this.simularOffline;
    if (this.simularOffline) {
      this.lanzarToast('⚠️ Simulación activada: Modo Offline forzado para demostración.', 'alerta');
    } else {
      this.lanzarToast('🌐 Simulación desactivada: Restaurado a estado de red real.', 'exito');
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
