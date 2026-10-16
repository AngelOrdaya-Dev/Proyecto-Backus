# INFORME DE DESARROLLO DE SOFTWARE

## PROYECTO: APLICACIÓN WEB PROGRESIVA (PWA) – CATÁLOGO Y PEDIDOS OFFLINE BACKUS B2B

---

### DATOS GENERALES
* **Institución:** SENATI  
* **Carrera / Programa:** Desarrollo de Software / Tecnologías de la Información  
* **Curso:** Taller de Aplicaciones Web Progresivas (PWA)  
* **Tema Principal:** App Manifest, Service Workers, IndexedDB y Cache Storage  
* **Instructor:** Luque Chambi Jorge  
* **Fecha:** Octubre 2024  

---

## 1. INTRODUCCIÓN Y JUSTIFICACIÓN DEL PROYECTO

### 1.1 Contexto
La fuerza de ventas y distribución de **Unión de Cervecerías Peruanas Backus y Johnston S.A.A.** visita diariamente miles de bodegas, restaurantes y licorerías a lo largo de todo el país. Muchas de estas zonas comerciales sufren de intermitencias severas en la cobertura celular o ausencia total de conexión a Internet (sótanos de centros comerciales, mercados cerrados o zonas rurales).

### 1.2 Problema Identificado
Las aplicaciones web tradicionales fallan por completo ante la pérdida de señal, impidiendo consultar el catálogo oficial de precios de cervezas (Cusqueña, Pilsen, Cristal) y bebidas, así como la imposibilidad de levantar órdenes de compra en tiempo real, generando demoras logísticas y pérdida de ventas.

### 1.3 Solución Propuesta
Desarrollo de una **Progressive Web App (PWA)** basada en Angular que implemente:
1. **Web App Manifest:** Experiencia de instalación nativa sin depender de Play Store o App Store.
2. **Service Worker:** Intercepción de solicitudes de red y almacenamiento en caché de activos y catálogo (`Cache-First`).
3. **IndexedDB:** Base de datos transaccional local (`backusVentasDB`) para persistir pedidos cuando no hay señal.
4. **Sincronización:** Cola de despacho automático que sincroniza los pedidos una vez que se restablece la conectividad.

---

## 2. OBJETIVOS DEL SOFTWARE

### 2.1 Objetivo General
Implementar un catálogo digital interactivo y sistema de registro de pedidos comerciales en formato PWA, garantizando operatividad total del 100% en condiciones sin conexión (Offline).

### 2.2 Objetivos Específicos
* Configurar un **App Manifest** con metadatos de identidad, iconos responsivos (`72x72` hasta `512x512`), modo `standalone` y colores institucionales.
* Configurar el **Service Worker (`ngsw`)** para pre-cachear la interfaz de usuario y almacenar en caché el catálogo de productos (`catalogo.json`).
* Diseñar e implementar un almacén NoSQL local con **IndexedDB** para registrar pedidos con fecha, cliente, productos y totales.
* Desarrollar una interfaz de usuario moderna (Glassmorphism, Backus Deep Navy & Gold), intuitiva y adaptable a dispositivos móviles.

---

## 3. ESPECIFICACIÓN DE REQUERIMIENTOS

### 3.1 Requerimientos Funcionales (RF)
* **RF-01 (Consulta de Catálogo):** El sistema debe permitir visualizar las líneas de producto de Backus (Cervezas Clásicas, Premium, Artesanales y Bebidas sin alcohol) tanto con conexión como sin conexión.
* **RF-02 (Búsqueda y Filtros):** Permitir filtrar productos por categoría y buscar dinámicamente por nombre o atributos.
* **RF-03 (Gestión de Carrito):** Permitir agregar productos, modificar cantidades con steppers `[+] / [-]` y calcular subtotales, IGV (18%) y total general en tiempo real.
* **RF-04 (Persistencia en Modo Offline):** Si el dispositivo está sin red, el pedido debe guardarse localmente en la base de datos IndexedDB `backusVentasDB`.
* **RF-05 (Sincronización de Pedidos):** Al restablecer la red, el usuario puede sincronizar todas las órdenes pendientes hacia el servidor central con un solo clic.
* **RF-06 (Simulador de Red):** La aplicación debe contar con un interruptor para simular el modo Offline con fines de demostración académica y pruebas.
* **RF-07 (Auditoría Técnica):** Visualización interactiva del estado del Service Worker, Cache API y Manifest en la pestaña de Diagnóstico.

### 3.2 Requerimientos No Funcionales (RNF)
* **RNF-01 (Rendimiento):** Tiempo de carga inferior a 1.5 segundos mediante lectura local de caché.
* **RNF-02 (Instalabilidad):** Cumplimiento estricto de los criterios de PWA de Google Lighthouse.
* **RNF-03 (Usabilidad):** Diseño Mobile-First bajo estándares visuales modernos (Dark Mode, paleta oficial Backus Navy `#061838` y Oro Imperial `#D4AF37`).
* **RNF-04 (Compatibilidad):** Compatibilidad con navegadores modernos (Google Chrome, Microsoft Edge, Safari, Mozilla Firefox).

