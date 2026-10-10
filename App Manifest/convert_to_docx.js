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

const mdPath = 'C:\\Users\\Alumno-ETI\\.gemini\\antigravity-ide\\brain\\cd6ad0b9-4dc2-46ce-98ae-2d55f831ef86\\documentacion_backus_pwa.md';
const outputPath = 'C:\\Users\\Alumno-ETI\\Downloads\\App Manifest\\Documentacion_Backus_Ventas_PWA_SENATI.docx';

const content = fs.readFileSync(mdPath, 'utf8');
const lines = content.split(/\r?\n/);

// Colors
const COLOR_PRIMARY = "003366";     // SENATI Navy
const COLOR_SECONDARY = "0B5394";   // Lighter Blue
const COLOR_TEXT = "222222";        // Main Text
const COLOR_MUTED = "555555";       // Subtitle / Muted
const COLOR_CODE_BG = "F4F6F9";     // Code / Block background
const COLOR_BORDER = "D1D5DB";      // Border color
const COLOR_WHITE = "FFFFFF";

function parseInlineRuns(text, options = {}) {
  const runs = [];
  // Tokenize for **bold**, *italic*, and `code`
  const regex = /(\*\*([^*]+)\*\*|`([^`]+)`|\*([^*]+)\*)/g;
  let lastIdx = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      runs.push(new TextRun({
        text: text.substring(lastIdx, match.index),
        font: options.font || 'Segoe UI',
        size: options.size || 22,
        color: options.color || COLOR_TEXT,
        bold: options.bold || false,
        italics: options.italics || false,
      }));
    }

    if (match[2] !== undefined) {
      // Bold
      runs.push(new TextRun({
        text: match[2],
        font: options.font || 'Segoe UI',
        size: options.size || 22,
        color: options.color || COLOR_TEXT,
        bold: true,
      }));
    } else if (match[3] !== undefined) {
      // Inline Code
      runs.push(new TextRun({
        text: match[3],
        font: 'Consolas',
        size: (options.size || 22) - 2,
        color: 'B31D28', // Dark Red for inline code
        shading: { fill: 'F0F2F5', type: ShadingType.CLEAR }
      }));
    } else if (match[4] !== undefined) {
      // Italic
      runs.push(new TextRun({
        text: match[4],
        font: options.font || 'Segoe UI',
        size: options.size || 22,
        color: options.color || COLOR_TEXT,
        italics: true,
      }));
    }
    lastIdx = regex.lastIndex;
  }

  if (lastIdx < text.length) {
    runs.push(new TextRun({
      text: text.substring(lastIdx),
      font: options.font || 'Segoe UI',
      size: options.size || 22,
      color: options.color || COLOR_TEXT,
      bold: options.bold || false,
      italics: options.italics || false,
    }));
  }

  if (runs.length === 0) {
    runs.push(new TextRun({
      text: text,
      font: options.font || 'Segoe UI',
      size: options.size || 22,
      color: options.color || COLOR_TEXT
    }));
  }

  return runs;
}

const docChildren = [];

// Front page / Header
docChildren.push(
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 100 },
    children: [
      new TextRun({
        text: "SENATI",
        font: "Segoe UI",
        size: 40,
        bold: true,
        color: COLOR_PRIMARY,
      }),
    ],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 200 },
    children: [
      new TextRun({
        text: "DIRECCIÓN ZONAL AREQUIPA-PUNO / CFP AREQUIPA",
        font: "Segoe UI",
        size: 20,
        bold: true,
        color: COLOR_SECONDARY,
      }),
    ],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 400 },
    children: [
      new TextRun({
        text: "ESCUELA DE TECNOLOGÍAS DE LA INFORMACIÓN (ETI)",
        font: "Segoe UI",
        size: 22,
        bold: true,
        color: COLOR_PRIMARY,
      }),
    ],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 200 },
    children: [
      new TextRun({
        text: "DOCUMENTACIÓN TÉCNICA DE APLICACIÓN",
        font: "Segoe UI",
        size: 26,
        bold: true,
        color: COLOR_SECONDARY,
      }),
    ],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 100, after: 100 },
    children: [
      new TextRun({
        text: "BACKUS VENTAS PWA",
        font: "Segoe UI",
        size: 44,
        bold: true,
        color: COLOR_PRIMARY,
      }),
    ],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 500 },
    children: [
      new TextRun({
        text: "Aplicación Web Progresiva para Consulta de Catálogo y Registro de Pedidos Offline",
        font: "Segoe UI",
        size: 24,
        italics: true,
        color: COLOR_MUTED,
      }),
    ],
  })
);

// Metadata box in cover
const metaTable = new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows: [
    new TableRow({
      children: [
        new TableCell({
          shading: { fill: "F0F4F9", type: ShadingType.CLEAR },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 8, color: COLOR_PRIMARY },
            bottom: { style: BorderStyle.SINGLE, size: 8, color: COLOR_PRIMARY },
            left: { style: BorderStyle.SINGLE, size: 8, color: COLOR_PRIMARY },
            right: { style: BorderStyle.SINGLE, size: 8, color: COLOR_PRIMARY },
          },
          margins: { top: 160, bottom: 160, left: 240, right: 240 },
          children: [
            new Paragraph({
              spacing: { after: 80 },
              children: [
                new TextRun({ text: "Taller: ", bold: true, color: COLOR_PRIMARY, font: "Segoe UI", size: 22 }),
                new TextRun({ text: "Aplicaciones Web Progresivas (PWA) – App Manifest", font: "Segoe UI", size: 22 })
              ]
            }),
            new Paragraph({
              spacing: { after: 80 },
              children: [
                new TextRun({ text: "Instructor: ", bold: true, color: COLOR_PRIMARY, font: "Segoe UI", size: 22 }),
                new TextRun({ text: "Luque Chambi Jorge", font: "Segoe UI", size: 22 })
              ]
            }),
            new Paragraph({
              spacing: { after: 80 },
              children: [
                new TextRun({ text: "Entorno: ", bold: true, color: COLOR_PRIMARY, font: "Segoe UI", size: 22 }),
                new TextRun({ text: "Angular 17 + TypeScript + Service Worker + IndexedDB", font: "Segoe UI", size: 22 })
              ]
            }),
            new Paragraph({
              spacing: { after: 0 },
              children: [
                new TextRun({ text: "Versión: ", bold: true, color: COLOR_PRIMARY, font: "Segoe UI", size: 22 }),
                new TextRun({ text: "1.0.0 – Producción / Octubre 2026", font: "Segoe UI", size: 22 })
              ]
            })
          ]
        })
      ]
    })
  ]
});
docChildren.push(metaTable);
docChildren.push(new Paragraph({ spacing: { before: 300, after: 300 }, children: [] }));

// Iterate markdown lines and parse blocks
let i = 0;
// Skip markdown cover lines until we hit the first section or index
while (i < lines.length) {
  const line = lines[i];
  if (line.startsWith('## ÍNDICE') || line.startsWith('## 1. INTRODUCCIÓN')) {
    break;
  }
  i++;
}

let inCodeBlock = false;
let codeBlockLines = [];
let codeBlockLang = '';

while (i < lines.length) {
  const line = lines[i];

  // Code block start/end
  if (line.startsWith('```')) {
    if (inCodeBlock) {
      // Flush code block
      const codeParagraphs = codeBlockLines.map(cLine => new Paragraph({
        spacing: { before: 20, after: 20 },
        children: [
          new TextRun({
            text: cLine || ' ',
            font: 'Consolas',
            size: 18,
            color: '1F2937'
          })
        ]
      }));

      const codeTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                shading: { fill: COLOR_CODE_BG, type: ShadingType.CLEAR },
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
                  bottom: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
                  left: { style: BorderStyle.SINGLE, size: 8, color: COLOR_SECONDARY },
                  right: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
                },
                margins: { top: 120, bottom: 120, left: 160, right: 160 },
                children: codeParagraphs.length > 0 ? codeParagraphs : [new Paragraph({ children: [] })]
              })
            ]
          })
        ]
      });

      docChildren.push(codeTable);
      docChildren.push(new Paragraph({ spacing: { before: 80, after: 80 }, children: [] }));

      inCodeBlock = false;
      codeBlockLines = [];
    } else {
      inCodeBlock = true;
      codeBlockLang = line.replace('```', '').trim();
      codeBlockLines = [];
    }
    i++;
    continue;
  }

  if (inCodeBlock) {
    codeBlockLines.push(line);
    i++;
    continue;
  }

  // Horizontal divider
  if (line.trim() === '---') {
    docChildren.push(new Paragraph({
      spacing: { before: 140, after: 140 },
      border: {
        bottom: { color: "CBD5E1", size: 6, space: 1, style: BorderStyle.SINGLE }
      },
      children: []
    }));
    i++;
    continue;
  }

  // Heading 1 (# ...)
  if (line.startsWith('# ')) {
    const text = line.replace('# ', '').trim();
    docChildren.push(new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 360, after: 140 },
      children: [
        new TextRun({
          text: text,
          font: 'Segoe UI',
          size: 32,
          bold: true,
          color: COLOR_PRIMARY
        })
      ]
    }));
    i++;
    continue;
  }

  // Heading 2 (## ...)
  if (line.startsWith('## ')) {
    const text = line.replace('## ', '').trim();
    docChildren.push(new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 300, after: 120 },
      children: [
        new TextRun({
          text: text,
          font: 'Segoe UI',
          size: 26,
          bold: true,
          color: COLOR_PRIMARY
        })
      ]
    }));
    i++;
    continue;
  }

  // Heading 3 (### ...)
  if (line.startsWith('### ')) {
    const text = line.replace('### ', '').trim();
    docChildren.push(new Paragraph({
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 240, after: 80 },
      children: [
        new TextRun({
          text: text,
          font: 'Segoe UI',
          size: 23,
          bold: true,
          color: COLOR_SECONDARY
        })
      ]
    }));
    i++;
    continue;
  }

  // Heading 4 (#### ...)
  if (line.startsWith('#### ')) {
    const text = line.replace('#### ', '').trim();
    docChildren.push(new Paragraph({
      heading: HeadingLevel.HEADING_4,
      spacing: { before: 180, after: 60 },
      children: [
        new TextRun({
          text: text,
          font: 'Segoe UI',
          size: 21,
          bold: true,
          color: COLOR_TEXT
        })
      ]
    }));
    i++;
    continue;
  }

  // Callout / Blockquote (> ...)
  if (line.startsWith('>')) {
    const calloutLines = [];
    while (i < lines.length && lines[i].startsWith('>')) {
      let cl = lines[i].replace(/^>\s?/, '');
      if (cl.startsWith('[!NOTE]') || cl.startsWith('[!IMPORTANT]') || cl.startsWith('[!TIP]')) {
        cl = '📌 NOTA IMPORTANTE:';
      }
      calloutLines.push(cl);
      i++;
    }

    const calloutPars = calloutLines.map((cl, idx) => new Paragraph({
      spacing: { before: 40, after: 40 },
      children: parseInlineRuns(cl, {
        size: 21,
        color: idx === 0 && cl.includes('NOTA') ? COLOR_PRIMARY : COLOR_TEXT,
        bold: idx === 0 && cl.includes('NOTA')
      })
    }));

    const calloutTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              shading: { fill: "EFF6FF", type: ShadingType.CLEAR },
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.SINGLE, size: 24, color: COLOR_PRIMARY },
                right: { style: BorderStyle.NONE },
              },
              margins: { top: 120, bottom: 120, left: 180, right: 180 },
              children: calloutPars
            })
          ]
        })
      ]
    });

    docChildren.push(calloutTable);
    docChildren.push(new Paragraph({ spacing: { before: 60, after: 60 }, children: [] }));
    continue;
  }

  // Table (| ... |)
  if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
    const tableRawRows = [];
    while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
      const rowLine = lines[i].trim();
      // Check if it's separator row |---|---|
      if (!/^\|[\s\-:|]+\|$/.test(rowLine)) {
        const cells = rowLine
          .slice(1, -1)
          .split('|')
          .map(c => c.trim());
        tableRawRows.push(cells);
      }
      i++;
    }

    if (tableRawRows.length > 0) {
      const headerRowData = tableRawRows[0];
      const dataRowsData = tableRawRows.slice(1);

      const tableRows = [];

      // Header row
      tableRows.push(
        new TableRow({
          tableHeader: true,
          children: headerRowData.map(hText => new TableCell({
            shading: { fill: COLOR_PRIMARY, type: ShadingType.CLEAR },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
              bottom: { style: BorderStyle.SINGLE, size: 8, color: COLOR_PRIMARY },
              left: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
              right: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
            },
            margins: { top: 100, bottom: 100, left: 120, right: 120 },
            children: [
              new Paragraph({
                spacing: { before: 20, after: 20 },
                children: parseInlineRuns(hText, {
                  size: 20,
                  bold: true,
                  color: COLOR_WHITE
                })
              })
            ]
          }))
        })
      );

      // Body rows
      dataRowsData.forEach((rowCells, rIdx) => {
        const isZebra = rIdx % 2 === 1;
        tableRows.push(
          new TableRow({
            children: rowCells.map(cText => new TableCell({
              shading: { fill: isZebra ? "F8FAFC" : "FFFFFF", type: ShadingType.CLEAR },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 2, color: "E2E8F0" },
                bottom: { style: BorderStyle.SINGLE, size: 2, color: "E2E8F0" },
                left: { style: BorderStyle.SINGLE, size: 2, color: "E2E8F0" },
                right: { style: BorderStyle.SINGLE, size: 2, color: "E2E8F0" },
              },
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: [
                new Paragraph({
                  spacing: { before: 20, after: 20 },
                  children: parseInlineRuns(cText, { size: 19 })
                })
              ]
            }))
          })
        );
      });

      const fullTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: tableRows
      });

      docChildren.push(fullTable);
      docChildren.push(new Paragraph({ spacing: { before: 80, after: 80 }, children: [] }));
    }
    continue;
  }

  // Bullet list (- item)
  if (/^\s*[-*]\s+/.test(line)) {
    const listText = line.replace(/^\s*[-*]\s+/, '').trim();
    docChildren.push(new Paragraph({
      bullet: { level: 0 },
      spacing: { before: 30, after: 30 },
      children: parseInlineRuns(listText, { size: 22 })
    }));
    i++;
    continue;
  }

  // Numbered list (1. item)
  if (/^\s*\d+\.\s+/.test(line)) {
    const listText = line.replace(/^\s*\d+\.\s+/, '').trim();
    const numPrefix = line.match(/^\s*(\d+\.)\s+/)[1];
    docChildren.push(new Paragraph({
      spacing: { before: 30, after: 30 },
      indent: { left: 400 },
      children: [
        new TextRun({ text: numPrefix + ' ', bold: true, color: COLOR_PRIMARY, font: 'Segoe UI', size: 22 }),
        ...parseInlineRuns(listText, { size: 22 })
      ]
    }));
    i++;
    continue;
  }

  // Blank line
  if (line.trim() === '') {
    i++;
    continue;
  }

  // Normal paragraph
  docChildren.push(new Paragraph({
    spacing: { before: 60, after: 80, line: 276 }, // 1.15 line spacing
    children: parseInlineRuns(line.trim(), { size: 22 })
  }));

  i++;
}

