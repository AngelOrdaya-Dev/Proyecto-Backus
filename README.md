# Backus Ventas PWA – Catálogo Inteligente y Pedidos Offline

**Institución:** SENATI – Escuela de Tecnologías de la Información  
**Curso:** Taller de Aplicaciones Web Progresivas (PWA) – App Manifest  
**Instructor:** Jorge Luque Chambi  
**Proyecto:** Proyecto 1 · Backus Ventas PWA (Versión Mejorada)  
**Tecnologías:** Angular 17/19 · TypeScript · Angular Service Worker · Cache Storage · IndexedDB  

---

## 1. Descripción del Proyecto

Aplicación Web Progresiva (PWA) para la fuerza de distribución comercial de **Backus y Johnston**, orientada a resolver la pérdida de conectividad en zonas de baja cobertura (sótanos de centros comerciales, mercados y bodegas rurales).

Permite consultar el catálogo oficial de cervezas y bebidas, armar pedidos en el punto de venta con cálculo automático de importes y resguardar las transacciones en una base de datos local **IndexedDB**, garantizando operatividad 100% Offline y sincronización transparente cuando exista conexión a red.

---

## 2. Comandos de Instalación y Ejecución

### Prerrequisitos
* Node.js v18+ o superior
* NPM v9+

### Instalación de dependencias
Desde la raíz del repositorio o dentro de `App Manifest/backus-ventas-pwa`:
```bash
npm install
```

### Ejecución en Modo Desarrollo
```bash
npm start
```
Abre en tu navegador: `http://localhost:4200`

### Compilación para Producción con Service Worker
```bash
npm run build
```
Los archivos optimizados se generan en `dist/backus-ventas-pwa/browser`.

### Servir la versión de producción (Pruebas Offline Reales)
```bash
npm run serve
```
Abre en tu navegador: `http://localhost:8088`

---

## 3. Arquitectura y Mecanismos PWA Implementados

| Mecanismo | Archivo / Tecnología | Uso en este proyecto | Lo que NO significa |
|---|---|---|---|
| **App Manifest** | `manifest.webmanifest` | Nombre, iconos (`72x72` a `512x512`), colores corporativos (`#061838`) y modo `standalone`. | No guarda pedidos ni datos. |
| **Service Worker** | `@angular/service-worker` | Intercepta peticiones HTTP y sirve recursos desde `Cache Storage` (`Cache-First`). | No es una cola automática de POSTs. |
| **Cache Storage API** | `ngsw-config.json` | Almacenamiento local de assets y respuestas JSON del catálogo (`assets/data/catalogo.json`). | No almacena pedidos estructurados. |
| **IndexedDB** | `backusVentasDB` / `pedidos` | Base de datos NoSQL transaccional para persistir órdenes completas con estado `PENDIENTE`. | No sincroniza remotamente por sí sola sin API. |
| **navigator.onLine** | Eventos `online`/`offline` | Indicador reactivo del estado de conexión del navegador y simulador de pruebas. | No garantiza que un backend responda. |

---

## 4. Modelos de Datos TypeScript Oficiales (Página 4 del PDF)

```typescript
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
```

---

## 5. Matriz de Pruebas y Criterios de Aceptación (BV-01 al BV-07)

