/**
 * Product key pages: brochure assets + premium lookup tables from insurer leaflets.
 */
window.App = window.App || {};

App.ProductCatalog = {
  products: {
    'pa-indara': {
      id: 'pa-indara',
      type: 'pa',
      typeLabel: 'ประกันอุบัติเหตุ',
      insurer: 'อินทรประกันภัย',
      insurerCode: 'indara',
      productName: 'อินชัวร์ PA สบายใจ',
      badge: 'In-SURE',
      logo: 'assets/logos/indara.png',
      navKey: 'pa-indara',
      brochureTitle: 'โบรชัวร์ — อินชัวร์ PA สบายใจ',
      brochures: {
        default: [
          { src: 'assets/brochures/indara-pa-cover.png', label: 'หน้าปก' },
          { src: 'assets/brochures/indara-pa-table.png', label: 'ตารางความคุ้มครอง' }
        ]
      },
      formKind: 'pa-indara',
      notes: 'เบี้ยขึ้นกับอายุผู้เอาประกันและแผนที่เลือก · สัญชาติไทย อายุรับประกัน 15–60 ปี (ต่ออายุได้ถึง 70)'
    },
    'pa-axa': {
      id: 'pa-axa',
      type: 'pa',
      typeLabel: 'ประกันอุบัติเหตุ',
      insurer: 'AXA',
      insurerCode: 'axa',
      productName: 'สบายใจ มาย พีเอ – แฮปปี้ เมด',
      badge: 'AXA',
      logo: 'images/partners/axa.jpg',
      navKey: 'pa-axa',
      brochureTitle: 'โบรชัวร์ — Sabaijai My PA Happy Med',
      brochures: {
        default: [
          { src: 'assets/brochures/axa-pa-happy-med.png', label: 'แผนความคุ้มครอง' }
        ]
      },
      formKind: 'pa-axa',
      notes: 'รับอายุ 1–70 ปี · อาชีพชั้น 1–3 · ไม่รับพื้นที่ จชต. 3 จังหวัด'
    },
    'pa-bki': {
      id: 'pa-bki',
      type: 'pa',
      typeLabel: 'ประกันอุบัติเหตุ',
      insurer: 'BKI กรุงเทพประกันภัย',
      insurerCode: 'bki',
      productName: 'Happy PA',
      badge: 'BKI',
      logo: 'images/partners/bangkok-insurance.jpg',
      navKey: 'pa-bki',
      brochureTitle: 'โบรชัวร์ — Happy PA',
      brochures: {
        default: [
          { src: 'assets/brochures/bki-happy-pa.png', label: 'แผนความคุ้มครอง' }
        ]
      },
      formKind: 'pa-bki',
      notes: 'อายุ 16–60 ปี (ต่ออายุได้ถึง 65) · ค่าปลงศพ 10,000 บาท · สูงสุด 2 กรมธรรม์/คน'
    },
    'voluntary-axa': {
      id: 'voluntary-axa',
      type: 'voluntary',
      typeLabel: '2+ / 3+',
      insurer: 'AXA',
      insurerCode: 'axa',
      productName: 'ประกันรถยนต์ 2+ / 3+ ซ่อมอู่ (รถเอเชีย)',
      badge: 'AXA',
      logo: 'images/partners/axa.jpg',
      navKey: 'voluntary-axa',
      brochureTitle: 'โบรชัวร์ — AXA 2+ / 3+',
      brochureTabs: [
        { id: '3plus', label: 'ประเภท 3+' },
        { id: '2plus', label: 'ประเภท 2+' }
      ],
      brochures: {
        '3plus': [{ src: 'assets/brochures/axa-motor-3plus.png', label: '3+ ซ่อมอู่' }],
        '2plus': [{ src: 'assets/brochures/axa-motor-2plus.png', label: '2+ ซ่อมอู่' }]
      },
      formKind: 'voluntary-axa',
      notes: 'กรอกข้อมูลรถให้ครบ → กด “ตรวจสอบราคา” · รถเอเชีย อายุรถ 1–20 ปี · ใช้ส่วนบุคคลได้เบี้ยมาตรฐาน · รวมภาษีและอากรแสตมป์'
    },
    'voluntary-indara': {
      id: 'voluntary-indara',
      type: 'voluntary',
      typeLabel: '2+ / 3+',
      insurer: 'อินทรประกันภัย',
      insurerCode: 'indara',
      productName: 'อินชัวร์ 2+ 3+ แฮปปี้',
      badge: 'In-SURE',
      logo: 'assets/logos/indara.png',
      navKey: 'voluntary-indara',
      brochureTitle: 'โบรชัวร์ — อินชัวร์ 2+ 3+ แฮปปี้',
      brochures: {
        default: [
          { src: 'assets/brochures/indara-motor-cover.png', label: 'หน้าปก' },
          { src: 'assets/brochures/indara-motor-table.png', label: 'ตาราง' }
        ]
      },
      formKind: 'voluntary-indara',
      notes: 'อายุรถสูงสุด 25 ปี · ไม่ต้องตรวจสภาพรถ · ซ่อมอู่ (รถอายุไม่เกิน 7 ปี ซ่อมห้างเมื่อไม่ผิด)'
    },
    'travel-indara': {
      id: 'travel-indara',
      type: 'travel',
      typeLabel: 'ประกันเดินทาง',
      insurer: 'อินทรประกันภัย',
      insurerCode: 'indara',
      productName: 'อินชัวร์ TA All in one',
      badge: 'In-SURE',
      logo: 'assets/logos/indara.png',
      navKey: 'travel-indara',
      brochureTitle: 'โบรชัวร์ — อินชัวร์ TA All in one',
      brochures: {
        default: [
          { src: 'assets/brochures/indara-travel-cover.png', label: 'หน้าปก' },
          { src: 'assets/brochures/indara-travel-premium.png', label: 'ตารางเบี้ย' },
          { src: 'assets/brochures/indara-travel-coverage.png', label: 'ความคุ้มครอง' },
          { src: 'assets/brochures/indara-travel-terms.png', label: 'เงื่อนไข' }
        ]
      },
      formKind: 'travel-indara',
      notes: 'อายุ 1–80 ปี · เดินทางเริ่มและสิ้นสุดในไทย · 1 กรมธรรม์ต่อช่วงเวลา'
    },
    'compulsory-indara': {
      id: 'compulsory-indara',
      type: 'prb',
      typeLabel: 'พ.ร.บ.',
      insurer: 'อินทรประกันภัย',
      insurerCode: 'indara',
      productName: 'พ.ร.บ. อินทรประกันภัย',
      badge: 'In-SURE',
      logo: 'assets/logos/indara.png',
      navKey: 'compulsory-indara',
      brochureTitle: 'โบรชัวร์ — อินทรประกันภัย',
      brochures: {
        default: [
          { src: 'assets/brochures/indara-motor-cover.png', label: 'หน้าปก' },
          { src: 'assets/brochures/indara-motor-table.png', label: 'ตาราง' }
        ]
      }
    },

    'compulsory-ergo': {
      id: 'compulsory-ergo',
      type: 'prb',
      typeLabel: 'พ.ร.บ.',
      insurer: 'เออร์โกประกันภัย',
      insurerCode: 'ergo',
      productName: 'พ.ร.บ. เออร์โกประกันภัย',
      badge: 'In-SURE',
      logo: 'assets/logos/ergo.png',
      navKey: 'compulsory-ergo',
      brochureTitle: 'โบรชัวร์ — เออร์โกประกันภัย',
      brochures: {
        default: []
      }
    }
  },

  get(id) {
    return this.products[id] || null;
  },

  /** Premium calculators keyed by formKind */
  calcPremium(formKind, values) {
    const calc = this._calculators[formKind];
    if (!calc) return null;
    return calc(values);
  },

  _calculators: {
    'pa-indara'(v) {
      const plan = String(v.plan || '1');
      const age = Number(v.age) || 0;
      const table = {
        '1': { a: 540, b: 644, c: 852 },
        '2': { a: 1150, b: 1376, c: 1828 },
        '3': { a: 1920, b: 2300, c: 3060 },
        '4': { a: 3600, b: 4316, c: 5748 }
      };
      const row = table[plan];
      if (!row) return null;
      if (age >= 15 && age <= 60) return row.a;
      if (age >= 61 && age <= 65) return row.b;
      if (age >= 66 && age <= 70) return row.c;
      return null;
    },

    'pa-axa'(v) {
      const plan = String(v.plan || '1');
      const age = Number(v.age) || 0;
      const occ = String(v.occupationClass || '1');
      // Happy Med 1 / 2 / 3
      if (age >= 1 && age <= 17) {
        if (plan === '1') return 1940;
        if (plan === '2') return 3650;
        return null; // plan 3 N/A
      }
      const adult = {
        '1': { '1': 1940, '2': 2240, '3': 2430 },
        '2': { '1': 3150, '2': 3650, '3': 4200 },
        '3': { '1': 4470, '2': 5420, '3': 6660 }
      };
      const senior = {
        '1': { '1': 2280, '2': 2580, '3': 2870 },
        '2': { '1': 4730, '2': 5380, '3': 5800 },
        '3': { '1': 7510, '2': 9120, '3': 10800 }
      };
      if (age >= 18 && age <= 65) return adult[plan]?.[occ] ?? null;
      if (age >= 66 && age <= 70) return senior[plan]?.[occ] ?? null;
      return null;
    },

    'pa-bki'(v) {
      const sum = Number(v.sumInsured) || 0;
      const withMed = v.planType === 'B';
      const table = {
        500000: { A: 770, B: 2500 },
        600000: { A: 930, B: 2800 },
        700000: { A: 1080, B: 3100 },
        800000: { A: 1240, B: 3400 },
        900000: { A: 1390, B: 3700 },
        1000000: { A: 1550, B: 4000 },
        1500000: { A: 2320, B: 5400 },
        2000000: { A: 3090, B: 7000 },
        2500000: { A: 3860, B: 8700 },
        3000000: { A: 4630, B: 10600 }
      };
      const row = table[sum];
      if (!row) return null;
      return withMed ? row.B : row.A;
    },

    'voluntary-axa'(v) {
      const cover = String(v.coverType || v.coverTypeRadio || '3plus');
      const sum = Number(v.sumInsured) || 100000;
      let area = String(v.area || '');
      if (!area && v.regProvince && App.VoluntaryAxaQuote?.resolveArea) {
        area = App.VoluntaryAxaQuote.resolveArea(v.regProvince);
      }
      if (!area) area = 'province';

      if (cover === '3' || cover === 'type3') {
        let premium = area === 'bkk' ? 2700 : 2501;
        if (String(v.dashcam) === 'yes') premium = Math.round(premium * 0.98);
        if (String(v.usageType) === 'commercial') premium = Math.round(premium * 1.08);
        return premium;
      }

      const rates3 = {
        100000: { bkk: 6300, province: 5800 },
        200000: { bkk: 7300, province: 6800 },
        300000: { bkk: 8300, province: 7800 }
      };
      const rates2 = {
        100000: { bkk: 6900, province: 6200 },
        200000: { bkk: 7900, province: 7200 },
        300000: { bkk: 8900, province: 8200 }
      };
      const table = cover === '2plus' ? rates2 : rates3;
      const row = table[sum] || table[100000];
      if (!row) return null;
      let premium = area === 'bkk' ? row.bkk : row.province;
      const deductible = Number(v.deductible);
      if (deductible > 0) premium = Math.max(0, premium - Math.round(deductible * 0.15));
      if (String(v.garageType) === 'dealer') premium = Math.round(premium * 1.06);
      if (String(v.dashcam) === 'yes') premium = Math.round(premium * 0.98);
      if (String(v.usageType) === 'commercial') premium = Math.round(premium * 1.08);
      return premium;
    },

    'voluntary-indara'(v) {
      const cover = String(v.coverType || '3plus');
      const plan = String(v.plan || '1');
      const sum = Number(v.sumInsured) || 50000;
      const vt = String(v.vehicleType || '110');
      const t3 = {
        50000: { '1': { '110': 5200, '320': 5550 }, '2': { '110': 5700, '320': 6050 } },
        100000: { '1': { '110': 6100, '320': 6500 }, '2': { '110': 6700, '320': 7100 } },
        200000: { '1': { '110': 7500, '320': 8000 }, '2': { '110': 8200, '320': 8700 } },
        300000: { '1': { '110': 8900, '320': 9500 }, '2': { '110': 9700, '320': 10300 } }
      };
      const t2 = {
        50000: { '1': { '110': 6800, '320': 7200 }, '2': { '110': 7400, '320': 7800 } },
        100000: { '1': { '110': 7900, '320': 8400 }, '2': { '110': 8600, '320': 9100 } },
        200000: { '1': { '110': 9700, '320': 10300 }, '2': { '110': 10500, '320': 11100 } },
        300000: { '1': { '110': 11500, '320': 12200 }, '2': { '110': 12400, '320': 13100 } }
      };
      return (cover === '2plus' ? t2 : t3)[sum]?.[plan]?.[vt] ?? null;
    },

    'travel-indara'(v) {
      const plan = Number(v.plan) || 1;
      const region = String(v.region || 'asia');
      const trip = String(v.tripType || 'single');
      if (trip === 'annual') {
        return [1050, 2505, 3535, 4915, 8450][plan - 1] ?? null;
      }
      const asia = {
        '1-4': [140, 265, 375, 490, 655],
        '5-6': [155, 335, 485, 635, 920],
        '7-8': [175, 405, 590, 775, 1120],
        '9-10': [190, 450, 660, 865, 1250],
        '11-14': [225, 535, 790, 1035, 1490],
        '15-21': [275, 665, 985, 1290, 1860],
        '22-31': [325, 795, 1180, 1545, 2225],
        '32-60': [445, 1100, 1635, 2140, 3085],
        '61-90': [545, 1365, 2025, 2650, 3820]
      };
      const ww = {
        '1-4': [210, 380, 520, 650, 795],
        '5-6': [280, 520, 720, 950, 1270],
        '7-8': [320, 610, 860, 1140, 1540],
        '9-10': [360, 680, 960, 1270, 1710],
        '11-14': [420, 800, 1130, 1500, 2045],
        '15-21': [510, 980, 1390, 1850, 2550],
        '22-31': [600, 1160, 1650, 2200, 3055],
        '32-60': [820, 1610, 2290, 3050, 4235],
        '61-90': [980, 1960, 2790, 3720, 5245]
      };
      const duration = String(v.duration || '1-4');
      const table = region === 'worldwide' ? ww : asia;
      return table[duration]?.[plan - 1] ?? null;
    }
  }
};