console.log(`Parsed total ${docChildren.length} docx elements.`);

const doc = new Document({
  sections: [
    {
      properties: {
        page: {
          margin: {
            top: 1440,
            bottom: 1440,
            left: 1440,
            right: 1440,
          },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              spacing: { after: 100 },
              children: [
                new TextRun({
                  text: "SENATI – Escuela de Tecnologías de la Información | Backus Ventas PWA",
                  font: "Segoe UI",
                  size: 16,
                  color: "888888",
                  italics: true,
                }),
              ],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({
                  text: "Página ",
                  font: "Segoe UI",
                  size: 16,
                  color: "888888",
                }),
                new TextRun({
                  children: [PageNumber.CURRENT],
                  font: "Segoe UI",
                  size: 16,
                  color: "888888",
                }),
                new TextRun({
                  text: " de ",
                  font: "Segoe UI",
                  size: 16,
                  color: "888888",
                }),
                new TextRun({
                  children: [PageNumber.TOTAL_PAGES],
                  font: "Segoe UI",
                  size: 16,
                  color: "888888",
                }),
              ],
            }),
          ],
        }),
      },
      children: docChildren,
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(outputPath, buffer);
  console.log(`Document successfully written to ${outputPath} (${buffer.length} bytes)`);
}).catch(err => {
  console.error("Error generating docx:", err);
  process.exit(1);
});
