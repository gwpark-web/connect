/* ══ 엑셀(.xlsx) 읽기·쓰기 ═══════════════════════════════════════════════════
   외부 라이브러리 없이 브라우저 기능만 쓴다(압축 해제는 DecompressionStream).
   · Xlsx.read(arrayBuffer)  → { rows: string[][] }   첫 번째 시트를 문자열 표로 읽는다
   · Xlsx.write(rows, opts)  → Blob (.xlsx)           첫 줄은 머리글(굵게)로 저장한다
   ──────────────────────────────────────────────────────────────────────────
   읽기: 공유 문자열·인라인 문자열·숫자·불리언을 지원하고, 날짜 서식 칸은 YY/MM/DD,
         퍼센트 서식 칸은 "1.8%" 로 바꿔서 읽는다. (.xls 같은 옛 형식은 지원하지 않는다)
   쓰기: 압축 없이 저장하는 zip(엑셀이 그대로 연다). 숫자 열은 숫자 셀로 저장해 정렬·합계가 된다.
   ══════════════════════════════════════════════════════════════════════ */
const Xlsx = (function () {
  const enc = new TextEncoder();
  const dec = new TextDecoder('utf-8');

  /* ── CRC32 (zip 필수값) ── */
  const CRC_T = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
    return t;
  })();
  function crc32(u8) { let c = 0xFFFFFFFF; for (let i = 0; i < u8.length; i++) c = CRC_T[(c ^ u8[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }

  const xmlEsc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]))
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');   // XML에 쓸 수 없는 제어문자 제거

  function colName(i) { let s = ''; for (i++; i > 0; i = Math.floor((i - 1) / 26)) s = String.fromCharCode(65 + (i - 1) % 26) + s; return s; }
  function colIndex(ref) { const m = /^([A-Z]+)/.exec(ref); let n = 0; for (const ch of m[1]) n = n * 26 + (ch.charCodeAt(0) - 64); return n - 1; }

  /* ═════════ 쓰기 ═════════ */
  function zip(files) {
    const chunks = [], central = [];
    let offset = 0;
    const u16 = n => [n & 255, (n >>> 8) & 255];
    const u32 = n => [n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255];
    files.forEach(f => {
      const name = enc.encode(f.name), data = f.data, crc = crc32(data);
      const local = new Uint8Array([0x50, 0x4B, 3, 4, ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21),
        ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(name.length), ...u16(0), ...name]);
      chunks.push(local, data);
      central.push(new Uint8Array([0x50, 0x4B, 1, 2, ...u16(20), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21),
        ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(name.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0),
        ...u32(0), ...u32(offset), ...name]));
      offset += local.length + data.length;
    });
    const cdSize = central.reduce((n, c) => n + c.length, 0);
    const end = new Uint8Array([0x50, 0x4B, 5, 6, ...u16(0), ...u16(0), ...u16(files.length), ...u16(files.length), ...u32(cdSize), ...u32(offset), ...u16(0)]);
    return new Blob([...chunks, ...central, end], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  const NUM_RE = /^-?\d+(\.\d+)?$/;
  const COMMA_NUM_RE = /^-?\d{1,3}(,\d{3})+(\.\d+)?$/;

  // opts.numericCols: 숫자 셀로 저장할 머리글 이름 목록(예: ['조회수','좋아요','댓글'])
  function write(rows, opts) {
    opts = opts || {};
    const numeric = new Set(opts.numericCols || []);
    const header = rows[0] || [];
    const widths = header.map((h, i) => {
      const longest = Math.max(...rows.map(r => String(r[i] == null ? '' : r[i]).length), 4);
      return Math.min(60, Math.max(8, Math.round(longest * 1.4) + 2));
    });
    const sheetRows = rows.map((r, ri) => {
      const cells = r.map((v, ci) => {
        const ref = colName(ci) + (ri + 1);
        const s = v == null ? '' : String(v);
        if (ri === 0) return `<c r="${ref}" s="1" t="inlineStr"><is><t>${xmlEsc(s)}</t></is></c>`;
        if (s === '') return '';
        if (numeric.has(header[ci])) {
          const plain = COMMA_NUM_RE.test(s) ? s.replace(/,/g, '') : s;
          if (NUM_RE.test(plain)) return `<c r="${ref}" s="2"><v>${plain}</v></c>`;
        }
        return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${xmlEsc(s)}</t></is></c>`;
      }).join('');
      return `<row r="${ri + 1}">${cells}</row>`;
    }).join('');
    const sheet = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>' +
      `<cols>${widths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('')}</cols>` +
      `<sheetData>${sheetRows}</sheetData></worksheet>`;
    const styles = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      '<fonts count="2"><font><sz val="11"/><name val="맑은 고딕"/></font><font><b/><sz val="11"/><name val="맑은 고딕"/></font></fonts>' +
      '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>' +
      '<fill><patternFill patternType="solid"><fgColor rgb="FFF3F4F6"/><bgColor indexed="64"/></patternFill></fill></fills>' +
      '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
      '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
      '<cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
      '<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>' +
      '<xf numFmtId="3" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs>' +
      '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
    const name = xmlEsc(opts.sheetName || 'Sheet1').slice(0, 31);
    const files = [
      { name: '[Content_Types].xml', data: enc.encode('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>') },
      { name: '_rels/.rels', data: enc.encode('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>') },
      { name: 'xl/workbook.xml', data: enc.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${name}" sheetId="1" r:id="rId1"/></sheets></workbook>`) },
      { name: 'xl/_rels/workbook.xml.rels', data: enc.encode('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>') },
      { name: 'xl/worksheets/sheet1.xml', data: enc.encode(sheet) },
      { name: 'xl/styles.xml', data: enc.encode(styles) },
    ];
    return zip(files);
  }

  /* ═════════ 읽기 ═════════ */
  async function inflateRaw(u8) {
    const ds = new DecompressionStream('deflate-raw');
    const out = new Response(new Blob([u8]).stream().pipeThrough(ds));
    return new Uint8Array(await out.arrayBuffer());
  }

  async function unzip(buf) {
    const u8 = new Uint8Array(buf), dv = new DataView(buf);
    let e = -1;
    for (let i = u8.length - 22; i >= Math.max(0, u8.length - 66000); i--) if (dv.getUint32(i, true) === 0x06054B50) { e = i; break; }
    if (e < 0) throw new Error('엑셀(.xlsx) 파일 형식이 아닙니다.');
    const count = dv.getUint16(e + 10, true);
    let p = dv.getUint32(e + 16, true);
    const entries = {};
    for (let n = 0; n < count; n++) {
      if (dv.getUint32(p, true) !== 0x02014B50) break;
      const method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true);
      const nlen = dv.getUint16(p + 28, true), xlen = dv.getUint16(p + 30, true), clen = dv.getUint16(p + 32, true);
      const lho = dv.getUint32(p + 42, true);
      const name = dec.decode(u8.subarray(p + 46, p + 46 + nlen));
      entries[name] = { method, csize, lho };
      p += 46 + nlen + xlen + clen;
    }
    return {
      async text(name) {
        const en = entries[name]; if (!en) return null;
        const lnlen = dv.getUint16(en.lho + 26, true), lxlen = dv.getUint16(en.lho + 28, true);
        const start = en.lho + 30 + lnlen + lxlen;
        let data = u8.subarray(start, start + en.csize);
        if (en.method === 8) data = await inflateRaw(data);
        else if (en.method !== 0) throw new Error('지원하지 않는 압축 방식입니다.');
        return dec.decode(data);
      },
      names: () => Object.keys(entries),
    };
  }

  const parseXml = s => new DOMParser().parseFromString(s, 'application/xml');
  const kids = (el, tag) => [...el.getElementsByTagName(tag)];
  const textOf = el => kids(el, 't').map(t => t.textContent).join('');

  // 날짜·퍼센트 서식을 쓰는 칸(xf 번호)을 찾는다
  function styleKinds(stylesXml) {
    const kinds = {};
    if (!stylesXml) return kinds;
    const doc = parseXml(stylesXml);
    const custom = {};
    kids(doc, 'numFmt').forEach(n => { custom[n.getAttribute('numFmtId')] = n.getAttribute('formatCode') || ''; });
    const xfs = doc.getElementsByTagName('cellXfs')[0];
    if (!xfs) return kinds;
    [...xfs.children].forEach((xf, i) => {
      const id = xf.getAttribute('numFmtId');
      const code = (custom[id] || '').toLowerCase().replace(/"[^"]*"|\[[^\]]*\]|\\./g, '');
      if ((+id >= 14 && +id <= 22) || (+id >= 45 && +id <= 47) || /[ymd]/.test(code) && !/[#0]/.test(code.replace(/[ymdhs:\/\-\. ]/g, ''))) kinds[i] = 'date';
      else if (id === '9' || id === '10' || /%/.test(code)) kinds[i] = 'pct';
    });
    return kinds;
  }

  function serialToDate(n) {
    const d = new Date(Math.round((n - 25569) * 86400000));
    const p = x => String(x).padStart(2, '0');
    return `${p(d.getUTCFullYear() % 100)}/${p(d.getUTCMonth() + 1)}/${p(d.getUTCDate())}`;
  }

  async function read(buf) {
    const z = await unzip(buf);
    const wb = await z.text('xl/workbook.xml');
    if (!wb) throw new Error('엑셀(.xlsx) 파일 형식이 아닙니다.');
    // 첫 번째 시트의 파일 경로 찾기
    let sheetPath = 'xl/worksheets/sheet1.xml';
    try {
      const first = kids(parseXml(wb), 'sheet')[0];
      const rid = first && (first.getAttribute('r:id') || first.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id'));
      const rels = await z.text('xl/_rels/workbook.xml.rels');
      if (rid && rels) {
        const rel = kids(parseXml(rels), 'Relationship').find(r => r.getAttribute('Id') === rid);
        if (rel) { const t = rel.getAttribute('Target'); sheetPath = t.startsWith('/') ? t.slice(1) : 'xl/' + t.replace(/^\.\//, ''); }
      }
    } catch (e) { /* 기본 경로 사용 */ }
    const sheetXml = await z.text(sheetPath);
    if (!sheetXml) throw new Error('시트를 찾을 수 없습니다.');

    const ssXml = await z.text('xl/sharedStrings.xml');
    const shared = ssXml ? kids(parseXml(ssXml), 'si').map(textOf) : [];
    const kinds = styleKinds(await z.text('xl/styles.xml'));

    const doc = parseXml(sheetXml);
    const rows = [];
    kids(doc, 'row').forEach(rowEl => {
      const cells = [];
      kids(rowEl, 'c').forEach(c => {
        const ref = c.getAttribute('r') || '';
        const idx = ref ? colIndex(ref) : cells.length;
        const type = c.getAttribute('t');
        const vEl = c.getElementsByTagName('v')[0];
        let val = '';
        if (type === 's') val = shared[+(vEl ? vEl.textContent : -1)] || '';
        else if (type === 'inlineStr') val = textOf(c);
        else if (type === 'b') val = vEl && vEl.textContent === '1' ? 'TRUE' : 'FALSE';
        else if (vEl) {
          val = vEl.textContent;
          if (type !== 'str' && type !== 'e' && NUM_RE.test(val.trim())) {
            const kind = kinds[+(c.getAttribute('s') || 0)];
            if (kind === 'date') val = serialToDate(+val);
            else if (kind === 'pct') val = (Math.round(+val * 1000) / 10) + '%';
            else if (/e/i.test(val)) val = String(Number(val));
          }
        }
        while (cells.length < idx) cells.push('');
        cells[idx] = String(val).trim();
      });
      rows.push(cells);
    });
    return { rows: rows.filter(r => r.some(v => v !== '')) };
  }

  return { read, write };
})();
