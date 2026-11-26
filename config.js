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

  details: {
    left: 82,
    right: 630,
    originalRules: { x: 116, width: 480, centers: [418, 497, 575, 654, 736] },
    ruleColor: '#9c9282',
  },

  fields: [
    { key: 'invitedBy', label: 'INVITED BY', lineY: 374 },
    { key: 'clientName', label: 'CLIENT NAME', lineY: 460 },
    { key: 'associatingPartner', label: 'ASSOCIATING PARTNER', lineY: 546 },
    { key: 'relationshipManager', label: 'GODREJ RELATIONSHIP MANAGER', lineY: 632 },
  ],

  text: {
    fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    label: {
      offsetAboveLine: 36,
      maxSize: 25,
      minSize: 25,
      weight: 700,
      color: '#16213a',
      letterSpacing: 1,
    },
    value: {
      offsetAboveLine: 10,
      maxSize: 20,
      minSize: 15,
      weight: 500,
      color: '#343942',
      letterSpacing: 0,
    },
  },

  qr: {
    x: 82,
    y: 665,
    size: 300,
    quietZoneModules: 4,
    moduleColor: '#111827',
    backgroundColor: '#ffffff',
    caption: {
      x: 407,
      lines: ['SCAN FOR', 'INVITE DETAILS'],
      lineHeight: 22,
      fontSize: 16,
      weight: 700,
      color: '#343942',
      letterSpacing: 1,
    },
    buildPayload(values) {
      return [
        'India Home Edition | 28–29 November | 11 AM onwards',
        'Shangri-La Dubai',
        `Invited By: ${values.invitedBy}`,
        `Client Name: ${values.clientName}`,
        `Associating Partner: ${values.associatingPartner}`,
        `Godrej Relationship Manager: ${values.relationshipManager}`,
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
