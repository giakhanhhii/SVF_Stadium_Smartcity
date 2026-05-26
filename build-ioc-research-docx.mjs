/**
 * Chuyển IOC_SMARTCITY_UI_RESEARCH.md → DOCX có định dạng đẹp
 * Chạy: node build-ioc-research-docx.mjs
 */
import fs from 'fs';
import path from 'path';
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType,
  Header, Footer, PageNumber, NumberFormat, LevelFormat, TableOfContents,
  ExternalHyperlink, PageBreak, TabStopType, TabStopPosition
} from 'docx';

const MD_PATH = path.join(process.cwd(), 'IOC_SMARTCITY_UI_RESEARCH.md');
const OUT_PATH = path.join(process.cwd(), 'IOC_SMARTCITY_UI_RESEARCH.docx');

const COLORS = {
  primary: '185FA5',
  primaryDark: '042C53',
  text: '1A1A18',
  textSec: '666666',
  headerBg: 'E6F1FB',
  border: 'D0D0D0',
  codeBg: 'F5F5F5',
  quoteBg: 'F7F9FC',
};

function readMd() {
  return fs.readFileSync(MD_PATH, 'utf8');
}

/** Parse inline: **bold**, *italic*, `code`, [text](url) */
function parseInline(text, baseOpts = {}) {
  const runs = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let m;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) {
      runs.push(new TextRun({ text: text.slice(last, m.index), ...baseOpts }));
    }
    const token = m[0];
    if (token.startsWith('**')) {
      runs.push(new TextRun({ text: token.slice(2, -2), bold: true, ...baseOpts }));
    } else if (token.startsWith('*')) {
      runs.push(new TextRun({ text: token.slice(1, -1), italics: true, ...baseOpts }));
    } else if (token.startsWith('`')) {
      runs.push(new TextRun({
        text: token.slice(1, -1),
        font: 'Consolas',
        size: 20,
        shading: { fill: COLORS.codeBg, type: ShadingType.CLEAR },
        ...baseOpts,
      }));
    } else if (token.startsWith('[')) {
      const linkMatch = token.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        runs.push(new ExternalHyperlink({
          children: [new TextRun({ text: linkMatch[1], style: 'Hyperlink', ...baseOpts })],
          link: linkMatch[2],
        }));
      }
    }
    last = m.index + token.length;
  }
  if (last < text.length) {
    runs.push(new TextRun({ text: text.slice(last), ...baseOpts }));
  }
  if (runs.length === 0) {
    runs.push(new TextRun({ text, ...baseOpts }));
  }
  return runs;
}

function para(text, opts = {}) {
  return new Paragraph({
    spacing: { after: opts.after ?? 120, line: 276 },
    alignment: opts.align,
    indent: opts.indent,
    children: typeof text === 'string' ? parseInline(text, opts.run) : text,
    ...opts.extra,
  });
}

function heading(text, level) {
  const map = {
    1: HeadingLevel.HEADING_1,
    2: HeadingLevel.HEADING_2,
    3: HeadingLevel.HEADING_3,
  };
  return new Paragraph({
    heading: map[level],
    spacing: { before: level === 1 ? 360 : 240, after: 160 },
    children: [new TextRun({ text, bold: true, color: level <= 2 ? COLORS.primaryDark : COLORS.primary })],
  });
}

function parseTableRow(line) {
  return line.split('|').slice(1, -1).map(c => c.trim());
}

function isTableSep(line) {
  return /^\|[-| :]+\|$/.test(line.trim());
}

function buildTable(headerRow, bodyRows) {
  const colCount = headerRow.length;
  const width = Math.floor(9360 / colCount);
  const cellBorders = {
    top: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
    left: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
    right: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
  };

  const mkCell = (text, isHeader) => new TableCell({
    width: { size: width, type: WidthType.DXA },
    shading: isHeader ? { fill: COLORS.headerBg, type: ShadingType.CLEAR } : undefined,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({
      children: parseInline(text, { bold: isHeader, size: isHeader ? 22 : 21 }),
    })],
  });

  const rows = [
    new TableRow({ children: headerRow.map(h => mkCell(h, true)), tableHeader: true }),
    ...bodyRows.map(r => new TableRow({ children: r.map(c => mkCell(c, false)) })),
  ];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows,
    borders: {
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
      top: { style: BorderStyle.SINGLE, size: 2, color: COLORS.primary },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: COLORS.primary },
      left: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
      right: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
    },
  });
}

