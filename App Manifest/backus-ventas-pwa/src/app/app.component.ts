import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { CatalogoService, Producto } from './services/catalogo.service';
import { StorageService } from './services/storage.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'backus-ventas-pwa';

  // Estado de conexión
  online = navigator.onLine;

  // Catálogo de productos
  productos: Producto[] = [];
  cargandoCatalogo = false;
  errorCatalogo = '';

  // Formulario de pedido/mensaje
  mensajeVendedor = '';
  productoSeleccionado = '';
  cantidad = 1;
  mensajeGuardado = '';
  tipoMensaje: 'exito' | 'info' | 'error' | '' = '';

  // Pedidos guardados
  pedidosGuardados: any[] = [];
  mostrarPedidos = false;

  private onlineHandler = () => { this.online = true; this.mensajeGuardado = ''; };
  private offlineHandler = () => { this.online = false; };

  constructor(
    private catalogoService: CatalogoService,
    private storageService: StorageService
  ) {}

  ngOnInit(): void {
    window.addEventListener('online', this.onlineHandler);
    window.addEventListener('offline', this.offlineHandler);
    this.cargarCatalogo();
    this.cargarPedidos();
  }

  ngOnDestroy(): void {
    window.removeEventListener('online', this.onlineHandler);
    window.removeEventListener('offline', this.offlineHandler);
  }

  cargarCatalogo(): void {
    this.cargandoCatalogo = true;
    this.errorCatalogo = '';
    this.catalogoService.obtenerCatalogo().subscribe({
      next: (data) => {
        this.productos = data;
        this.cargandoCatalogo = false;
      },
      error: (err) => {
        this.errorCatalogo = 'No se pudo cargar el catálogo.';
        this.cargandoCatalogo = false;
      }
    });
  }

  async guardarPedido(): Promise<void> {
    if (!this.mensajeVendedor.trim() && !this.productoSeleccionado) {
      this.mostrarMensaje('Por favor, ingresa un mensaje o selecciona un producto.', 'error');
      return;
    }

    const pedido = {
      producto: this.productoSeleccionado || 'Mensaje general',
      cantidad: this.cantidad,
      mensaje: this.mensajeVendedor,
      estado: 'pendiente'
    };

    if (this.online) {
      this.mostrarMensaje('✅ Conexión disponible. Pedido procesado correctamente.', 'exito');
    } else {
      try {
        await this.storageService.guardarPedido(pedido);
        this.mostrarMensaje('📦 Sin conexión. Pedido guardado localmente. Se enviará cuando haya conexión.', 'info');
        await this.cargarPedidos();
      } catch (e) {
        this.mostrarMensaje('❌ Error al guardar el pedido localmente.', 'error');
      }
    }

    // Limpiar formulario
    this.mensajeVendedor = '';
    this.productoSeleccionado = '';
    this.cantidad = 1;
  }

  async cargarPedidos(): Promise<void> {
    try {
      this.pedidosGuardados = await this.storageService.obtenerPedidos();
    } catch (e) {
      this.pedidosGuardados = [];
    }
  }

  mostrarMensaje(texto: string, tipo: 'exito' | 'info' | 'error'): void {
    this.mensajeGuardado = texto;
    this.tipoMensaje = tipo;
    setTimeout(() => {
      this.mensajeGuardado = '';
      this.tipoMensaje = '';
    }, 5000);
  }

  togglePedidos(): void {
    this.mostrarPedidos = !this.mostrarPedidos;
  }

  formatearPrecio(precio: number): string {
    return `S/ ${precio.toFixed(2)}`;
  }
}
