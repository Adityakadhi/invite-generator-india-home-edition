/* ==========================================================================
   Minimal single-page PDF builder.
   Embeds a JPEG directly as a DCTDecode image XObject, scaled to fill one
   page whose proportions match the image exactly. No external libraries,
   no network calls — pure client-side byte assembly.
   ========================================================================== */

function buildSinglePageImagePdf(jpegBytes, pxWidth, pxHeight, pointsPerPixel) {
  const pageW = round2(pxWidth * pointsPerPixel);
  const pageH = round2(pxHeight * pointsPerPixel);

  const chunks = [];
  let length = 0;
  const offsets = {};
  const encoder = new TextEncoder();

  function add(data) {
    const bytes = typeof data === 'string' ? encoder.encode(data) : data;
    chunks.push(bytes);
    length += bytes.length;
  }

  add('%PDF-1.4\n');

  offsets[1] = length;
  add('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  offsets[2] = length;
  add('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');

  offsets[3] = length;
  add(
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' +
      pageW +
      ' ' +
      pageH +
      '] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n'
  );

  offsets[4] = length;
  add(
    '4 0 obj\n<< /Type /XObject /Subtype /Image /Width ' +
      pxWidth +
      ' /Height ' +
      pxHeight +
      ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' +
      jpegBytes.length +
      ' >>\nstream\n'
  );
  add(jpegBytes);
  add('\nendstream\nendobj\n');

  const contentStr = 'q ' + pageW + ' 0 0 ' + pageH + ' 0 0 cm /Im0 Do Q';
  offsets[5] = length;
  add('5 0 obj\n<< /Length ' + contentStr.length + ' >>\nstream\n' + contentStr + '\nendstream\nendobj\n');

  const xrefStart = length;
  let xref = 'xref\n0 6\n0000000000 65535 f \n';
  for (let i = 1; i <= 5; i++) {
    xref += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
  }
  add(xref);
  add('trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n' + xrefStart + '\n%%EOF');

  const total = new Uint8Array(length);
  let pos = 0;
  for (const c of chunks) {
    total.set(c, pos);
    pos += c.length;
  }
  return new Blob([total], { type: 'application/pdf' });
}

function round2(n) {
  return Math.round(n * 100) / 100;
}