function mdToDocxChildren(md) {
  const lines = md.split(/\r?\n/);
  const children = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) { i++; continue; }

    // Skip main title — handled on cover
    if (trimmed.startsWith('# ') && !children.length) { i++; continue; }

    if (trimmed === '---') {
      children.push(new Paragraph({
        spacing: { before: 200, after: 200 },
        border: { bottom: { color: COLORS.primary, space: 1, style: BorderStyle.SINGLE, size: 6 } },
        children: [],
      }));
      i++; continue;
    }

    if (trimmed.startsWith('## ')) {
      children.push(heading(trimmed.slice(3), 1));
      i++; continue;
    }
    if (trimmed.startsWith('### ')) {
      children.push(heading(trimmed.slice(4), 2));
      i++; continue;
    }

    if (trimmed.startsWith('> ')) {
      children.push(new Paragraph({
        spacing: { before: 120, after: 160 },
        indent: { left: 360 },
        shading: { fill: COLORS.quoteBg, type: ShadingType.CLEAR },
        border: { left: { color: COLORS.primary, space: 8, style: BorderStyle.SINGLE, size: 12 } },
        children: parseInline(trimmed.slice(2), { italics: true, color: COLORS.textSec }),
      }));
      i++; continue;
    }

    if (trimmed.startsWith('```')) {
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++;
      children.push(new Paragraph({
        spacing: { before: 120, after: 120 },
        shading: { fill: COLORS.codeBg, type: ShadingType.CLEAR },
        indent: { left: 360, right: 360 },
        children: [new TextRun({ text: codeLines.join('\n'), font: 'Consolas', size: 20 })],
      }));
      continue;
    }

    if (trimmed.startsWith('|') && i + 1 < lines.length && isTableSep(lines[i + 1])) {
      const header = parseTableRow(trimmed);
      i += 2;
      const body = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        body.push(parseTableRow(lines[i].trim()));
        i++;
      }
      children.push(new Paragraph({ spacing: { after: 80 }, children: [] }));
      children.push(buildTable(header, body));
      children.push(new Paragraph({ spacing: { after: 160 }, children: [] }));
      continue;
    }

    if (/^\d+\.\s/.test(trimmed)) {
      children.push(new Paragraph({
        spacing: { after: 80 },
        numbering: { reference: 'num-list', level: 0 },
        children: parseInline(trimmed.replace(/^\d+\.\s/, '')),
      }));
      i++; continue;
    }

    if (trimmed.startsWith('- ')) {
      children.push(new Paragraph({
        spacing: { after: 80 },
        bullet: { level: 0 },
        children: parseInline(trimmed.slice(2)),
      }));
      i++; continue;
    }

    if (trimmed.startsWith('*') && trimmed.endsWith('*') && !trimmed.startsWith('**')) {
      children.push(para(trimmed.slice(1, -1), { run: { italics: true, color: COLORS.textSec, size: 20 }, after: 200 }));
      i++; continue;
    }

    children.push(para(trimmed));
    i++;
  }

  return children;
}

async function main() {
  const md = readMd();
  const bodyChildren = mdToDocxChildren(md);

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: 'Calibri', size: 22, color: COLORS.text },
          paragraph: { spacing: { line: 276 } },
        },
      },
      paragraphStyles: [
        {
          id: 'Hyperlink',
          name: 'Hyperlink',
          basedOn: 'Normal',
          run: { color: COLORS.primary, underline: {} },
        },
        {
          id: 'Heading1',
          name: 'Heading 1',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: { size: 32, bold: true, color: COLORS.primaryDark, font: 'Calibri Light' },
          paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 },
        },
        {
          id: 'Heading2',
          name: 'Heading 2',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: { size: 26, bold: true, color: COLORS.primary },
          paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 1 },
        },
        {
          id: 'Heading3',
          name: 'Heading 3',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: { size: 24, bold: true, color: COLORS.text },
          paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 2 },
        },
      ],
    },
    numbering: {
      config: [{
        reference: 'num-list',
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }],
      }],
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        headers: {
          default: new Header({
            children: [new Paragraph({
              border: { bottom: { color: COLORS.primary, style: BorderStyle.SINGLE, size: 4, space: 4 } },
              tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
              children: [
                new TextRun({ text: 'IOC Smart City — Nghiên cứu UI', size: 18, color: COLORS.primary, bold: true }),
                new TextRun({ text: '\t25/05/2026', size: 18, color: COLORS.textSec }),
              ],
            })],
          }),
        },
        footers: {
          default: new Footer({
            children: [new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: 'Trang ', size: 18, color: COLORS.textSec }),
                new TextRun({ children: [PageNumber.CURRENT], size: 18, color: COLORS.textSec }),
                new TextRun({ text: ' / ', size: 18, color: COLORS.textSec }),
                new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: COLORS.textSec }),
              ],
            })],
          }),
        },
        children: [
          // Cover
          new Paragraph({ spacing: { before: 2400 }, children: [] }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [new TextRun({ text: 'NGHIÊN CỨU & THIẾT KẾ', size: 28, color: COLORS.textSec, font: 'Calibri Light' })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
            children: [new TextRun({ text: 'Giao diện IOC Smart City', size: 52, bold: true, color: COLORS.primaryDark, font: 'Calibri Light' })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [new TextRun({
              text: 'Trung tâm Điều hành Đô thị Thông minh',
              size: 24, color: COLORS.primary,
            })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 600 },
            children: [new TextRun({
              text: 'Tài liệu tổng hợp quá trình nghiên cứu, phân tích và triển khai giao diện',
              size: 22, italics: true, color: COLORS.textSec,
            })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
            children: [new TextRun({ text: 'Ngày lập: 25/05/2026', size: 22, color: COLORS.text })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'Phiên bản: Prototype v1', size: 20, color: COLORS.textSec })],
          }),
          new Paragraph({ children: [new PageBreak()] }),

          // TOC
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun({ text: 'Mục lục', bold: true, color: COLORS.primaryDark, size: 32 })],
          }),
          new TableOfContents('Mục lục', { hyperlink: true, headingStyleRange: '1-3' }),
          new Paragraph({ children: [new PageBreak()] }),

          ...bodyChildren,
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(OUT_PATH, buffer);
  console.log('Created:', OUT_PATH);
}

main().catch(err => { console.error(err); process.exit(1); });
