const fs = require('fs');
const path = require('path');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  Header,
  Footer,
  PageNumber,
  ShadingType
} = require('docx');

// Paleta Corporativa SENATI / Backus
const COLOR_PRIMARY = "003366";     // Navy SENATI
const COLOR_SECONDARY = "0B5394";   // Azul Intermedio
const COLOR_GOLD = "B8860B";        // Oro Backus
const COLOR_TEXT = "1E293B";        // Texto Principal
const COLOR_MUTED = "64748B";       // Subtítulos
const COLOR_BG_LIGHT = "F8FAFC";    // Fondo cajas / tablas
const COLOR_BG_BOX = "F1F5F9";      // Fondo cajas de captura
const COLOR_BORDER = "CBD5E1";      // Bordes
const COLOR_BORDER_PRIMARY = "003366";
const COLOR_WHITE = "FFFFFF";

// Helpers para Párrafos y Estilos
function pTitle(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 240, after: 120 },
    children: [
      new TextRun({
        text,
        font: "Arial",
        size: 38, // 19pt
        bold: true,
        color: COLOR_PRIMARY,
      }),
    ],
  });
}

function pSubtitle(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 60, after: 300 },
    children: [
      new TextRun({
        text,
        font: "Arial",
        size: 24, // 12pt
        color: COLOR_MUTED,
        italics: true,
      }),
    ],
  });
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 140 },
    children: [
      new TextRun({
        text,
        font: "Arial",
        size: 28, // 14pt
        bold: true,
        color: COLOR_PRIMARY,
      }),
    ],
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 260, after: 100 },
    children: [
      new TextRun({
        text,
        font: "Arial",
        size: 24, // 12pt
        bold: true,
        color: COLOR_SECONDARY,
      }),
    ],
  });
}

function p(text, options = {}) {
  return new Paragraph({
    alignment: options.alignment || AlignmentType.LEFT,
    spacing: { before: 60, after: 100 },
    children: [
      new TextRun({
        text,
        font: "Segoe UI",
        size: 21, // ~10.5pt
        color: options.color || COLOR_TEXT,
        bold: options.bold || false,
        italics: options.italics || false,
      }),
    ],
  });
}

function bullet(boldPrefix, normalText) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { before: 40, after: 60 },
    children: [
      new TextRun({
        text: boldPrefix + " ",
        font: "Segoe UI",
        size: 21,
        bold: true,
        color: COLOR_PRIMARY,
      }),
      new TextRun({
        text: normalText,
        font: "Segoe UI",
        size: 21,
        color: COLOR_TEXT,
      }),
    ],
  });
}

