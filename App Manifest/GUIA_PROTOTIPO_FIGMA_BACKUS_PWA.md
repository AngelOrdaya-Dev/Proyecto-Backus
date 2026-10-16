# Guía de Diseño y Prototipado en Figma – Backus Ventas PWA

**Curso:** Taller de Desarrollo PWA / Aplicaciones Web  
**Proyecto:** Bono Tracks – Catálogo Backus en modo PWA  
**Empresa / Caso:** Unión de Cervecerías Peruanas Backus y Johnston S.A.A.  

---

## 1. Sistema de Diseño (Design System Tokens)

### 1.1 Paleta Cromática (Colors)
* **Primary Royal Navy:** `#061838` (Fondo de Header y elementos principales)
* **Imperial Gold (Acento principal):** `#D4AF37` / `#F3C742` (Botones de acción, insignias, precios)
* **Dark Obsidian (Fondo de Pantalla):** `#080F1E` (Fondo general en modo oscuro)
* **Card Surface (Glassmorphism):** `#0F172A` con opacidad del 85% y borde `#FFFFFF` al 8%
* **Success Green (Conectado / Sincronizado):** `#10B981` / `#6EE7B7`
* **Warning Amber (Offline / Pendiente):** `#F59E0B` / `#FDE68A`
* **Text High-Contrast:** `#FFFFFF` y `#F1F5F9`
* **Text Muted / Subtítulos:** `#94A3B8` y `#64748B`

### 1.2 Tipografía (Typography)
* **Familia principal:** `Plus Jakarta Sans` o `Inter`
* **Escala jerárquica recomendada en Figma:**
  * **Display / Hero H1:** 24px - Bold (700/800)
  * **Section Titles H2:** 18px - Bold (700)
  * **Card Titles H3:** 16px - SemiBold (600)
  * **Body Regular:** 14px - Regular (400)
  * **Badges / Chips / Meta:** 11px - 12px - Bold (700)
  * **Precios destacados:** 18px - ExtraBold (800)

### 1.3 Efectos y Sombras
* **Card Elevation:** `0px 8px 24px rgba(0, 0, 0, 0.45)`
* **Gold Glow Effect:** `0px 0px 18px rgba(212, 175, 55, 0.35)`
* **Backdrop Blur:** 12px

---

## 2. Pantallas Principales a Replicar en Figma (Frames 375x812px o 1440x900px)

### Pantalla 1: Catálogo B2B de Productos (Home / Catalog Screen)
* **Header Superior:**
  * Logo de Corona Backus en gradiente dorado.
  * Título: "BACKUS B2B MÓVIL" con tag de versión.
  * Badge de Conexión: Indicador circular pulsante (`● EN LÍNEA` / `● OFFLINE`).
  * Botón de Carrito con burbuja de conteo numérico (`🛒 3`).
* **Barra de Navegación (Tabs):**
  * `[Catálogo]` (Icono SVG Botella - Activo con barra dorada inferior)
  * `[Pedido Activo]` (Icono SVG Portapapeles)
  * `[IndexedDB Local]` (Icono SVG Base de Datos)
  * `[Diagnóstico PWA]` (Icono SVG Engranaje de Ajustes)
* **Barra de Filtros y Búsqueda:**
  * Input con icono SVG de lupa: *"Buscar por marca, presentación..."*
  * Chips seleccionables: `[Todos]`, `[Cervezas]`, `[Artesanales]`, `[Bebidas]`.
* **Grid de Productos (Cards):**
  * Card con iluminación de fondo ambiental (Gold / Red / Green según la marca).
  * Ilustración vectorial SVG de la botella con etiquetas reales y reflejos de cristal.
  * Badges: *"Oro & Sabor"*, *"Clásico"*, *"Craft"*, *"Sin Alcohol"*.
  * Título del producto (Ej: *Cusqueña Dorada*, *Pilsen Callao*, *Cristal*).
  * Volumen y ABV: *620 ml • 5.0% Alc. Vol.*
  * Precio en Soles (*S/ 9.50*).
  * Selector de cantidad `[-] [1] [+]` y botón dorado `+ Agregar al Pedido`.

---

### Pantalla 2: Carrito y Emisión de Pedido (Checkout Screen)
* **Lista de Artículos Seleccionados:**
  * Fila por producto con icono, nombre, volumen, precio unitario y subtotal.
  * Botones pequeños para sumar, restar o eliminar.
* **Formulario Comercial:**
  * Campo: Cliente / Bodega (Ej: *Bodega Los Álamos - RUC 20458921471*).
  * Selector: Método de Pago (*Efectivo contra entrega, Transferencia, Yape/Plin, Crédito 15 días*).
  * Textarea: Notas e instrucciones del vendedor.
* **Caja de Totales:**
  * Subtotal sin IGV.
  * IGV (18%).
  * **Total a Pagar** en tipografía destacada dorada.
* **Indicador de Destino:**
  * Si está online: `Destino: Servidor Central Backus`
  * Si está offline: `Destino: IndexedDB Local (Modo Offline Seguro)`
* **Botón Principal:**
  * Botón grande dorado con icono SVG de envío: `Confirmar y Emitir Pedido`.

---

### Pantalla 3: Historial y Persistencia en IndexedDB (Offline Manager)
* **Encabezado con métricas:**
  * Conteo de órdenes pendientes de sincronización.
  * Botón de acción rápida: `Sincronizar X pendientes`.
* **Tarjetas de Pedidos Locales:**
  * Borde izquierdo verde (si está sincronizado) o ámbar (si está pendiente).
  * Número de Orden: `#ORD-1`, `#ORD-2`.
  * Detalle de productos, cantidades y subtotales.
  * Fecha y hora formateada.
  * Total general y botón para eliminar del almacenamiento local.

---

### Pantalla 4: Arquitectura y Auditoría PWA (Diagnostics Screen)
* 4 Módulos / Widgets explicativos para sustentar ante el profesor:
  1. **Web App Manifest:** Standalone, icon sizes (72 a 512px), theme-color.
  2. **Service Worker:** `@angular/service-worker`, Cache-First para estáticos.
  3. **IndexedDB:** `backusVentasDB`, store `pedidos`.
  4. **Cache Storage API:** Almacenamiento local del `catalogo.json`.
* **Diagrama de Flujo:** 4 pasos visuales con flechas que explican la arquitectura Offline-First.

---

## 3. Guía de Interacciones / Prototipado en Figma (Smart Animate)
1. **Click en `+ Agregar al Pedido`:** Realizar transición con toast flotante en la esquina inferior.
2. **Click en el Switch `Simular Offline`:** Cambiar estado del Header de verde a ámbar y desplegar el banner de aviso offline.
3. **Click en Tabs:** Navegación instantánea o slide horizontal suave de 200ms entre las 4 secciones.
