import { Injectable } from '@angular/core';

export interface PedidoItem {
  producto: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  volumen?: string;
  imagen?: string;
}

export interface PedidoRegistro {
  id?: number;
  cliente?: string;
  items: PedidoItem[];
  total: number;
  mensaje?: string;
  fecha: string;
  estado: 'pendiente' | 'sincronizado';
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
      const request = indexedDB.open(this.dbName, 2);

      request.onupgradeneeded = (event: any) => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, {
            keyPath: 'id',
            autoIncrement: true
          });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async guardarPedido(pedido: Partial<PedidoRegistro>): Promise<number> {
    const db = await this.abrirDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);

      const request = store.add({
        ...pedido,
        fecha: new Date().toISOString(),
        estado: pedido.estado || 'pendiente'
      });

      request.onsuccess = () => {
        resolve(request.result as number);
      };

      transaction.onerror = () => {
        reject(transaction.error);
      };
    });
  }

  async obtenerPedidos(): Promise<PedidoRegistro[]> {
    const db = await this.abrirDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        // Return sorted newest first
        const records = (request.result || []) as PedidoRegistro[];
        records.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
        resolve(records);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async marcarComoSincronizado(id: number): Promise<void> {
    const db = await this.abrirDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(id);

      request.onsuccess = () => {
        const data = request.result;
        if (data) {
          data.estado = 'sincronizado';
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