---

## 4. ARQUITECTURA DE SOFTWARE PWA

### 4.1 Diagrama de Bloques Arquitectónicos

```
+-------------------------------------------------------------+
|                  INTERFAZ DE USUARIO (UI)                   |
|         Catálogo  |  Carrito / Pedido  |  IndexedDB Hub     |
+-------------------------------------------------------------+
                              |
               +--------------+--------------+
               |                             |
      (Peticiones HTTP)             (Almacenamiento Local)
               |                             |
               v                             v
+-----------------------------+   +---------------------------+
|    SERVICE WORKER (NGSW)    |   |     INDEXEDDB STORAGE     |
|   - Cache-First (Assets)    |   |   - Database: backusVentasDB|
|   - DataGroup (catalogo)    |   |   - ObjectStore: pedidos  |
+-----------------------------+   +---------------------------+
               |
         +-----+-----+
         |           |
  (Con Conexión) (Sin Red)
         |           |
         v           v
    [Servidor]   [Cache Storage API]
```

### 4.2 Componentes Técnicos Implementados

#### A. Web App Manifest (`manifest.webmanifest`)
Define la identidad de la aplicación en el dispositivo cliente:
* **name:** `Backus Ventas B2B Móvil`
* **short_name:** `Backus PWA`
* **theme_color:** `#061838`
* **background_color:** `#080f1e`
* **display:** `standalone` (sin barras de URL del navegador)
* **icons:** Colección completa de 8 iconos PNG en resoluciones de 72px a 512px.

#### B. Service Worker (`@angular/service-worker` + `ngsw-config.json`)
* **assetGroups:** Pre-cachea el HTML, CSS compilado, bundles JavaScript y favicon (`installMode: prefetch`).
* **dataGroups:** Administra `/assets/data/catalogo.json` bajo la estrategia `performance` con una expiración máxima de 1 día.

#### C. IndexedDB (`StorageService`)
* **Base de datos:** `backusVentasDB`
* **Almacén:** `pedidos`
* **Estructura de registro:**
  ```json
  {
    "id": 1,
    "cliente": "Bodega Los Álamos",
    "items": [
      {
        "producto": "Cusqueña Dorada",
        "cantidad": 5,
        "precioUnitario": 9.50,
        "subtotal": 47.50
      }
    ],
    "total": 47.50,
    "mensaje": "Dejar con el encargado",
    "fecha": "2024-10-16T05:30:00.000Z",
    "estado": "pendiente"
  }
  ```

---

## 5. FLUJO OPERATIVO OFFLINE-FIRST

1. **Apertura de la Aplicación:** El Service Worker intercepta la solicitud inicial. Si no hay conexión, sirve los recursos desde `Cache Storage`.
2. **Navegación del Catálogo:** El archivo `catalogo.json` se entrega inmediatamente desde la caché local sin errores de red.
3. **Creación de Pedido:** El vendedor selecciona artículos y cantidades en el carrito.
4. **Verificación de Red:**
   * Si está **Online:** Se envía al servidor y se guarda registro en IndexedDB con estado `sincronizado`.
   * Si está **Offline:** Se guarda de forma atómica en IndexedDB con estado `pendiente`.
5. **Sincronización:** Al volver a contar con red, se activa la sincronización en lote, actualizando las órdenes a `sincronizado`.

---

## 6. RESULTADOS Y PRUEBAS REALIZADAS

| Caso de Prueba | Acción Realizada | Resultado Esperado | Resultado Obtenido | Estado |
|---|---|---|---|---|
| **CP-01** | Carga inicial de la PWA | Carga fluida con estilos corporativos y tipografía Plus Jakarta Sans | Carga inmediata sin latencia visible | **Aprobado** |
| **CP-02** | Filtrado por Categorías | Filtrar entre Cervezas, Artesanales y Bebidas | Filtra al instante en memoria | **Aprobado** |
| **CP-03** | Adición de productos al pedido | Aumentar cantidad y dar clic a "+ Agregar al Pedido" | Se actualiza el carrito y se muestra Toast | **Aprobado** |
| **CP-04** | Simulación de Modo Offline | Activar el botón "Simular Offline" | Header cambia a ámbar y activa aviso de red | **Aprobado** |
| **CP-05** | Emisión de pedido Offline | Clic en "Guardar Pedido en IndexedDB" | Se almacena en `backusVentasDB` con estado pendiente | **Aprobado** |
| **CP-06** | Sincronización en línea | Restaurar red y presionar "Sincronizar pendientes" | Todas las órdenes pasan a estado `sincronizado` | **Aprobado** |

---

## 7. CONCLUSIONES

1. Se logró transformar el catálogo básico en una **PWA moderna y de alto impacto visual** con la identidad corporativa de Backus (Navy & Gold).
2. Se demostró la eficacia del patrón **Offline-First**, permitiendo a los vendedores continuar con el registro de transacciones comerciales sin interrupción.
3. El uso conjunto de **Service Workers** e **IndexedDB** ofrece una experiencia análoga a una aplicación móvil nativa con un consumo mínimo de recursos y sin necesidad de instalación desde tiendas cerradas.
