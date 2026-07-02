/**
 * Mock dataset — mirrors expected API response shapes.
 */
window.App = window.App || {};

App.MockData = {
  users: [
    {
      id: 'agent-001',
      username: 'Ck1-039',
      password: 'demo',
      role: 'agent',
      name: 'สมชาย ใจดี',
      agentCode: 'Ck1-039',
      email: 'ck1039@example.com',
      phone: '081-234-5678',
      initials: 'CK',
      balance: 34531.73
    },
    {
      id: 'agent-002',
      username: 'Ag2-112',
      password: 'demo',
      role: 'agent',
      name: 'วิไล รักษ์ดี',
      agentCode: 'Ag2-112',
      email: 'ag2112@example.com',
      phone: '082-345-6789',
      initials: 'WR',
      balance: 12890.5
    },
    {
      id: 'admin-001',
      username: 'admin',
      password: 'demo',
      role: 'admin',
      name: 'ผู้ดูแลระบบ',
      email: 'admin@api999.local',
      phone: '02-000-0000',
      initials: 'AD',
      balance: null
    }
  ],

  agents: [
    {
      id: 'agent-001',
      code: 'Ck1-039',
      name: 'สมชาย ใจดี',
      email: 'ck1039@example.com',
      phone: '081-234-5678',
      balance: 34531.73,
      creditLimit: 50000,
      status: 'active',
      createdAt: '2024-03-15'
    },
    {
      id: 'agent-002',
      code: 'Ag2-112',
      name: 'วิไล รักษ์ดี',
      email: 'ag2112@example.com',
      phone: '082-345-6789',
      balance: 12890.5,
      creditLimit: 30000,
      status: 'active',
      createdAt: '2024-08-02'
    },
    {
      id: 'agent-003',
      code: 'Ag3-205',
      name: 'ประเสริฐ มั่นคง',
      email: 'ag3205@example.com',
      phone: '089-111-2233',
      balance: 5200,
      creditLimit: 15000,
      status: 'inactive',
      createdAt: '2025-01-10'
    }
  ],

  policies: [
    {
      id: 'POL-2026-001',
      agentId: 'agent-001',
      agentCode: 'Ck1-039',
      type: 'prb',
      typeLabel: 'พ.ร.บ.',
      insurer: 'อินทรประกันภัย',
      insurerCode: 'indara',
      plate: 'กข 1234',
      premium: 645.21,
      status: 'active',
      issuedAt: '2026-06-01',
      expiresAt: '2027-06-01',
      insuredName: 'นายสมชาย ใจดี',
      vehicleBrand: 'Toyota',
      vehicleModel: 'Vios'
    },
    {
      id: 'POL-2026-002',
      agentId: 'agent-001',
      agentCode: 'Ck1-039',
      type: 'prb',
      typeLabel: 'พ.ร.บ.',
      insurer: 'อินทรประกันภัย',
      insurerCode: 'indara',
      plate: 'ขค 5678',
      premium: 645.21,
      status: 'active',
      issuedAt: '2026-06-10',
      expiresAt: '2027-06-10',
      insuredName: 'นางสาวมาลี รักเรียน',
      vehicleBrand: 'Honda',
      vehicleModel: 'City'
    },
    {
      id: 'POL-2026-003',
      agentId: 'agent-002',
      agentCode: 'Ag2-112',
      type: 'prb',
      typeLabel: 'พ.ร.บ.',
      insurer: 'วิริยะประกันภัย',
      insurerCode: 'viriyah',
      plate: 'นค 9012',
      premium: 720,
      status: 'active',
      issuedAt: '2026-06-12',
      expiresAt: '2027-06-12',
      insuredName: 'นายวิชัย ขยัน',
      vehicleBrand: 'Isuzu',
      vehicleModel: 'D-Max'
    },
    {
      id: 'POL-2026-004',
      agentId: 'agent-001',
      agentCode: 'Ck1-039',
      type: 'voluntary',
      typeLabel: 'สมัครใจ',
      insurer: 'เออร์โกประกันภัย',
      insurerCode: 'ergo',
      plate: 'กท 3344',
      premium: 8500,
      status: 'pending',
      issuedAt: '2026-06-18',
      expiresAt: '2027-06-18',
      insuredName: 'นายประเสริฐ มั่นคง',
      vehicleBrand: 'Mazda',
      vehicleModel: 'CX-5'
    },
    {
      id: 'POL-2026-005',
      agentId: 'agent-001',
      agentCode: 'Ck1-039',
      type: 'prb',
      typeLabel: 'พ.ร.บ.',
      insurer: 'วิริยะประกันภัย',
      insurerCode: 'viriyah',
      plate: 'ชลบุรี 8899',
      premium: 680,
      status: 'failed',
      issuedAt: '2026-06-20',
      expiresAt: null,
      insuredName: 'นางฟ้า ใส',
      vehicleBrand: 'Nissan',
      vehicleModel: 'Almera',
      apiError: 'OPApi timeout: connection refused after 30s'
    },
    {
      id: 'POL-2025-088',
      agentId: 'agent-001',
      agentCode: 'Ck1-039',
      type: 'prb',
      typeLabel: 'พ.ร.บ.',
      insurer: 'อินทรประกันภัย',
      insurerCode: 'indara',
      plate: '1กก 9999',
      premium: 645.21,
      status: 'active',
      issuedAt: '2025-07-15',
      expiresAt: '2026-07-14',
      insuredName: 'นายเก่ง มาก',
      vehicleBrand: 'Toyota',
      vehicleModel: 'Yaris'
    }
  ],

  teamMembers: {
    'agent-001': [
      {
        id: 'sub-001',
        code: 'Ck1-039',
        userId: 'Ck1-039',
        name: 'คุณเฟิร์น',
        phone: '-',
        balance: 50000,
        status: 'active',
        idCard: '-',
        birthDate: '30/11/-0001',
        email: '-',
        address: '-',
        policies: 12,
        premium: 8400
      },
      {
        id: 'sub-002',
        code: 'Ck2-040',
        userId: 'Ck2-040',
        name: 'สมชาย ใจดี',
        phone: '081-234-5678',
        balance: 50000,
        status: 'active',
        idCard: '1103700123456',
        birthDate: '15/03/1985',
        email: 'somchai@example.com',
        address: 'กรุงเทพมหานคร',
        policies: 8,
        premium: 5200
      }
    ]
  },

  notifications: {
    'agent-001': [
      { id: 'n1', type: 'balance', title: 'วงเงินใกล้หมด', message: 'วงเงินคงเหลือต่ำกว่า 40% ของเพดาน (50,000 บ.)', read: false, createdAt: '2026-06-23T09:00:00' },
      { id: 'n2', type: 'policy', title: 'กรมธรรม์รอดำเนินการ', message: 'POL-2026-004 สมัครใจ — รอตรวจสอบ', read: false, createdAt: '2026-06-18T14:30:00' },
      { id: 'n3', type: 'renew', title: 'ใกล้หมดอายุ', message: 'กรมธรรม์ 1กก 9999 หมดอายุ 14/07/2026', read: true, createdAt: '2026-06-20T08:00:00' }
    ],
    'admin-001': [
      { id: 'an1', type: 'policy', title: 'กรมธรรม์ล้มเหลว', message: 'POL-2026-005 — OPApi timeout', read: false, createdAt: '2026-06-20T11:00:00' }
    ]
  },

  adminUsers: [
    { id: 'admin-001', username: 'admin', name: 'ผู้ดูแลระบบ', role: 'super_admin', roleLabel: 'Super Admin', status: 'active' },
    { id: 'admin-002', username: 'ops', name: 'ฝ่ายปฏิบัติการ', role: 'ops_admin', roleLabel: 'Ops (ดูอย่างเดียว)', status: 'active' }
  ],

  creditLedger: [
    {
      id: 'CL-001',
      agentId: 'agent-001',
      agentCode: 'Ck1-039',
      agentName: 'สมชาย ใจดี',
      type: 'credit',
      amount: 5000,
      balanceAfter: 34531.73,
      note: 'เติมวงเงินประจำเดือน',
      createdBy: 'admin-001',
      createdByName: 'ผู้ดูแลระบบ',
      createdAt: '2026-06-15T10:30:00'
    },
    {
      id: 'CL-002',
      agentId: 'agent-002',
      agentCode: 'Ag2-112',
      agentName: 'วิไล รักษ์ดี',
      type: 'credit',
      amount: 3000,
      balanceAfter: 12890.5,
      note: 'เติมวงเงินเริ่มต้น',
      createdBy: 'admin-001',
      createdByName: 'ผู้ดูแลระบบ',
      createdAt: '2026-06-10T14:00:00'
    },
    {
      id: 'CL-003',
      agentId: 'agent-001',
      agentCode: 'Ck1-039',
      agentName: 'สมชาย ใจดี',
      type: 'debit',
      amount: -500,
      balanceAfter: 29531.73,
      note: 'หักค่าธรรมเนียม',
      createdBy: 'admin-001',
      createdByName: 'ผู้ดูแลระบบ',
      createdAt: '2026-06-01T09:15:00'
    }
  ],

  auditLogs: [
    {
      id: 'AUD-001',
      action: 'login',
      actionLabel: 'เข้าสู่ระบบ',
      actorId: 'admin-001',
      actorName: 'ผู้ดูแลระบบ',
      detail: 'Admin login',
      createdAt: '2026-06-23T08:00:00'
    },
    {
      id: 'AUD-002',
      action: 'balance_adjust',
      actionLabel: 'ปรับวงเงิน',
      actorId: 'admin-001',
      actorName: 'ผู้ดูแลระบบ',
      detail: 'เติมวงเงิน Ck1-039 +5,000 บาท',
      createdAt: '2026-06-15T10:30:00'
    },
    {
      id: 'AUD-003',
      action: 'insurer_update',
      actionLabel: 'ตั้งค่า API',
      actorId: 'admin-001',
      actorName: 'ผู้ดูแลระบบ',
      detail: 'ปิด API โตเกียวมารีนประกันภัย',
      createdAt: '2026-06-12T16:45:00'
    },
    {
      id: 'AUD-004',
      action: 'agent_status',
      actionLabel: 'เปลี่ยนสถานะนายหน้า',
      actorId: 'admin-001',
      actorName: 'ผู้ดูแลระบบ',
      detail: 'ระงับบัญชี Ag3-205',
      createdAt: '2026-06-05T11:20:00'
    }
  ],

  monthlyRevenue: {
    'agent-001': {
      prb: {
        labels: ['1/2026', '2/2026', '3/2026', '4/2026', '5/2026', '6/2026'],
        values: [12000, 28000, 18000, 45000, 32000, 55000]
      },
      voluntary: {
        labels: ['1/2026', '2/2026', '3/2026', '4/2026', '5/2026', '6/2026'],
        values: [0, 0, 0, 0, 0, 0]
      }
    },
    'agent-002': {
      prb: {
        labels: ['1/2026', '2/2026', '3/2026', '4/2026', '5/2026', '6/2026'],
        values: [5000, 8000, 12000, 9000, 15000, 11000]
      },
      voluntary: {
        labels: ['1/2026', '2/2026', '3/2026', '4/2026', '5/2026', '6/2026'],
        values: [0, 0, 2000, 0, 0, 0]
      }
    },
    all: {
      prb: {
        labels: ['1/2026', '2/2026', '3/2026', '4/2026', '5/2026', '6/2026'],
        values: [17000, 36000, 30000, 54000, 47000, 66000]
      },
      voluntary: {
        labels: ['1/2026', '2/2026', '3/2026', '4/2026', '5/2026', '6/2026'],
        values: [0, 0, 2000, 0, 0, 0]
      }
    }
  },

  dailySummary: {
    'agent-001': { prb: 3300, voluntary: 0, total: 3300 },
    'agent-002': { prb: 1440, voluntary: 0, total: 1440 },
    all: { prb: 4740, voluntary: 0, total: 4740 }
  },

  insurers: [
    {
      id: 'ins-indara',
      name: 'อินทรประกันภัย',
      code: 'indara',
      apiProvider: 'In-SURE',
      apiEnabled: true,
      apiEndpoint: 'https://api.insure-mock.local/v1',
      apiTimeout: 30,
      products: ['prb', 'voluntary']
    },
    {
      id: 'ins-viriyah',
      name: 'วิริยะประกันภัย',
      code: 'viriyah',
      apiProvider: 'OPApi',
      apiEnabled: true,
      apiEndpoint: 'https://opapi.viriyah-mock.local/v2',
      apiTimeout: 30,
      products: ['prb']
    },
    {
      id: 'ins-tokio',
      name: 'โตเกียวมารีนประกันภัย',
      code: 'tokio-marine',
      apiProvider: null,
      apiEnabled: false,
      apiEndpoint: '',
      apiTimeout: 30,
      products: ['prb', 'voluntary']
    },
    {
      id: 'ins-ergo',
      name: 'เออร์โกประกันภัย',
      code: 'ergo',
      apiProvider: 'In-SURE',
      apiEnabled: true,
      apiEndpoint: 'https://api.insure-mock.local/ergo/v1',
      apiTimeout: 45,
      products: ['prb', 'voluntary', 'accident']
    }
  ],

  commissions: {
    'agent-001': [
      {
        id: 'COM-001',
        policyNo: 'POL-2026-001',
        policyType: 'prb',
        policyTypeLabel: 'พ.ร.บ.',
        insurer: 'อินทรประกันภัย',
        plate: 'กข 1234',
        premium: 645.21,
        rate: 15,
        amount: 96.78,
        status: 'paid',
        period: '2026-06',
        paidAt: '2026-06-15'
      },
      {
        id: 'COM-002',
        policyNo: 'POL-2026-002',
        policyType: 'prb',
        policyTypeLabel: 'พ.ร.บ.',
        insurer: 'อินทรประกันภัย',
        plate: 'ขค 5678',
        premium: 645.21,
        rate: 15,
        amount: 96.78,
        status: 'paid',
        period: '2026-06',
        paidAt: '2026-06-18'
      },
      {
        id: 'COM-003',
        policyNo: 'POL-2026-004',
        policyType: 'voluntary',
        policyTypeLabel: 'ภาคสมัครใจ',
        insurer: 'อินทรประกันภัย',
        plate: '3งง 8888',
        premium: 8500,
        rate: 12,
        amount: 1020,
        status: 'pending',
        period: '2026-06',
        paidAt: null
      },
      {
        id: 'COM-004',
        policyNo: 'POL-2025-088',
        policyType: 'prb',
        policyTypeLabel: 'พ.ร.บ.',
        insurer: 'อินทรประกันภัย',
        plate: '1กก 9999',
        premium: 645.21,
        rate: 15,
        amount: 96.78,
        status: 'pending',
        period: '2026-06',
        paidAt: null
      }
    ],
    'agent-002': [
      {
        id: 'COM-101',
        policyNo: 'POL-2026-003',
        policyType: 'prb',
        policyTypeLabel: 'พ.ร.บ.',
        insurer: 'วิริยะประกันภัย',
        plate: 'นค 9012',
        premium: 720,
        rate: 14,
        amount: 100.8,
        status: 'paid',
        period: '2026-06',
        paidAt: '2026-06-12'
      }
    ]
  },

  creditRequests: [
    {
      id: 'CR-001',
      agentId: 'agent-001',
      agentCode: 'Ck1-039',
      amount: 10000,
      note: 'ขอเติมวงเงินสำหรับยอดขายสัปดาห์นี้',
      status: 'approved',
      createdAt: '2026-06-10T09:00:00',
      reviewedAt: '2026-06-10T14:30:00',
      reviewedByName: 'ผู้ดูแลระบบ'
    },
    {
      id: 'CR-002',
      agentId: 'agent-001',
      agentCode: 'Ck1-039',
      amount: 5000,
      note: 'วงเงินใกล้หมด — ขอเติมด่วน',
      status: 'pending',
      createdAt: '2026-06-28T11:00:00',
      reviewedAt: null,
      reviewedByName: null
    }
  ],

  monthlySalesDetail: {
    'agent-001': {
      '2026-06': {
        summary: {
          prb: { count: 12, premium: 7742.52 },
          voluntary: { count: 2, premium: 17000 },
          total: { count: 14, premium: 24742.52 }
        },
        byInsurer: [
          { insurer: 'อินทรประกันภัย', count: 10, premium: 6452.1 },
          { insurer: 'วิริยะประกันภัย', count: 2, premium: 1440 },
          { insurer: 'เออร์โกประกันภัย', count: 2, premium: 16850.42 }
        ],
        byDay: [
          { date: '2026-06-01', count: 2, premium: 1290.42 },
          { date: '2026-06-05', count: 1, premium: 645.21 },
          { date: '2026-06-10', count: 3, premium: 9645.21 },
          { date: '2026-06-15', count: 4, premium: 2580.84 },
          { date: '2026-06-20', count: 2, premium: 9200 },
          { date: '2026-06-25', count: 2, premium: 1380.64 }
        ]
      },
      '2026-05': {
        summary: {
          prb: { count: 8, premium: 5161.68 },
          voluntary: { count: 0, premium: 0 },
          total: { count: 8, premium: 5161.68 }
        },
        byInsurer: [
          { insurer: 'อินทรประกันภัย', count: 8, premium: 5161.68 }
        ],
        byDay: [
          { date: '2026-05-03', count: 2, premium: 1290.42 },
          { date: '2026-05-12', count: 3, premium: 1935.63 },
          { date: '2026-05-22', count: 3, premium: 1935.63 }
        ]
      }
    },
    'agent-002': {
      '2026-06': {
        summary: {
          prb: { count: 5, premium: 3600 },
          voluntary: { count: 1, premium: 2000 },
          total: { count: 6, premium: 5600 }
        },
        byInsurer: [
          { insurer: 'วิริยะประกันภัย', count: 5, premium: 3600 },
          { insurer: 'อินทรประกันภัย', count: 1, premium: 2000 }
        ],
        byDay: [
          { date: '2026-06-08', count: 2, premium: 1440 },
          { date: '2026-06-18', count: 4, premium: 4160 }
        ]
      }
    },
    all: {
      '2026-06': {
        summary: {
          prb: { count: 17, premium: 11342.52 },
          voluntary: { count: 3, premium: 19000 },
          total: { count: 20, premium: 30342.52 }
        },
        byInsurer: [
          { insurer: 'อินทรประกันภัย', count: 11, premium: 8452.1 },
          { insurer: 'วิริยะประกันภัย', count: 7, premium: 5040 },
          { insurer: 'เออร์โกประกันภัย', count: 2, premium: 16850.42 }
        ],
        byDay: [
          { date: '2026-06-01', count: 2, premium: 1290.42 },
          { date: '2026-06-08', count: 2, premium: 1440 },
          { date: '2026-06-10', count: 3, premium: 9645.21 },
          { date: '2026-06-15', count: 4, premium: 2580.84 },
          { date: '2026-06-18', count: 4, premium: 4160 },
          { date: '2026-06-20', count: 2, premium: 9200 },
          { date: '2026-06-25', count: 3, premium: 2026.05 }
        ]
      }
    }
  },

  teamSalesReport: {
    'agent-001': {
      '2026-06': [
        { leaderCode: 'Ck1-039', leaderName: 'สมชาย ใจดี', memberCode: 'Ck1-039', memberName: 'คุณเฟิร์น', policyCount: 5, premium: 3300, commission: 495 },
        { leaderCode: 'Ck1-039', leaderName: 'สมชาย ใจดี', memberCode: 'Ck2-040', memberName: 'สมชาย ใจดี', policyCount: 3, premium: 1935.63, commission: 290.34 },
        { leaderCode: 'Ck1-039', leaderName: 'สมชาย ใจดี', memberCode: 'Ck3-041', memberName: 'วิไล ดีใจ', policyCount: 2, premium: 1290.42, commission: 193.56 }
      ],
      '2026-05': [
        { leaderCode: 'Ck1-039', leaderName: 'สมชาย ใจดี', memberCode: 'Ck1-039', memberName: 'คุณเฟิร์น', policyCount: 4, premium: 2580.84, commission: 387.13 },
        { leaderCode: 'Ck1-039', leaderName: 'สมชาย ใจดี', memberCode: 'Ck2-040', memberName: 'สมชาย ใจดี', policyCount: 2, premium: 1290.42, commission: 193.56 }
      ]
    },
    all: {
      '2026-06': [
        { leaderCode: 'Ck1-039', leaderName: 'สมชาย ใจดี', memberCode: 'Ck1-039', memberName: 'คุณเฟิร์น', policyCount: 5, premium: 3300, commission: 495 },
        { leaderCode: 'Ck1-039', leaderName: 'สมชาย ใจดี', memberCode: 'Ck2-040', memberName: 'สมชาย ใจดี', policyCount: 3, premium: 1935.63, commission: 290.34 },
        { leaderCode: 'Ck1-039', leaderName: 'สมชาย ใจดี', memberCode: 'Ck3-041', memberName: 'วิไล ดีใจ', policyCount: 2, premium: 1290.42, commission: 193.56 }
      ]
    }
  },

  receipts: [
    {
      id: 'RCP-2026-001',
      agentId: 'agent-001',
      agentCode: 'Ck1-039',
      agentName: 'สมชาย ใจดี',
      receiptNo: 'RC-6806-001',
      customerName: 'นายสมชาย ใจดี',
      policyNo: 'POL-2026-001',
      amount: 645.21,
      issuedAt: '2026-06-15T10:30:00',
      status: 'active'
    },
    {
      id: 'RCP-2026-002',
      agentId: 'agent-001',
      agentCode: 'Ck1-039',
      agentName: 'สมชาย ใจดี',
      receiptNo: 'RC-6806-002',
      customerName: 'นางสาวมาลี รักเรียน',
      policyNo: 'POL-2026-002',
      amount: 645.21,
      issuedAt: '2026-06-18T14:00:00',
      status: 'active'
    },
    {
      id: 'RCP-2026-003',
      agentId: 'agent-002',
      agentCode: 'Ag2-112',
      agentName: 'วิไล รักษ์ดี',
      receiptNo: 'RC-6806-003',
      customerName: 'นายประเสริฐ มั่นคง',
      policyNo: 'POL-2026-003',
      amount: 720,
      issuedAt: '2026-06-20T09:15:00',
      status: 'active'
    }
  ],

  productSettings: {
    indara: { prb: true, voluntary: true, accident: false },
    viriyah: { prb: true, voluntary: false, accident: false },
    'tokio-marine': { prb: false, voluntary: true, accident: false },
    ergo: { prb: true, voluntary: true, accident: true }
  }
};
