import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Producto {
  id: number;
  producto: string;
  categoria: string;
  subcategoria?: string;
  precio: number;
  volumen?: string;
  graduacion?: string;
  descripcion?: string;
  badge?: string;
  popular?: boolean;
  color?: string;
  icono?: string;
  imagen?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CatalogoService {
  private url = 'assets/data/catalogo.json';

  constructor(private http: HttpClient) {}

  obtenerCatalogo(): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.url);
  }
}