| ID | Regla / Prueba | Procedimiento | Resultado Verificable | Estado |
|---|---|---|---|---|
| **BV-01** | Búsqueda por nombre | Escribir `"pilsen"` o `"cristal"` en el buscador | Muestra coincidencias ignorando mayúsculas y minúsculas | **Aprobado** |
| **BV-02** | Búsqueda y categoría combinables | Seleccionar categoría `"Cervezas"` y buscar `"trigo"` | Filtra únicamente productos que satisfacen ambos filtros simultáneamente | **Aprobado** |
| **BV-03** | Cantidad entera positiva | Intentar ingresar 0, negativos o decimales con el stepper | Se rechazan valores inválidos; solo se aceptan enteros mayores que 0 | **Aprobado** |
| **BV-04** | Subtotal y Total | Agregar varios artículos al carrito | Subtotal = `precio × cantidad`. Los importes se formatean con 2 decimales (`S/ 9.50`) | **Aprobado** |
| **BV-05** | Persistencia previa | Guardar pedido y recargar la página (F5) | Los pedidos se recuperan intactos desde IndexedDB en la pestaña local | **Aprobado** |
| **BV-06** | Transparencia de estado | Guardar pedido en modo online u offline | Todo pedido inicia con estado `PENDIENTE` sin emitir falsos envíos a servidor | **Aprobado** |
| **BV-07** | Manejo de errores IndexedDB | Errores en transacciones | Se capturan las excepciones y se notifica error sin confirmar falso éxito | **Aprobado** |

---

## 6. Respuestas a las Preguntas de Reflexión (Sección H del PDF)

### 9. ¿Por qué persistir un pedido antes de confirmar el guardado?
**Respuesta:** En entornos móviles y de campo, la red es sumamente inestable. Si se intenta enviar directamente a la red sin un guardado local previo, cualquier microcorte o caída de señal puede ocasionar la pérdida total de la orden redactada por el vendedor. Persistir localmente en IndexedDB primero (*Offline-First*) garantiza que la información nunca se pierda y pueda ser despachada o reintentada en cualquier momento posterior.

### 10. ¿Qué diferencia hay entre Cache Storage e IndexedDB?
**Respuesta:**
* **Cache Storage API:** Está diseñada para almacenar pares de solicitud/respuesta HTTP (`Request`/`Response`), tales como archivos estáticos (HTML, JS, CSS, imágenes SVG) y respuestas GET de APIs o archivos JSON (`catalogo.json`).
* **IndexedDB:** Es una base de datos transaccional NoSQL orientada a objetos JSON en el cliente. Permite indexar, consultar, filtrar, actualizar y eliminar registros estructurados complejos (como la lista de pedidos con sus líneas, cantidades y estados).

### 11. ¿Qué debería enviarse a una API cuando se implemente la sincronización?
**Respuesta:** Debe enviarse un payload JSON que contenga:
1. El identificador único temporal del pedido (`uuid` o `localId`).
2. La fecha y hora exacta de registro en origen (`timestamp ISO-8601`).
3. El arreglo de líneas con `productoId`, `cantidad` y `precioUnitario`.
4. El total de la transacción.
5. El identificador del cliente / bodega (RUC / Código cliente) y el código del vendedor.
6. La firma o token de autenticación del usuario.  
Al recibir confirmación HTTP 200/201 del servidor central, el estado del pedido en IndexedDB se actualiza de `PENDIENTE` a `SINCRONIZADO`.

### 12. ¿Cómo evitarías duplicar pedidos tras varios intentos?
**Respuesta:**
1. **Identificador de Idempotencia (UUID):** Asignar a cada pedido un UUID único en el dispositivo cliente al momento de su creación.
2. **Validación en Backend:** La API verifica si el UUID recibido ya existe en la base de datos central; si ya existe, devuelve la orden previamente registrada sin duplicar el cobro ni la transacción.
3. **Bloqueo de Interfaz:** Deshabilitar los botones de sincronización durante el proceso (`sincronizando = true`) para evitar múltiples clics accidentales.

---

## 7. Limitaciones y Trabajo Futuro

* **API Mock:** El proyecto actual no cuenta con un backend empresarial con base de datos en la nube; por ello, la sincronización se maneja de forma local y controlada cumpliendo con el Criterio Técnico Transversal del docente.
* **Background Sync API:** En una fase posterior se puede integrar el evento `sync` del Service Worker para ejecutar la sincronización automática en segundo plano tan pronto el sistema operativo detecte conectividad, sin necesidad de que la ventana del navegador esté activa.
