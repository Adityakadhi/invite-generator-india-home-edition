const INVITE_CONFIG = {
  template: {
    src: typeof TEMPLATE_DATA_URI !== 'undefined' ? TEMPLATE_DATA_URI : 'template.png',
    width: 1350,
    height: 1043,
  },

  details: {
    left: 82,
    right: 630,
    originalRules: {
      x: 116,
      width: 480,
      centers: [418, 497, 575, 654, 736],
    },
    ruleColor: '#9c9282',
  },

  fields: [
    { key: 'invitedBy', label: 'INVITED BY', lineY: 374 },
    {
      key: 'clientName',
      label: 'CLIENT NAME',
      lineY: 460,
      showLabel: false,
      valueStyle: 'italic',
      valueWeight: 700,
    },
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

  export: {
    jpgQuality: 0.95,
    filenamePrefix: 'India_Home_Edition',
    pdfPointsPerPixel: 0.5,
  },
};
