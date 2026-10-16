import { Injectable } from '@angular/core';

export interface LineaPedido {
  productoId: number;
  producto: string;
  precioUnitario: number;
  cantidad: number;
  subtotal: number;
  volumen?: string;
  imagen?: string;
}

export type EstadoPedido = 'PENDIENTE' | 'SINCRONIZADO' | 'ERROR';

export interface Pedido {
  id?: number;
  fecha: string;
  lineas: LineaPedido[];
  total: number;
  estado: EstadoPedido;
  origen: 'ONLINE' | 'OFFLINE';
  cliente?: string;
  mensaje?: string;
  metodoPago?: string;
}

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  private dbName = 'backusVentasDB';
  private storeName = 'pedidos';

  async abrirDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB no está disponible en este navegador.'));
        return;
      }

      const request = indexedDB.open(this.dbName, 3);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, {
            keyPath: 'id',
            autoIncrement: true
          });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        console.error('Error al abrir IndexedDB:', request.error);
        reject(request.error);
      };
      request.onblocked = () => {
        console.warn('IndexedDB bloqueada por otra pestaña abierta.');
      };
    });
  }

  async guardarPedido(pedido: Omit<Pedido, 'id'>): Promise<number> {
    const db = await this.abrirDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);

      // Regla BV-06: Todo pedido inicia en estado PENDIENTE por transparencia de sincronización
      const registro: Omit<Pedido, 'id'> = {
        fecha: pedido.fecha || new Date().toISOString(),
        lineas: pedido.lineas,
        total: pedido.total,
        estado: 'PENDIENTE',
        origen: pedido.origen || 'ONLINE',
        cliente: pedido.cliente,
        mensaje: pedido.mensaje,
        metodoPago: pedido.metodoPago
      };

      const request = store.add(registro);

      request.onsuccess = () => resolve(request.result as number);
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async obtenerPedidos(): Promise<Pedido[]> {
    const db = await this.abrirDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        const records = (request.result || []) as Pedido[];
        records.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
        resolve(records);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async obtenerPedido(id: number): Promise<Pedido | undefined> {
    const db = await this.abrirDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result as Pedido);
      request.onerror = () => reject(request.error);
    });
  }

  async actualizarEstado(id: number, estado: EstadoPedido): Promise<void> {
    const db = await this.abrirDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(id);

      request.onsuccess = () => {
        const data = request.result;
        if (data) {
          data.estado = estado;
          store.put(data);
        }
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  async eliminarPedido(id: number): Promise<void> {
    const db = await this.abrirDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async contarPendientes(): Promise<number> {
    const pedidos = await this.obtenerPedidos();
    return pedidos.filter(p => p.estado === 'PENDIENTE').length;
  }

  async limpiarTodos(): Promise<void> {
    const db = await this.abrirDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}
