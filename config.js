/* ==========================================================================
   India Home Edition — Invite Generator
   Single source of truth for template geometry and text placement.
   If the master poster artwork changes, update these numbers to match.
   ========================================================================== */

const INVITE_CONFIG = {
  // The image is embedded as a base64 data URI (assets/template-data.js)
  // rather than loaded by path. This keeps the canvas export untainted and
  // the app fully self-contained, whether it's opened directly as a file
  // or served from a webserver.
  template: {
    src: typeof TEMPLATE_DATA_URI !== 'undefined' ? TEMPLATE_DATA_URI : 'assets/template.png',
    width: 1350,
    height: 1043,
  },

  // The four personalization fields, in the order they appear on the
  // postcard's ruled lines (top to bottom). The 5th ruled line is left
  // free for the QR code (see `qr` below) instead of a 5th text field.
  fields: [
    {
      key: 'invitedBy',
      inputId: 'invitedBy',
      label: 'INVITE BY',
      lineY: 418,       // y-coordinate of the dashed rule on the template
      x: 119,           // left edge, aligned with the rule's left edge
      maxWidth: 465,    // available width before the center divider
    },
    {
      key: 'clientName',
      inputId: 'clientName',
      label: 'CLIENT NAME',
      lineY: 497,
      x: 119,
      maxWidth: 465,
    },
    {
      key: 'associatingPartner',
      inputId: 'associatingPartner',
      label: 'ASSOCIATING PARTNER',
      lineY: 575,
      x: 119,
      maxWidth: 465,
    },
    {
      key: 'relationshipManager',
      inputId: 'relationshipManager',
      label: 'GODREJ RELATIONSHIP MANAGER',
      lineY: 654,
      x: 119,
      maxWidth: 465,
    },
  ],

  // Shared typographic rules for every field's label + value pair.
  text: {
    fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',

    label: {
      offsetAboveLine: 30,   // baseline sits this many px above the rule
      maxSize: 14,
      minSize: 9,
      weight: 600,
      color: '#8a7d68',
      letterSpacing: 1.2,
      uppercase: true,
    },

    value: {
      offsetAboveLine: 8,    // baseline sits this many px above the rule
      maxSize: 26,
      minSize: 13,
      weight: 700,
      color: '#16213a',
      letterSpacing: 0,
    },
  },

  // The QR code takes the place of the postcard's 5th ruled line: it sits
  // just below the Relationship Manager rule, in the one patch of paper
  // that stays clear of the Dubai postmark artwork at this width. It
  // encodes all four field values as a plain-text "digital invite card" —
  // works offline, in any QR scanner, on any phone.
  qr: {
    x: 119,
    y: 680,
    size: 130,
    quietZone: 7,        // white margin drawn around the QR modules
    moduleColor: '#16213a',
    backgroundColor: '#f6f2e9', // matches the postcard paper tone

    caption: {
      x: 119 + 130 + 18,   // to the right of the QR box
      maxWidth: 465 - 130 - 18,
      lines: ['SCAN FOR', 'INVITE DETAILS'],
      lineHeight: 15,
      fontSize: 11,
      weight: 600,
      color: '#8a7d68',
      letterSpacing: 1,
      // vertical center of the caption block aligns with the QR's center
      centerY: 680 + 130 / 2,
    },

    // Builds the text payload encoded in the QR from the current field
    // values. Kept here, alongside the other QR settings, so the content
    // and the placement are easy to find and adjust together.
    buildPayload(values) {
      return [
        'GODREJ REDCo — THE INDIA HOME EDITION',
        '28th–29th November · Shangri-La Dubai',
        '',
        `Invited By: ${values.invitedBy}`,
        `Client: ${values.clientName}`,
        `Associating Partner: ${values.associatingPartner}`,
        `Godrej Relationship Manager: ${values.relationshipManager}`,
        '',
        'Meet us where possibilities begin.',
      ].join('\n');
    },
  },

  // Export settings.
  export: {
    jpgQuality: 0.95,
    filenamePrefix: 'India_Home_Edition',
    // Points-per-pixel used only to size the single-page PDF so it keeps
    // the template's exact proportions. The PDF page is a plain scale of
    // the native pixel canvas — no cropping, no letterboxing.
    pdfPointsPerPixel: 0.5,
  },
};
