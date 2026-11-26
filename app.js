/* ==========================================================================
   India Home Edition — Invite Generator
   App logic: loads the master template, draws personalization text and a
   QR code onto a single canvas (used for both live preview and file
   export), validates fit, and handles JPG / PDF downloads.
   ========================================================================== */

(function () {
  const cfg = INVITE_CONFIG;

  const canvas = document.getElementById('inviteCanvas');
  const ctx = canvas.getContext('2d');
  canvas.width = cfg.template.width;
  canvas.height = cfg.template.height;

  const templateImage = new Image();
  let templateLoaded = false;

  const inputs = {};
  cfg.fields.forEach((f) => {
    inputs[f.key] = document.getElementById(f.key);
  });

  const errorBanner = document.getElementById('fitError');
  const downloadJpgBtn = document.getElementById('downloadJpg');
  const downloadPdfBtn = document.getElementById('downloadPdf');
  const newClientBtn = document.getElementById('newClient');
  const statusText = document.getElementById('statusText');

  let fieldOverflow = {}; // key -> boolean, true if text cannot fit even at min size

  function loadTemplate() {
    return new Promise((resolve, reject) => {
      templateImage.onload = () => {
        templateLoaded = true;
        resolve();
      };
      templateImage.onerror = reject;
      templateImage.src = cfg.template.src;
    });
  }

  // Draws text left-aligned with manual letter-spacing (works identically
  // across browsers, unlike ctx.letterSpacing which isn't universal).
  function fillTextSpaced(text, x, y, spacing) {
    let cursor = x;
    for (const ch of text) {
      ctx.fillText(ch, cursor, y);
      cursor += ctx.measureText(ch).width + spacing;
    }
  }

  function measureSpacedWidth(text, spacing) {
    let w = 0;
    for (const ch of text) {
      w += ctx.measureText(ch).width + spacing;
    }
    return w - (text.length ? spacing : 0);
  }

  // Finds the largest font size (within [minSize, maxSize]) at which the
  // given text fits inside maxWidth. Returns null if even minSize overflows.
  function fitFontSize(text, maxWidth, maxSize, minSize, weight, spacing) {
    for (let size = maxSize; size >= minSize; size--) {
      ctx.font = `${weight} ${size}px ${cfg.text.fontFamily}`;
      const w = spacing ? measureSpacedWidth(text, spacing) : ctx.measureText(text).width;
      if (w <= maxWidth) return size;
    }
    return null;
  }

  function sanitizeFilenamePart(str) {
    return (
      str
        .trim()
        .replace(/[^a-zA-Z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '') || 'Guest'
    );
  }

  function drawQrCode(values) {
    const qrCfg = cfg.qr;
    const payload = qrCfg.buildPayload(values);

    const qr = qrcode(0, 'M'); // typeNumber 0 = smallest version that fits
    qr.addData(payload);
    qr.make();

    const count = qr.getModuleCount();
    const moduleSize = Math.floor(qrCfg.size / (count + 2 * qrCfg.quietZoneModules));
    const margin = Math.floor((qrCfg.size - count * moduleSize) / 2);
    ctx.fillStyle = qrCfg.backgroundColor;
    ctx.fillRect(qrCfg.x, qrCfg.y, qrCfg.size, qrCfg.size);

    ctx.fillStyle = qrCfg.moduleColor;
    for (let row = 0; row < count; row++) {
      for (let col = 0; col < count; col++) {
        if (qr.isDark(row, col)) {
          ctx.fillRect(
            qrCfg.x + margin + col * moduleSize,
            qrCfg.y + margin + row * moduleSize,
            moduleSize,
            moduleSize
          );
        }
      }
    }

    // Caption beside the QR
    const cap = qrCfg.caption;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = cap.color;
    ctx.font = `${cap.weight} ${cap.fontSize}px ${cfg.text.fontFamily}`;
    const blockHeight = cap.lines.length * cap.lineHeight;
    const startY = (qrCfg.y + qrCfg.size / 2) - blockHeight / 2 + cap.fontSize * 0.8;
    cap.lines.forEach((line, i) => {
      fillTextSpaced(line, cap.x, startY + i * cap.lineHeight, cap.letterSpacing);
    });
  }

  function drawTemplate() {
    ctx.drawImage(templateImage, 0, 0, canvas.width, canvas.height);

    // Cover the old printed rules with adjacent paper from the same template.
    const { left, right, originalRules, ruleColor } = cfg.details;
    for (const y of originalRules.centers) {
      ctx.drawImage(
        templateImage,
        originalRules.x, y - 17, originalRules.width, 8,
        originalRules.x, y - 4, originalRules.width, 8
      );
    }

    ctx.save();
    ctx.strokeStyle = ruleColor;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    for (const field of cfg.fields) {
      ctx.beginPath();
      ctx.moveTo(left, field.lineY);
      ctx.lineTo(right, field.lineY);
      ctx.stroke();
    }
    ctx.restore();
  }

  function render() {
    if (!templateLoaded) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawTemplate();

    fieldOverflow = {};
    const values = {};
    cfg.fields.forEach((f) => {
      values[f.key] = inputs[f.key].value.trim();
    });

    cfg.fields.forEach((field) => {
      const raw = values[field.key];
      if (!raw) return; // leave the ruled line blank until the team types something

      const labelCfg = cfg.text.label;
      const valueCfg = cfg.text.value;
      const labelText = field.label;
      const { left, right } = cfg.details;
      const maxWidth = right - left;

      // Label above the entered value.
      const labelSize = fitFontSize(
        labelText,
        maxWidth,
        labelCfg.maxSize,
        labelCfg.minSize,
        labelCfg.weight,
        labelCfg.letterSpacing
      );
      const labelBaseline = field.lineY - labelCfg.offsetAboveLine;

      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = labelCfg.color;
      ctx.font = `${labelCfg.weight} ${labelSize || labelCfg.minSize}px ${cfg.text.fontFamily}`;
      fillTextSpaced(labelText, left, labelBaseline, labelCfg.letterSpacing);

      // Entered value directly above the rule.
      const valueSize = fitFontSize(
        raw,
        maxWidth,
        valueCfg.maxSize,
        valueCfg.minSize,
        valueCfg.weight,
        valueCfg.letterSpacing
      );
      const valueBaseline = field.lineY - valueCfg.offsetAboveLine;

      if (valueSize === null) {
        fieldOverflow[field.key] = true;
        return;
      } else {
        ctx.fillStyle = valueCfg.color;
        ctx.font = `${valueCfg.weight} ${valueSize}px ${cfg.text.fontFamily}`;
        ctx.fillText(raw, left, valueBaseline);
      }
    });

    const allFilled = cfg.fields.every((f) => values[f.key].length > 0);
    if (allFilled && !Object.values(fieldOverflow).some(Boolean)) {
      drawQrCode(values);
    }

    updateUIState(allFilled);
  }

  function updateUIState(allFilled) {
    const anyOverflow = Object.values(fieldOverflow).some(Boolean);

    if (anyOverflow) {
      const names = cfg.fields
        .filter((f) => fieldOverflow[f.key])
        .map((f) => f.label)
        .join(', ');
      errorBanner.textContent = `"${names}" is too long to fit on the card. Please shorten it so the full name is visible.`;
      errorBanner.hidden = false;
    } else {
      errorBanner.hidden = true;
    }

    const canDownload = allFilled && !anyOverflow;
    downloadJpgBtn.disabled = !canDownload;
    downloadPdfBtn.disabled = !canDownload;

    if (!allFilled) {
      statusText.textContent = 'Fill in all four fields to enable downloads and generate the QR code.';
    } else if (anyOverflow) {
      statusText.textContent = 'Shorten the indicated text to enable downloads.';
    } else {
      statusText.textContent = 'Ready to download.';
    }
  }

  function getFilename(ext) {
    const clientName = sanitizeFilenamePart(inputs.clientName.value);
    return `${cfg.export.filenamePrefix}_${clientName}.${ext}`;
  }

  function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  function canvasToJpegBlob() {
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', cfg.export.jpgQuality);
    });
  }

  async function handleDownloadJpg() {
    const blob = await canvasToJpegBlob();
    triggerDownload(blob, getFilename('jpg'));
  }

  async function handleDownloadPdf() {
    const blob = await canvasToJpegBlob();
    const arrayBuffer = await blob.arrayBuffer();
    const jpegBytes = new Uint8Array(arrayBuffer);
    const pdfBlob = buildSinglePageImagePdf(
      jpegBytes,
      canvas.width,
      canvas.height,
      cfg.export.pdfPointsPerPixel
    );
    triggerDownload(pdfBlob, getFilename('pdf'));
  }

  function handleNewClient() {
    inputs.clientName.value = '';
    render();
    inputs.clientName.focus();
  }

  // Wire up events
  cfg.fields.forEach((f) => {
    inputs[f.key].addEventListener('input', render);
  });
  downloadJpgBtn.addEventListener('click', handleDownloadJpg);
  downloadPdfBtn.addEventListener('click', handleDownloadPdf);
  newClientBtn.addEventListener('click', handleNewClient);

  loadTemplate()
    .then(render)
    .catch(() => {
      statusText.textContent = 'Could not load the template image.';
    });
})();