function calloutBox(title, text) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { type: ShadingType.CLEAR, fill: "EFF6FF" },
            margins: { top: 140, bottom: 140, left: 180, right: 180 },
            borders: {
              left: { style: BorderStyle.SINGLE, size: 24, color: COLOR_SECONDARY },
              top: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
            },
            children: [
              new Paragraph({
                spacing: { after: 60 },
                children: [
                  new TextRun({ text: title, font: "Arial", size: 22, bold: true, color: COLOR_SECONDARY })
                ]
              }),
              new Paragraph({
                children: [
                  new TextRun({ text, font: "Segoe UI", size: 20, color: COLOR_TEXT })
                ]
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

// Marco elegante para pegar captura de pantalla
function evidencePlaceholder(num, title, instructions) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { type: ShadingType.CLEAR, fill: COLOR_BG_BOX },
            margins: { top: 160, bottom: 160, left: 180, right: 180 },
            borders: {
              top: { style: BorderStyle.DASHED, size: 12, color: COLOR_BORDER },
              bottom: { style: BorderStyle.DASHED, size: 12, color: COLOR_BORDER },
              left: { style: BorderStyle.SINGLE, size: 20, color: COLOR_GOLD },
              right: { style: BorderStyle.DASHED, size: 12, color: COLOR_BORDER },
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                spacing: { after: 60 },
                children: [
                  new TextRun({ text: `[EVIDENCIA 0${num}] `, font: "Arial", size: 22, bold: true, color: COLOR_GOLD }),
                  new TextRun({ text: title, font: "Arial", size: 22, bold: true, color: COLOR_PRIMARY }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.LEFT,
                spacing: { after: 200 },
                children: [
                  new TextRun({ text: `Instrucción para la captura: ${instructions}`, font: "Segoe UI", size: 18, italics: true, color: COLOR_MUTED }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 300, after: 300 },
                children: [
                  new TextRun({
                    text: "[ PEGAR AQUÍ LA CAPTURA DE PANTALLA EN WORD ]",
                    font: "Arial",
                    size: 20,
                    bold: true,
                    color: "94A3B8",
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

// Construcción de Tablas Formateadas
function createTable(headers, rowsData) {
  const tableRows = [];

  // Header Row
  tableRows.push(
    new TableRow({
      tableHeader: true,
      children: headers.map(h => new TableCell({
        shading: { type: ShadingType.CLEAR, fill: COLOR_PRIMARY },
        margins: { top: 120, bottom: 120, left: 140, right: 140 },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 12, color: COLOR_BORDER_PRIMARY },
          bottom: { style: BorderStyle.SINGLE, size: 16, color: COLOR_BORDER_PRIMARY },
          left: { style: BorderStyle.SINGLE, size: 8, color: COLOR_BORDER },
          right: { style: BorderStyle.SINGLE, size: 8, color: COLOR_BORDER },
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.LEFT,
            children: [
              new TextRun({ text: h, font: "Arial", size: 20, bold: true, color: COLOR_WHITE })
            ]
          })
        ]
      }))
    })
  );

  // Data Rows
  rowsData.forEach((row, idx) => {
    const bgColor = idx % 2 === 0 ? COLOR_WHITE : COLOR_BG_LIGHT;
    tableRows.push(
      new TableRow({
        children: row.map((cellText, cIdx) => new TableCell({
          shading: { type: ShadingType.CLEAR, fill: bgColor },
          margins: { top: 100, bottom: 100, left: 140, right: 140 },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 6, color: COLOR_BORDER },
            bottom: { style: BorderStyle.SINGLE, size: 6, color: COLOR_BORDER },
            left: { style: BorderStyle.SINGLE, size: 6, color: COLOR_BORDER },
            right: { style: BorderStyle.SINGLE, size: 6, color: COLOR_BORDER },
          },
          children: [
            new Paragraph({
              alignment: AlignmentType.LEFT,
              children: [
                new TextRun({
                  text: cellText,
                  font: "Segoe UI",
                  size: 19,
                  bold: cIdx === 0,
                  color: cIdx === 0 ? COLOR_PRIMARY : COLOR_TEXT
                })
              ]
            })
          ]
        }))
      })
    );
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: tableRows
  });
}

// -------------------------------------------------------------
// CREACIÓN DEL DOCUMENTO COMPLETO
// -------------------------------------------------------------
const doc = new Document({
  sections: [
    {
      properties: {
        page: {
          margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 }, // 1 pulgada (2.54 cm)
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({ text: "SENATI | Taller PWA – Backus Ventas B2B Móvil", font: "Segoe UI", size: 16, color: COLOR_MUTED }),
              ],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: "Página ", font: "Segoe UI", size: 18, color: COLOR_MUTED }),
                new TextRun({ children: [PageNumber.CURRENT], font: "Segoe UI", size: 18, color: COLOR_MUTED }),
                new TextRun({ text: " de ", font: "Segoe UI", size: 18, color: COLOR_MUTED }),
                new TextRun({ children: [PageNumber.TOTAL_PAGES], font: "Segoe UI", size: 18, color: COLOR_MUTED }),
              ],
            }),
          ],
        }),
      },
      children: [
        // ==========================================
        // PORTADA / ENCABEZADO PRINCIPAL
        // ==========================================
        pTitle("INFORME TÉCNICO Y GUÍA DE EXPOSICIÓN"),
        pSubtitle("Desarrollo de Progressive Web App (PWA) con Soporte Offline y Persistencia en IndexedDB"),

        createTable(
          ["Dato", "Detalle Institucional y de Proyecto"],
          [
            ["Institución:", "SENATI – Escuela de Tecnologías de la Información"],
            ["Curso / Carrera:", "Desarrollo de Software / Taller de Aplicaciones Web Progresivas (PWA)"],
            ["Tema Evaluado:", "App Manifest, Service Workers, Cache Storage API e IndexedDB"],
            ["Instructor:", "Jorge Luque Chambi"],
            ["Proyecto:", "Proyecto 1 · Backus Ventas PWA (Versión Mejorada)"],
            ["Empresa Caso de Estudio:", "Unión de Cervecerías Peruanas Backus y Johnston S.A.A."],
            ["Entregables:", "Código Fuente Angular, Guía Figma, Evidencias y Documentación"],
          ]
        ),

        new Paragraph({ spacing: { after: 200 } }),

        // ==========================================
        // 1. INTRODUCCIÓN Y PROBLEMA EMPRESARIAL
        // ==========================================
        h1("1. Introducción y Justificación Empresarial"),
        p("La fuerza de ventas y distribución comercial de Unión de Cervecerías Peruanas Backus y Johnston S.A.A. visita a diario miles de bodegas, minimarkets y restaurantes a nivel nacional. Muchas de estas zonas comerciales carecen de señal celular estable (sótanos de centros comerciales, mercados de abastos tradicionales o zonas rurales)."),
        p("Una aplicación web convencional colapsa ante la falta de red, impidiendo al vendedor consultar los precios oficiales de cervezas emblemáticas (Cusqueña, Pilsen, Cristal) y levantar pedidos de reposición. Esto ocasiona demoras logísticas y pérdida de ventas."),
        calloutBox(
          "Solución Implementada: Arquitectura PWA Offline-First",
          "Se transformó el catálogo en una Aplicación Web Progresiva (PWA) instalable, con caché predictivo mediante Service Worker y almacenamiento local en IndexedDB. El vendedor puede operar al 100% sin conexión a Internet y registrar los pedidos de forma confiable."
        ),

        // ==========================================
        // 2. ARQUITECTURA PWA: LOS 4 PILARES TÉCNICOS
        // ==========================================
        h1("2. Arquitectura de Software: Los 4 Pilares PWA"),
        p("Para responder con solvencia durante la sustentación ante el docente, la solución se sustenta en 4 mecanismos que trabajan en conjunto pero cumplen responsabilidades independientes:"),

        createTable(
          ["Mecanismo", "Archivo / Implementación", "Función en el Proyecto", "Lo que NO hace (Criterio Docente)"],
          [
            ["1. App Manifest", "manifest.webmanifest", "Define nombre, iconos (72x72 a 512px), color corporativo (#061838) y modo standalone.", "No guarda pedidos ni información comercial."],
            ["2. Service Worker", "@angular/service-worker (ngsw)", "Intercepta peticiones de red y entrega recursos estáticos pre-cacheados (Cache-First).", "No encola automáticamente peticiones POST a servidores."],
            ["3. Cache Storage", "ngsw-config.json (dataGroups)", "Almacena en caché el archivo catalogo.json con estrategia performance.", "No guarda datos transaccionales de compras."],
            ["4. IndexedDB", "StorageService (backusVentasDB)", "Base de datos NoSQL transaccional que almacena pedidos estructurados completos con estado PENDIENTE.", "No transmite datos a la nube por sí sola sin una API remota."],
          ]
        ),

        new Paragraph({ spacing: { after: 140 } }),

        // ==========================================
        // 3. MODELO DE DATOS Y REGLAS DE NEGOCIO
        // ==========================================
        h1("3. Modelo de Datos y Validación Técnica (PDF Pág. 4)"),
        p("Se implementaron rigurosamente las interfaces TypeScript requeridas por el instructor en la Sección C del PDF oficial:"),

        bullet("LineaPedido:", "Almacena productoId, producto, precioUnitario, cantidad y subtotal con 2 decimales."),
        bullet("EstadoPedido:", "Tipo estricto ('PENDIENTE' | 'SINCRONIZADO' | 'ERROR'). Todo pedido inicia como PENDIENTE."),
        bullet("Pedido:", "Estructura completa que agrupa id, fecha ISO, arreglo de lineas, total, cliente, estado y origen ('ONLINE' | 'OFFLINE')."),

        calloutBox(
          "Criterio Técnico Transversal de Honestidad de Sincronización",
          "El sistema nunca afirma falsamente que el pedido fue enviado a un servidor remoto, dado que no existe un backend corporativo real en esta fase. Todo pedido inicia explícitamente en estado PENDIENTE, cumpliendo con la exigencia académica del docente."
        ),

        // ==========================================
        // 4. GUIÓN DE EXPOSICIÓN PASO A PASO
        // ==========================================
        h1("4. Guión Práctico para la Exposición ante el Docente"),
        p("Para realizar una demostración fluida y convincente de 5 a 10 minutos, sigue este orden:"),

        bullet("Paso 1 (Presentación Inicial):", "Abrir la aplicación en el navegador. Mostrar el diseño corporativo Backus (Navy y Oro), la tipografía Plus Jakarta Sans y la ausencia total de emojis gracias al uso de iconos vectoriales SVG limpios e imágenes de producto."),
        bullet("Paso 2 (Catálogo y Filtros):", "Escribir 'pilsen' o 'trigo' en el buscador para demostrar filtrado insensible a mayúsculas/minúsculas (Regla BV-01). Combinar con el chip de categoría 'Cervezas' (Regla BV-02)."),
        bullet("Paso 3 (Carrito y Cálculos):", "Seleccionar cantidades con el stepper [+] / [-]. Añadir al pedido y navegar a la pestaña 'Pedido Activo'. Explicar el cálculo en tiempo real de Subtotal, IGV (18%) y Total general."),
        bullet("Paso 4 (Demostración Offline):", "Activar el botón 'Simular Offline' en el Header (o activar DevTools -> Network -> Offline). Mostrar cómo la barra superior cambia a ámbar y el destino se ajusta automáticamente a 'IndexedDB Local'."),
        bullet("Paso 5 (Guardado en IndexedDB):", "Presionar 'Guardar Pedido en IndexedDB'. Abrir la pestaña 'IndexedDB Local' y mostrar que la orden aparece registrada con código (#00124), origen OFFLINE y estado PENDIENTE."),
        bullet("Paso 6 (Verificación en DevTools):", "Abrir DevTools -> Application -> Storage -> IndexedDB -> backusVentasDB -> pedidos. Demostrar al docente el registro JSON real en el navegador."),

        // ==========================================
        // 5. MATRIZ DE PRUEBAS DE ACEPTACIÓN
        // ==========================================
        h1("5. Matriz de Pruebas de Aceptación (Reglas BV-01 al BV-07)"),
        p("Resultados de las pruebas funcionales ejecutadas sobre la aplicación:"),

        createTable(
          ["ID", "Regla Evaluada", "Procedimiento de Prueba", "Resultado Esperado", "Estado"],
          [
            ["BV-01", "Búsqueda por nombre", "Escribir 'pilsen' en minúsculas en el buscador.", "Muestra coincidencias ignorando mayúsculas/minúsculas.", "APROBADO"],
            ["BV-02", "Búsqueda + Categoría", "Seleccionar 'Cervezas' y buscar 'trigo'.", "Filtra únicamente los productos que cumplen ambas condiciones.", "APROBADO"],
            ["BV-03", "Cantidad entera positiva", "Ingresar ceros, negativos o decimales.", "El stepper valida e impide cantidades menores que 1.", "APROBADO"],
            ["BV-04", "Cálculo Subtotal y Total", "Añadir 2 botellas de S/ 9.50 y 1 de S/ 8.50.", "Calcula Subtotal S/ 27.50 e IGV 18% con exactitud.", "APROBADO"],
            ["BV-05", "Persistencia previa", "Guardar pedido y recargar la página (F5).", "El pedido sigue presente en la pestaña de IndexedDB.", "APROBADO"],
            ["BV-06", "Sin API no hay sync", "Guardar en modo online u offline.", "El pedido conserva estado PENDIENTE con mensaje transparente.", "APROBADO"],
            ["BV-07", "Error de IndexedDB", "Captura de errores en transacciones.", "Se notifica al usuario sin arrojar mensajes falsos de éxito.", "APROBADO"],
          ]
        ),

        new Paragraph({ spacing: { after: 140 } }),

        // ==========================================
        // 6. PREGUNTAS DE REFLEXIÓN (SECCIÓN H)
        // ==========================================
        h1("6. Respuestas a las Preguntas de Reflexión (Página 5)"),
        p("Estas respuestas están redactadas técnicamente para responder cualquier pregunta sorpresa del docente:"),

        bullet("9. ¿Por qué persistir un pedido antes de confirmar el guardado?", "Porque en aplicaciones móviles de campo la conectividad es volátil. Persistir primero en IndexedDB (patrón Offline-First) garantiza que ninguna orden se pierda por un microcorte de red, permitiendo reintentar el despacho en cualquier momento."),
        bullet("10. ¿Qué diferencia hay entre Cache Storage e IndexedDB?", "Cache Storage almacena pares de solicitud y respuesta HTTP (Request/Response) como archivos HTML, CSS, bundles JS, fuentes e imágenes SVG. En cambio, IndexedDB es una base de datos NoSQL transaccional que guarda objetos de datos estructurados (como los pedidos con clientes, cantidades y totales)."),
        bullet("11. ¿Qué debería enviarse a una API cuando se implemente la sincronización?", "Un objeto JSON con: identificador UUID de idempotencia, timestamp ISO, código del cliente/bodega, código del vendedor, lista de ítems con productoId, cantidad y precio unitario, y token de seguridad. Al recibir HTTP 200/201 del servidor, el pedido pasa a SINCRONIZADO."),
        bullet("12. ¿Cómo evitarías duplicar pedidos tras varios intentos?", "Mediante dos mecanismos: (1) Generar un UUID único en el cliente para cada pedido y validarlo en el backend antes de insertar; si ya existe, se devuelve la orden previa. (2) Deshabilitar los botones de envío en la interfaz mientras la sincronización esté en curso."),

        // ==========================================
        // 7. SECCIÓN DE EVIDENCIAS (ESPACIO PARA CAPTURAS)
        // ==========================================
        h1("7. Evidencias del Proyecto (Capturas de Pantalla)"),
        p("A continuación se presentan los espacios prediseñados para insertar las 5 capturas solicitadas en la rúbrica oficial:"),

        evidencePlaceholder(
          1,
          "Catálogo de Productos con Búsqueda y Filtros",
          "Tomar captura del catálogo mostrando la barra de búsqueda con un término filtrado y los chips de categoría seleccionados."
        ),

        new Paragraph({ spacing: { after: 160 } }),

        evidencePlaceholder(
          2,
          "Resumen de Pedido y Carrito de Compras",
          "Tomar captura de la pestaña 'Pedido Activo' con al menos 2 productos agregados, mostrando el cálculo de Subtotal, IGV y Total."
        ),

        new Paragraph({ spacing: { after: 160 } }),

        evidencePlaceholder(
          3,
          "Modo Offline y Detección de Conexión",
          "Activar el botón 'Simular Offline'. Tomar captura donde se observe el banner ámbar de aviso y la insignia 'Destino: IndexedDB Local'."
        ),

        new Paragraph({ spacing: { after: 160 } }),

        evidencePlaceholder(
          4,
          "Historial de Pedidos en IndexedDB (#00124)",
          "Tomar captura de la pestaña 'IndexedDB Local' mostrando la lista de órdenes registradas con fecha, monto y estado PENDIENTE."
        ),

        new Paragraph({ spacing: { after: 160 } }),

        evidencePlaceholder(
          5,
          "Inspección de IndexedDB en DevTools (F12)",
          "Abrir la consola (F12) -> Pestaña Application -> Storage -> IndexedDB -> backusVentasDB -> pedidos. Tomar captura de los registros JSON guardados."
        ),

        new Paragraph({ spacing: { after: 200 } }),

        // ==========================================
        // 8. CONCLUSIONES
        // ==========================================
        h1("8. Conclusiones y Recomendaciones"),
        bullet("Conclusión 1:", "La implementación de Service Workers y Cache Storage reduce a cero los tiempos de latencia en la carga de recursos estáticos del catálogo."),
        bullet("Conclusión 2:", "IndexedDB demostró ser la tecnología óptima en el cliente para salvaguardar transacciones críticas comerciales sin depender de conexión permanente."),
        bullet("Conclusión 3:", "El rediseño visual sin emojis, empleando SVGs vectoriales y la paleta institucional de Backus, otorga un acabado profesional apto para presentación empresarial."),
      ],
    },
  ],
});

// Guardar archivo Word
const outputPath = path.join(__dirname, "Documentacion_Proyecto_Backus_PWA_SENATI.docx");
Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(outputPath, buffer);
  console.log(`Documento Word generado exitosamente en: ${outputPath}`);
});
