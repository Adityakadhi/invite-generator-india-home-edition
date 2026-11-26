(function () {
  const cfg = INVITE_CONFIG;
  const canvas = document.getElementById('inviteCanvas');
  const ctx = canvas.getContext('2d');

  canvas.width = cfg.template.width;
  canvas.height = cfg.template.height;

  const templateImage = new Image();
  let templateLoaded = false;
  let fieldOverflow = {};

  const inputs = {};
  for (const field of cfg.fields) {
    inputs[field.key] = document.getElementById(field.key);
  }

  const errorBanner = document.getElementById('fitError');
  const downloadJpgBtn = document.getElementById('downloadJpg');
  const downloadPdfBtn = document.getElementById('downloadPdf');
  const newClientBtn = document.getElementById('newClient');
  const statusText = document.getElementById('statusText');

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

  function fillTextSpaced(text, x, y, spacing) {
    let cursor = x;
    for (const character of text) {
      ctx.fillText(character, cursor, y);
      cursor += ctx.measureText(character).width + spacing;
    }
  }

  function measureSpacedWidth(text, spacing) {
    let width = 0;
    for (const character of text) {
      width += ctx.measureText(character).width + spacing;
    }
    return width - (text.length ? spacing : 0);
  }

  function fitFontSize(text, maxWidth, maxSize, minSize, fontPrefix, spacing) {
    for (let size = maxSize; size >= minSize; size--) {
      ctx.font = `${fontPrefix} ${size}px ${cfg.text.fontFamily}`;
      const width = spacing
        ? measureSpacedWidth(text, spacing)
        : ctx.measureText(text).width;
      if (width <= maxWidth) return size;
    }
    return null;
  }

  function drawQrCode(values) {
    const qrCfg = cfg.qr;
    const qr = qrcode(0, 'M');
    qr.addData(qrCfg.buildPayload(values));
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

    const caption = qrCfg.caption;
    const blockHeight = caption.lines.length * caption.lineHeight;
    const startY = qrCfg.y + qrCfg.size / 2 - blockHeight / 2 + caption.fontSize * 0.8;

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = caption.color;
    ctx.font = `${caption.weight} ${caption.fontSize}px ${cfg.text.fontFamily}`;

    caption.lines.forEach((line, index) => {
      fillTextSpaced(line, caption.x, startY + index * caption.lineHeight, caption.letterSpacing);
    });
  }

  function drawTemplate() {
    ctx.drawImage(templateImage, 0, 0, canvas.width, canvas.height);

    // Cover the printed guides with nearby paper before drawing the wider lines.
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
    for (const field of cfg.fields) {
      values[field.key] = inputs[field.key].value.trim();
    }

    const { left, right } = cfg.details;
    const maxWidth = right - left;
    const { label: labelCfg, value: valueCfg, fontFamily } = cfg.text;

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    for (const field of cfg.fields) {
      const value = values[field.key];
      if (!value) continue;

      if (field.showLabel !== false) {
        const labelSize = fitFontSize(
          field.label,
          maxWidth,
          labelCfg.maxSize,
          labelCfg.minSize,
          labelCfg.weight,
          labelCfg.letterSpacing
        );

        ctx.fillStyle = labelCfg.color;
        ctx.font = `${labelCfg.weight} ${labelSize ?? labelCfg.minSize}px ${fontFamily}`;
        fillTextSpaced(
          field.label,
          left,
          field.lineY - labelCfg.offsetAboveLine,
          labelCfg.letterSpacing
        );
      }

      const valueFont = `${field.valueStyle ?? 'normal'} ${field.valueWeight ?? valueCfg.weight}`;
      const valueSize = fitFontSize(
        value,
        maxWidth,
        valueCfg.maxSize,
        valueCfg.minSize,
        valueFont,
        valueCfg.letterSpacing
      );

      if (valueSize === null) {
        fieldOverflow[field.key] = true;
        continue;
      }

      ctx.fillStyle = valueCfg.color;
      ctx.font = `${valueFont} ${valueSize}px ${fontFamily}`;
      ctx.fillText(value, left, field.lineY - valueCfg.offsetAboveLine);
    }

    const allFilled = cfg.fields.every((field) => values[field.key].length > 0);
    const overflowFields = cfg.fields.filter((field) => fieldOverflow[field.key]);

    if (allFilled && overflowFields.length === 0) {
      try {
        drawQrCode(values);
      } catch (error) {
        console.error('Could not generate invitation QR code:', error);
        const message = typeof qrcode !== 'function'
          ? 'QR script missing. Upload qrcode-generator.js next to index.html.'
          : 'Could not generate the QR code. Check or shorten the invite details.';

        errorBanner.textContent = message;
        errorBanner.hidden = false;
        statusText.textContent = message;
        downloadJpgBtn.disabled = true;
        downloadPdfBtn.disabled = true;
        return;
      }
    }

    updateUIState(allFilled, overflowFields);
  }

  function updateUIState(allFilled, overflowFields) {
    const hasOverflow = overflowFields.length > 0;

    if (hasOverflow) {
      const names = overflowFields.map((field) => field.label).join(', ');
      errorBanner.textContent = `Please shorten the text for ${names} so it fits on the invitation.`;
    }

    errorBanner.hidden = !hasOverflow;

    const canDownload = allFilled && !hasOverflow;
    downloadJpgBtn.disabled = !canDownload;
    downloadPdfBtn.disabled = !canDownload;

    if (hasOverflow) {
      statusText.textContent = 'Shorten the indicated text to enable downloads.';
    } else if (!allFilled) {
      statusText.textContent = 'Fill in all four fields to enable downloads and generate the QR code.';
    } else {
      statusText.textContent = 'Ready to download.';
    }
  }

  function getFilename(extension) {
    const clientName = inputs.clientName.value
      .trim()
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'Guest';

    return `${cfg.export.filenamePrefix}_${clientName}.${extension}`;
  }

  function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  function canvasToJpegBlob() {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Could not export the invitation image.'));
        }
      }, 'image/jpeg', cfg.export.jpgQuality);
    });
  }

  async function handleDownloadJpg() {
    const filename = getFilename('jpg');
    try {
      const blob = await canvasToJpegBlob();
      triggerDownload(blob, filename);
    } catch (error) {
      console.error(error);
      statusText.textContent = 'Could not download the JPG. Please try again.';
    }
  }

  async function handleDownloadPdf() {
    const filename = getFilename('pdf');
    try {
      const jpeg = await canvasToJpegBlob();
      const jpegBytes = new Uint8Array(await jpeg.arrayBuffer());
      const pdf = buildSinglePageImagePdf(
        jpegBytes,
        canvas.width,
        canvas.height,
        cfg.export.pdfPointsPerPixel
      );
      triggerDownload(pdf, filename);
    } catch (error) {
      console.error(error);
      statusText.textContent = 'Could not download the PDF. Please try again.';
    }
  }

  function handleNewClient() {
    inputs.clientName.value = '';
    render();
    inputs.clientName.focus();
  }

  for (const field of cfg.fields) {
    inputs[field.key].addEventListener('input', render);
  }

  downloadJpgBtn.addEventListener('click', handleDownloadJpg);
  downloadPdfBtn.addEventListener('click', handleDownloadPdf);
  newClientBtn.addEventListener('click', handleNewClient);

  loadTemplate()
    .then(render)
    .catch(() => {
      statusText.textContent = 'Could not load the template image.';
    });
})();
