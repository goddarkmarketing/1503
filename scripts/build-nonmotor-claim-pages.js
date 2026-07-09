const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const cssVer = '20260709n';

const partners = {
  viriyah: { name: 'วิริยะประกันภัย', img: 'viriyah.jpg' },
  'bangkok-insurance': { name: 'กรุงเทพประกันภัย', img: 'bangkok-insurance.jpg' },
  'muang-thai': { name: 'เมืองไทยประกันภัย', img: 'muang-thai.jpg' },
  'tokyo-marine': { name: 'คุ้มภัยโตเกียวมารีน', img: 'tokyo-marine.jpg' },
  allianz: { name: 'อลิอันซ์ อยุธยา', img: 'allianz.jpg' },
  ergo: { name: 'เออร์โกประกันภัย', img: 'ergo.jpg' },
  dhipaya: { name: 'ทิพยประกันภัย', img: 'dhipaya.jpg' },
  axa: { name: 'แอกซ่าประกันภัย', img: 'axa.jpg' },
  thaivivat: { name: 'ประกันภัยไทยวิวัฒน์', img: 'thaivivat.jpg' },
  thanachart: { name: 'ธนชาตประกันภัย', img: 'thanachart.jpg' },
  msig: { name: 'MSIG', img: 'msig.jpg' },
  chubb: { name: 'ชับบ์สามัคคีประกันภัย', img: 'chubb.jpg' },
  aig: { name: 'AIG', img: 'aig.jpg' },
  aioi: { name: 'ไอโออิ กรุงเทพ ประกันภัย', img: 'aioi.jpg' },
  deves: { name: 'เทเวศประกันภัย', img: 'deves.jpg' },
  indara: { name: 'อินทรประกันภัย', img: 'indara.jpg' },
  navakij: { name: 'นวกิจประกันภัย', img: 'navakij.jpg' }
};

const navItems = [
  { file: 'claims-nonmotor-docs.html', label: 'กรมธรรม์ประกันอัคคีภัย', slug: 'fire' },
  { file: 'claims-nonmotor-risks.html', label: 'กรมธรรม์ประกันภัยความเสี่ยงภัยทุกชนิด', slug: 'risks' },
  { file: 'claims-nonmotor-legal.html', label: 'กรมธรรม์ประกันภัยที่ให้ความคุ้มครองเกี่ยวกับความรับผิดตามกฎหมาย', slug: 'legal' },
  { file: 'claims-nonmotor-engineering.html', label: 'กรมธรรม์ประกันภัยที่ให้ความคุ้มครองเกี่ยวกับงานวิศวกรรม', slug: 'engineering' },
  { file: 'claims-nonmotor-transport.html', label: 'กรมธรรม์ประกันภัยการขนส่งสินค้า', slug: 'transport' },
  { file: 'claims-nonmotor-golf.html', label: 'กรมธรรม์ประกันภัยกอล์ฟ', slug: 'golf' },
  { file: 'claims-nonmotor-health.html', label: 'กรมธรรม์ประกันอุบัติเหตุและประกันสุขภาพ', slug: 'health' },
  { file: 'claims-nonmotor-travel.html', label: 'กรมธรรม์ประกันเดินทาง', slug: 'travel' }
];

const pages = [
  {
    file: 'claims-nonmotor-docs.html',
    slug: 'fire',
    title: 'กรมธรรม์ประกันอัคคีภัย',
    crumb: 'เอกสารเคลมอัคคีภัย',
    meta: 'เอกสารและแบบฟอร์มเคลมประกันอัคคีภัย — กล้าดีโบรคเกอร์',
    intro: 'กรมธรรม์อัคคีภัย คือ ประกันภัยที่คุ้มครองความเสียหายต่อทรัพย์สินจากไฟไหม้ ฟ้าผ่า การระเบิดจากแก๊ส และอาจรวมถึงภัยอื่นๆ ที่ระบุเพิ่มเติมไว้ในกรมธรรม์ เช่น ลมพายุ น้ำท่วม แผ่นดินไหว หรือเหตุการณ์อื่นๆ ตามเงื่อนไขที่กำหนด',
    sections: [{ heading: 'เอกสารที่ต้องเตรียม', items: [
      'หนังสือเรียกร้องค่าเสียหายจากผู้เอาประกันภัย (แบบฟอร์มของบริษัทประกัน)',
      'รายงานการเกิดเหตุ',
      'ภาพถ่ายความเสียหาย',
      'ใบเสร็จรับเงิน ใบเสนอราคาค่าซ่อม / ค่าอะไหล่',
      'เอกสารอื่นๆ ที่เกี่ยวข้อง (ถ้ามี)'
    ]}],
    insurers: ['bangkok-insurance', 'allianz', 'navakij', 'tokyo-marine', 'msig', 'muang-thai', 'dhipaya', 'aig', 'chubb', 'indara', 'viriyah', 'ergo']
  },
  {
    file: 'claims-nonmotor-risks.html',
    slug: 'risks',
    title: 'กรมธรรม์ประกันภัยความเสี่ยงภัยทุกชนิด',
    crumb: 'เอกสารเคลมความเสี่ยงภัย',
    meta: 'เอกสารเคลมประกันความเสี่ยงภัยทุกชนิด — กล้าดีโบรคเกอร์',
    intro: 'กรมธรรม์ความเสี่ยงภัยทุกชนิด คือ ประกันภัยที่ให้ความคุ้มครองต่อความเสียหายหรือสูญเสียของทรัพย์สินจากเหตุการณ์ที่ไม่คาดคิด เช่น อุบัติเหตุ ภัยธรรมชาติ ตามเงื่อนไขและข้อยกเว้นที่ระบุไว้ในกรมธรรม์',
    sections: [{ heading: 'เอกสารที่ต้องเตรียม', items: [
      'หนังสือเรียกร้องค่าเสียหายจากผู้เอาประกันภัย (แบบฟอร์มของบริษัทประกัน)',
      'รายงานการเกิดเหตุ',
      'รายการทรัพย์สินที่เสียหาย / สูญหาย',
      'ภาพถ่ายความเสียหาย',
      'ใบเสร็จรับเงิน ใบเสนอราคาค่าซ่อม / ค่าอะไหล่',
      'สำเนาบันทึกประจำวันเกี่ยวกับคดี',
      'เอกสารแสดงความรับผิด กรณีทรัพย์สินเสียหายโดยการกระทำของบุคคลภายนอก',
      'เอกสารอื่นๆ ที่เกี่ยวข้อง (ถ้ามี)'
    ]}],
    insurers: ['bangkok-insurance', 'muang-thai', 'tokyo-marine', 'dhipaya', 'chubb', 'aig', 'indara', 'viriyah']
  },
  {
    file: 'claims-nonmotor-legal.html',
    slug: 'legal',
    title: 'กรมธรรม์ประกันภัยที่ให้ความคุ้มครองเกี่ยวกับความรับผิดตามกฎหมาย',
    crumb: 'เอกสารเคลมความรับผิดตามกฎหมาย',
    meta: 'เอกสารเคลมประกันความรับผิดตามกฎหมาย — กล้าดีโบรคเกอร์',
    intro: 'กรมธรรม์ความรับผิดตามกฎหมาย คือ ประกันภัยที่คุ้มครองความเสียหายที่ผู้เอาประกันอาจต้องรับผิดชอบต่อบุคคลภายนอก ไม่ว่าจะเป็นความเสียหายต่อชีวิต ร่างกาย หรือทรัพย์สิน จากการกระทำหรือความประมาท ตามเงื่อนไขที่กำหนดในกรมธรรม์',
    sections: [{ heading: 'เอกสารที่ต้องเตรียม', items: [
      'หนังสือเรียกร้องค่าเสียหายจากผู้เอาประกันภัย (แบบฟอร์มของบริษัทประกัน)',
      'รายงานการเกิดเหตุ',
      'ภาพถ่ายความเสียหาย',
      'ใบเสร็จรับเงิน ใบเสนอราคาค่าซ่อม / ค่าอะไหล่',
      'เอกสารอื่นๆ ที่เกี่ยวข้อง (ถ้ามี)'
    ]}],
    insurers: ['bangkok-insurance', 'muang-thai', 'tokyo-marine', 'aig']
  },
  {
    file: 'claims-nonmotor-engineering.html',
    slug: 'engineering',
    title: 'กรมธรรม์ประกันภัยที่ให้ความคุ้มครองเกี่ยวกับงานวิศวกรรม',
    crumb: 'เอกสารเคลมงานวิศวกรรม',
    meta: 'เอกสารเคลมประกันภัยงานวิศวกรรม — กล้าดีโบรคเกอร์',
    intro: 'กรมธรรม์ประกันภัยงานวิศวกรรม คือ ประกันภัยที่คุ้มครองความเสียหายที่อาจเกิดขึ้นระหว่างการก่อสร้าง ติดตั้งเครื่องจักร หรือทดสอบอุปกรณ์ รวมถึงอุบัติเหตุที่เกิดขึ้นตามลักษณะของงาน ตามเงื่อนไขในกรมธรรม์',
    sections: [{ heading: 'เอกสารที่ต้องเตรียม', items: [
      'หนังสือเรียกร้องค่าเสียหายจากผู้เอาประกันภัย (แบบฟอร์มของบริษัทประกัน)',
      'รายงานการเกิดเหตุ',
      'ภาพถ่ายความเสียหาย',
      'ใบเสร็จรับเงิน ใบเสนอราคาค่าซ่อม / ค่าอะไหล่',
      'BOQ',
      'เอกสารอื่นๆ ที่เกี่ยวข้อง (ถ้ามี)'
    ]}],
    insurers: ['bangkok-insurance', 'tokyo-marine', 'aig', 'indara', 'viriyah']
  },
  {
    file: 'claims-nonmotor-transport.html',
    slug: 'transport',
    title: 'กรมธรรม์ประกันภัยการขนส่งสินค้า',
    crumb: 'เอกสารเคลมขนส่งสินค้า',
    meta: 'เอกสารเคลมประกันภัยการขนส่งสินค้า — กล้าดีโบรคเกอร์',
    intro: 'กรมธรรม์ประกันภัยการขนส่งสินค้า คือ การประกันภัยที่ให้ความคุ้มครองความสูญเสียหรือเสียหายสำหรับสินค้าที่เอาประกันภัย ที่เกิดขึ้นจากอุบัติเหตุต่างๆ ในระหว่างการขนส่งทั้งโดยรถบรรทุก ทางเรือ ทางรถไฟ ทางอากาศยาน ตามเงื่อนไขที่กำหนดในกรมธรรม์',
    sections: [
      { heading: 'ความรับผิดของผู้ขนส่ง (Carriers’ Liability)', items: [
        'หนังสือเรียกร้องค่าเสียหายจากเจ้าของสินค้าถึงผู้ขนส่ง',
        'หนังสือเรียกร้องค่าเสียหายจากผู้เอาประกันภัย (แบบฟอร์มของบริษัทประกัน)',
        'เอกสารแสดงราคาสินค้า',
        'สำเนาทะเบียนรถ',
        'สำเนาใบขับขี่',
        'ภาพถ่ายความเสียหาย',
        'ใบเสร็จรับเงิน ใบเสนอราคาค่าซ่อม / ค่าอะไหล่',
        'สำเนาบันทึกประจำวัน (ถ้ามี)',
        'เอกสารอื่นๆ ที่เกี่ยวข้อง (ถ้ามี)'
      ]},
      { heading: 'การขนส่งระหว่างประเทศ (Import/Export), การขนส่งภายในประเทศ (Inland)', items: [
        'หนังสือเรียกร้องค่าเสียหายจากผู้เอาประกันภัย (แบบฟอร์มของบริษัทประกัน)',
        'Bill of Lading / Air Way Bill',
        'Invoice and Packing List',
        'หลักฐานการแสดงความเสียหายของสินค้าจากผู้ขนส่ง / ผู้เกี่ยวข้อง',
        'กรมธรรม์',
        'ภาพถ่ายความเสียหาย',
        'ใบเสนอราคาค่าซ่อม / ค่าอะไหล่',
        'หนังสือเรียกร้องค่าเสียหายถึงผู้ขนส่ง / ผู้เกี่ยวข้อง',
        'เอกสารอื่นๆ ที่เกี่ยวข้อง (ถ้ามี)'
      ]}
    ],
    insurers: ['axa', 'tokyo-marine', 'indara']
  },
  {
    file: 'claims-nonmotor-golf.html',
    slug: 'golf',
    title: 'กรมธรรม์ประกันภัยกอล์ฟ',
    crumb: 'เอกสารเคลมประกันกอล์ฟ',
    meta: 'เอกสารเคลมประกันภัยกอล์ฟ — กล้าดีโบรคเกอร์',
    intro: 'กรมธรรม์ประกันภัยกอล์ฟ คือ ประกันภัยที่ให้ความคุ้มครองต่อความเสียหายหรือความรับผิดที่อาจเกิดขึ้นระหว่างการเล่นกอล์ฟ เช่น ความเสียหายต่อทรัพย์สินของผู้อื่น การบาดเจ็บจากอุบัติเหตุ หรืออุปกรณ์กอล์ฟสูญหาย รวมถึงรางวัล Hole-in-One ตามเงื่อนไขที่กำหนดในกรมธรรม์',
    sections: [
      { heading: 'อุปกรณ์กอล์ฟ', items: [
        'หนังสือเรียกร้องค่าเสียหายจากผู้เอาประกันภัย (แบบฟอร์มของบริษัทประกัน)',
        'รายงานการเกิดอุบัติเหตุหรือความเสียหายที่ออกและรับรองโดยสนามกอล์ฟ',
        'ภาพถ่ายความเสียหายของอุปกรณ์กอล์ฟ',
        'ใบแจ้งหนี้ค่าซ่อมแซมหรือการเปลี่ยนทดแทน'
      ]},
      { heading: 'บุคคลภายนอก', items: [
        'แบบฟอร์มการรับแจ้งความเสียหายที่บันทึกข้อมูลเรียบร้อยแล้ว',
        'รายงานการเกิดอุบัติเหตุหรือความเสียหายที่ออกและรับรองโดยสนามกอล์ฟ',
        'หนังสือเรียกร้องค่าเสียหายของบุคคลที่สามรวมถึงหลักฐานประกอบต่างๆ'
      ]},
      { heading: 'โฮลอินวัน', items: [
        'แบบฟอร์มการรับแจ้งความเสียหายที่บันทึกข้อมูลเรียบร้อยแล้ว',
        'หนังสือรับรองการตี โฮล-อิน-วัน จากสนามกอล์ฟ',
        'หลักฐานอื่น (ถ้ามีการเรียกร้องเพิ่มเติม)'
      ]},
      { heading: 'อุบัติเหตุส่วนบุคคล', items: [
        'แบบฟอร์มการรับแจ้งความเสียหายที่บันทึกข้อมูลเรียบร้อยแล้ว',
        'รายงานการเกิดอุบัติเหตุหรือความเสียหายที่ออกและรับรองโดยสนามกอล์ฟ',
        'ต้นฉบับใบเสร็จค่ารักษาพยาบาล',
        'หลักฐานอื่น (ถ้ามีการเรียกร้องเพิ่มเติม)'
      ]}
    ],
    insurers: ['muang-thai', 'tokyo-marine']
  },
  {
    file: 'claims-nonmotor-health.html',
    slug: 'health',
    title: 'กรมธรรม์ประกันอุบัติเหตุและประกันสุขภาพ',
    crumb: 'เอกสารเคลมสุขภาพ/อุบัติเหตุ',
    meta: 'เอกสารเคลมประกันอุบัติเหตุและสุขภาพ — กล้าดีโบรคเกอร์',
    intro: 'กรมธรรม์อุบัติเหตุและสุขภาพ คือ ประกันภัยที่ให้ความคุ้มครองค่าใช้จ่ายในการรักษาพยาบาล อุบัติเหตุ เจ็บป่วย หรือทุพพลภาพ รวมถึงค่าชดเชยรายได้และผลประโยชน์อื่นๆ ตามเงื่อนไขที่ระบุในกรมธรรม์',
    sections: [
      { heading: 'กรณีแจ้งเคลมค่ารักษาพยาบาล', items: [
        'แบบฟอร์มแจ้งเรียกร้องค่าสินไหม',
        'ใบความเห็นแพทย์ / ใบรับรองแพทย์ หากมีค่าธรรมเนียมผู้เอาประกัน/ ผู้รับผลประโยชน์ เป็นผู้รับผิดชอบ',
        'ต้นฉบับใบเสร็จรับเงิน',
        'สำเนาบัตรประชาชน หรือสำเนาสูติบัตร และรับรองสำเนาถูกต้อง',
        'สำเนาหน้าบัญชีธนาคาร (ของผู้รับผลประโยชน์) พร้อมรับรองสำเนาถูกต้องโดยผู้รับประโยชน์'
      ]},
      { heading: 'กรณีแจ้งเคลมทุพพลภาพ และสูญเสียอวัยวะ', items: [
        'แบบฟอร์มแจ้งเรียกร้องค่าสินไหม',
        'ใบความเห็นแพทย์ เรื่องภาวะทุพพลภาพ ตามแบบฟอร์มของบริษัท (ประทับตราสำเนาถูกต้องจากโรงพยาบาล)',
        'ภาพถ่ายผู้เอาประกัน ณ ปัจจุบัน',
        'ประวัติการรักษาทั้งหมดทุกโรงพยาบาล และเอกสารทางการแพทย์ที่เกี่ยวข้อง ตั้งแต่ครั้งแรกที่รักษา ถึงปัจจุบัน (รับรองสำเนาโดยโรงพยาบาล)',
        'บันทึกประจำวันตำรวจ ณ วันที่เกิดอุบัติเหตุ (รับรองโดยเจ้าพนักงานสืบสวน)',
        'สรุปสำนวนคดี (รับรองโดยเจ้าพนักงานสืบสวน)',
        'สำเนาบัตรประชาชน/สำเนาทะเบียนบ้านผู้เอาประกันภัย รับรองสำเนาถูกต้องโดยผู้เอาประกันภัย',
        'หน้าบัญชีธนาคาร (ของผู้เอาประกันภัย) รับรองสำเนาถูกต้องโดยผู้เอาประกันภัย'
      ]},
      { heading: 'กรณีแจ้งเคลมการเสียชีวิต', items: [
        'แบบฟอร์มแจ้งเรียกร้องค่าสินไหม',
        'มรณบัตร (รับรองสำเนาโดยผู้ออกเอกสาร)',
        'ใบความเห็นแพทย์ (ประทับตราสำเนาถูกต้องจากโรงพยาบาล) หากมีค่าธรรมเนียมผู้เอาประกัน/ผู้รับผลประโยชน์ เป็นผู้รับผิดชอบ',
        'รายงานชันสูตรพลิกศพ พร้อมระบุผลการตรวจแอลกอฮอล์ (รับรองโดยหน่วยงานที่ออกหลักฐาน)',
        'รายงานการผ่าชันสูตรพลิกศพ (ถ้ามี — รับรองโดยหน่วยงานที่ออกหลักฐาน)',
        'ประวัติการรักษาทั้งหมด (ถ้ามี รับรองสำเนาโดยโรงพยาบาล)',
        'บันทึกประจำวันตำรวจ ณ วันที่เกิดอุบัติเหตุ (รับรองโดยเจ้าพนักงานสืบสวน)',
        'สรุปสำนวนคดี (รับรองโดยเจ้าพนักงานสืบสวน)',
        'หนังสือรับรองการตาย (ประทับตราสำเนาถูกต้องจากโรงพยาบาล)',
        'สำเนาบัตรประชาชน/สำเนาทะเบียนบ้านผู้เสียชีวิต (ประทับตาย) รับรองสำเนาถูกต้องโดยผู้รับประโยชน์',
        'สำเนาบัตรประชาชนผู้รับผลประโยชน์/สำเนาทะเบียนบ้านผู้รับผลประโยชน์ รับรองสำเนาถูกต้องโดยผู้รับประโยชน์',
        'หน้าบัญชีธนาคาร (ของผู้รับผลประโยชน์) รับรองสำเนาถูกต้องโดยผู้รับประโยชน์'
      ]},
      { heading: 'กรณีแจ้งเคลมค่าปลงศพ', items: [
        'แบบฟอร์มแจ้งเรียกร้องค่าสินไหม',
        'สำเนาใบมรณบัตร (รับรองสำเนาถูกต้อง)',
        'สำเนาหนังสือรับรองการตาย (รับรองสำเนาถูกต้อง)',
        'สำเนาบัตรประชาชน หรือสำเนาสูติบัตร ผู้รับผลประโยชน์ และรับรองสำเนาถูกต้อง',
        'สำเนาหน้าสมุดบัญชีธนาคารของผู้รับประโยชน์ (รับรองสำเนาถูกต้อง)',
        'เอกสารอื่นๆ หากจำเป็นต้องขอเพิ่มเติม'
      ]},
      { heading: 'กรณีเบิกค่าชดเชย', items: [
        'แบบฟอร์มแจ้งเรียกร้องค่าสินไหม',
        'สำเนาใบรับรองแพทย์ที่ระบุวันที่นอนโรงพยาบาล อาการ และบริเวณที่เป็นอย่างชัดเจน / สำเนาใบรายงานแพทย์ (ใบเคลม)',
        'สำเนาใบเสร็จรับเงิน / สำเนาใบสรุปหน้างบค่ารักษาพยาบาล (รับรองสำเนาถูกต้อง)',
        'สำเนาบัตรประชาชน / บัตรประจำตัวราชการ (รับรองสำเนาถูกต้อง)',
        'สำเนาหน้าสมุดบัญชีธนาคาร (รับรองสำเนาถูกต้อง)'
      ]}
    ],
    insurers: ['viriyah', 'bangkok-insurance', 'thaivivat', 'thanachart', 'dhipaya', 'tokyo-marine', 'navakij', 'muang-thai', 'msig', 'ergo', 'deves', 'chubb', 'axa', 'allianz', 'aig', 'aioi', 'indara']
  },
  {
    file: 'claims-nonmotor-travel.html',
    slug: 'travel',
    title: 'กรมธรรม์ประกันเดินทาง',
    crumb: 'เอกสารเคลมประกันเดินทาง',
    meta: 'เอกสารเคลมประกันการเดินทาง — กล้าดีโบรคเกอร์',
    intro: 'กรมธรรม์ประกันเดินทาง คือ ประกันภัยที่คุ้มครองความเสี่ยงที่อาจเกิดขึ้นระหว่างการเดินทาง เช่น อุบัติเหตุ เจ็บป่วย สูญหายของทรัพย์สิน หรือเหตุฉุกเฉินอื่นๆ ตามขอบเขตความคุ้มครองที่ระบุในกรมธรรม์',
    sections: [
      { heading: 'ค่ารักษาพยาบาล กรณีผู้ป่วยนอก (OPD) หรือผู้ป่วยใน (IPD)', items: [
        'แบบฟอร์มการเรียกร้องค่าสินไหมทดแทนที่บริษัทฯ กำหนด',
        'รายงานการเจ็บป่วยจากแพทย์ หรือ แบบฟอร์มเรียกร้องสินไหมประกันเดินทางต่างประเทศส่วนที่แพทย์ได้กรอกข้อความในส่วนของใบรับรองแพทย์ที่แพทย์ได้กรอกข้อมูลครบถ้วนสมบูรณ์แล้ว',
        'ต้นฉบับใบเสร็จรับเงินค่ารักษาพยาบาล',
        'สำเนาหนังสือเดินทางของผู้เอาประกันภัย',
        'สำเนาหน้าสมุดบัญชี (กรณีให้โอนเงินเข้าบัญชี)',
        'เอกสารอื่นๆ ที่บริษัทฯ ร้องขอตามความจำเป็น'
      ]},
      { heading: 'การล่าช้าของเที่ยวบิน', items: [
        'แบบฟอร์มการเรียกร้องค่าสินไหมทดแทนที่บริษัทฯ กำหนด',
        'สำเนาตั๋วเครื่องบิน และ Boarding Pass',
        'จดหมายแจ้งจากผู้ที่มีอำนาจรับผิดชอบต่อการเดินทางเที่ยวนั้นถึงการล่าช้า',
        'สำเนาหนังสือเดินทางของผู้เอาประกันภัย',
        'สำเนาหน้าสมุดบัญชี (กรณีให้โอนเงินเข้าบัญชี)',
        'เอกสารอื่นๆ ที่บริษัทฯ ร้องขอตามความจำเป็น'
      ]},
      { heading: 'การพลาดการต่อเที่ยวบิน', items: [
        'แบบฟอร์มการเรียกร้องค่าสินไหมทดแทนที่บริษัทฯ กำหนด',
        'หนังสือยืนยันการพลาดการต่อเที่ยวบินและระบุสาเหตุของการพลาดการต่อเที่ยวบินซึ่งออกโดยผู้ขนส่ง',
        'สำเนาตั๋วเครื่องบิน และ Boarding Pass',
        'สำเนาหนังสือเดินทางของผู้เอาประกันภัย',
        'สำเนาหน้าสมุดบัญชี (กรณีให้โอนเงินเข้าบัญชี)',
        'เอกสารอื่นๆ ที่บริษัทฯ ร้องขอตามความจำเป็น'
      ]},
      { heading: 'ความสูญเสียหรือความเสียหายของกระเป๋าเดินทางและ/หรือทรัพย์สินส่วนตัวภายในกระเป๋าเดินทาง', items: [
        'แบบฟอร์มการเรียกร้องค่าสินไหมทดแทนที่บริษัทฯ กำหนด',
        'หนังสือยืนยันความสูญเสียหรือความเสียหาย (Property Irregularity Report) ที่ออกให้โดยผู้ขนส่ง ผู้บริหาร โรงแรม',
        'ใบแจ้งความหรือบันทึกประจำวันของเจ้าหน้าที่ตำรวจในท้องที่ที่เกิดเหตุ (กรณีลักทรัพย์หรือถูกจี้)',
        'ภาพถ่ายความเสียหายของกระเป๋าเดินทาง และ/หรือทรัพย์สินส่วนตัวภายในกระเป๋าเดินทาง',
        'รายละเอียดของกระเป๋าเดินทางที่สูญเสีย หรือเสียหาย อาทิเช่น ยี่ห้อ รุ่นปีที่ผลิต ปีที่ซื้อ และราคา',
        'เอกสารที่ยืนยันการจ่ายเงินค่าตั๋วเครื่องบิน หรือ โรงแรมที่พัก',
        'สำเนาหนังสือเดินทางของผู้เอาประกันภัย',
        'สำเนาหน้าสมุดบัญชี (กรณีให้โอนเงินเข้าบัญชี)',
        'เอกสารอื่นๆ ที่บริษัทฯ ร้องขอตามความจำเป็น'
      ]},
      { heading: 'การล่าช้าของกระเป๋าเดินทาง', items: [
        'แบบฟอร์มการเรียกร้องค่าสินไหมทดแทนที่บริษัทกำหนด',
        'หนังสือยืนยันความสูญเสียหรือความเสียหาย (Property Irregularity Report) ที่ออกให้โดยผู้ขนส่ง',
        'สำเนาตั๋วเครื่องบิน และรายละเอียดเที่ยวบิน',
        'สำเนาหนังสือเดินทางของผู้เอาประกันภัย',
        'สำเนาหน้าสมุดบัญชี (กรณีให้โอนเงินเข้าบัญชี)',
        'เอกสารอื่นๆ ที่บริษัทร้องขอตามความจำเป็น'
      ]},
      { heading: 'การยกเลิกหรือการเลื่อนการเดินทาง', items: [
        'แบบฟอร์มการเรียกร้องค่าสินไหมทดแทนที่บริษัทกำหนด',
        'ใบเสร็จรับเงินจากบริษัททัวร์ หรือสายการบิน ค่าที่พัก อาหาร ซึ่งระบุจำนวนเงินที่เรียกเก็บ',
        'ใบรับรองแพทย์ (กรณีการบาดเจ็บสาหัส หรือการเจ็บป่วยรุนแรงของผู้เอาประกันภัย หรือสมาชิกในครอบครัว)',
        'สำเนาใบมรณบัตร (กรณีการเสียชีวิตของผู้เอาประกันภัย หรือสมาชิกในครอบครัว)',
        'สำเนาหน้าสมุดบัญชี (กรณีให้โอนเงินเข้าบัญชี)',
        'เอกสารอื่นๆ ที่บริษัทร้องขอตามความจำเป็น'
      ]},
      { heading: 'กรณีอื่นๆ', items: [
        'แบบฟอร์มการเรียกร้องค่าสินไหมทดแทนที่บริษัทกำหนด',
        'สำเนาตั๋วเครื่องบิน และ Boarding Pass',
        'สำเนาหนังสือเดินทาง หรือสำเนาบัตรประชาชนของผู้เอาประกันภัย',
        'สำเนาหน้าสมุดบัญชี (กรณีให้โอนเงินเข้าบัญชี)'
      ]}
    ],
    insurers: ['thaivivat', 'bangkok-insurance', 'tokyo-marine', 'muang-thai', 'axa', 'allianz', 'aig', 'viriyah', 'msig']
  }
];

const dlSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>';

function sidebar(activeFile) {
  const items = navItems.map((n) => {
    const active = n.file === activeFile ? ' class="is-active"' : '';
    return `\t\t\t\t\t<li><a href="${n.file}"${active}>${n.label}</a></li>`;
  }).join('\n');
  return `\t\t<aside class="claimMotorSide" aria-label="เมนูเคลม Non-Motor">
\t\t\t<nav class="claimMotorSideNav claimMotorSideNav--nonmotor">
\t\t\t\t<h2 class="claimMotorSideNav__head">เคลม Non-Motor</h2>
\t\t\t\t<ul class="claimMotorSideNav__list">
${items}
\t\t\t\t</ul>
\t\t\t</nav>
\t\t\t<div class="claimMotorSideCta">
\t\t\t\t<h3 class="claimMotorSideCta__title">ติดต่อกล้าดีโบรคเกอร์ได้ทุกวัน</h3>
\t\t\t\t<p class="claimMotorSideCta__desc">สอบถามเอกสารเคลม แบบฟอร์ม หรือให้ช่วยประสานงานกับบริษัทประกัน</p>
\t\t\t\t<div class="claimMotorSideCta__actions">
\t\t\t\t\t<a class="claimMotorSideCta__btn" href="https://line.me/R/ti/p/@kladeebroker" target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>@kladeebroker</a>
\t\t\t\t\t<a class="claimMotorSideCta__btn" href="tel:0826164555"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>082-616-4555</a>
\t\t\t\t\t<a class="claimMotorSideCta__btn" href="claims-nonmotor-phones.html"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>เบอร์เคลม Non-Motor</a>
\t\t\t\t</div>
\t\t\t</div>
\t\t</aside>`;
}

function insurerRows(slug, keys) {
  return keys.map((key) => {
    const p = partners[key];
    return `\t\t\t\t<li class="claimInsFormRow">
\t\t\t\t\t<span class="claimInsFormRow__logo"><img src="images/partners/${p.img}" alt="" width="48" height="48" loading="lazy"></span>
\t\t\t\t\t<span class="claimInsFormRow__name">${p.name}</span>
\t\t\t\t\t<a class="claimFormDownload claimFormDownload--inline" href="downloads/claims/nonmotor-${slug}-${key}.pdf" download>${dlSvg}<span>ดาวน์โหลด</span></a>
\t\t\t\t</li>`;
  }).join('\n');
}

function sectionsHtml(sections) {
  return sections.map((sec, i) => {
    const id = i === 0 ? ' id="nonmotor-docs-detail"' : '';
    const items = sec.items.map((t) => `\t\t\t\t<li>${t}</li>`).join('\n');
    return `\t\t\t<div class="claimMotorCase"${id}>
\t\t\t\t<h2 class="claimMotorCase__title">${sec.heading}</h2>
\t\t\t\t<ul class="claimMotorDocList">
${items}
\t\t\t\t</ul>
\t\t\t</div>`;
  }).join('\n\n');
}

function buildPage(page) {
  return `<!DOCTYPE html>
<html lang="th">
<head>
<title>${page.title} | กล้าดีโบรคเกอร์</title>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="description" content="${page.meta}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" type="text/css" href="css/6723.css?v=${cssVer}">
<link rel="stylesheet" type="text/css" href="css/6720.css?v=${cssVer}">
<link rel="stylesheet" type="text/css" href="css/3802.css?v=${cssVer}">
<link rel="stylesheet" type="text/css" href="css/3803.css?v=${cssVer}">
<link rel="stylesheet" type="text/css" href="css/6714.css?v=${cssVer}">
<link rel="stylesheet" type="text/css" href="css/header-kladee.css?v=${cssVer}">
<link rel="stylesheet" type="text/css" href="css/6918.css?v=${cssVer}">
<link rel="stylesheet" type="text/css" href="css/icons-lucide.css?v=${cssVer}">
<link rel="stylesheet" type="text/css" href="css/pages.css?v=${cssVer}">
</head>
<body class="chrome-pending subpage" data-page="claims">
<ul id="skip_navi">
<li><a href="#content">ข้ามไปยังเนื้อหาหลัก</a></li>
<li><a href="#gnb">ข้ามไปยังเมนูหลัก</a></li>
</ul>
<div id="wrapper">
<div id="site-header-slot"></div>
<div id="container">
<div id="content">

<main class="pageMain">
\t<nav class="pageCrumb" aria-label="breadcrumb">
\t\t<a href="index.html">หน้าแรก</a><span>/</span><a href="claims.html">เคลม</a><span>/</span><span>${page.crumb}</span>
\t</nav>

\t<div class="claimMotorLayout">
${sidebar(page.file)}

\t\t<div class="claimMotorMain">
\t\t\t<nav class="claimMotorJump" aria-label="เมนูภายในหน้า">
\t\t\t\t<a href="#nonmotor-docs-detail" class="claimMotorJump__link is-active">รายละเอียด</a>
\t\t\t\t<a href="#nonmotor-forms" class="claimMotorJump__link">หนังสือเรียกร้องค่าสินไหม</a>
\t\t\t</nav>

\t\t\t<section class="claimMotorPanel" aria-labelledby="nonmotorPageTitle">
\t\t\t\t<h1 class="claimMotorPanel__title" id="nonmotorPageTitle">${page.title}</h1>
\t\t\t\t<p class="claimMotorPanel__intro">${page.intro}</p>

${sectionsHtml(page.sections)}

\t\t\t\t<p class="claimMotorPanel__note">รายการเอกสารอาจแตกต่างตามบริษัทประกัน — หากไม่แน่ใจ ติดต่อทีมงาน <a href="tel:0826164555">082-616-4555</a> · <a href="https://line.me/R/ti/p/@kladeebroker" target="_blank" rel="noopener noreferrer">LINE @kladeebroker</a></p>
\t\t\t</section>

\t\t\t<section class="claimMotorPanel" id="nonmotor-forms" aria-labelledby="nonmotorFormsTitle">
\t\t\t\t<h2 class="claimMotorPanel__title claimMotorPanel__title--section" id="nonmotorFormsTitle">หนังสือเรียกร้องค่าสินไหม</h2>
\t\t\t\t<ul class="claimInsFormList">
${insurerRows(page.slug, page.insurers)}
\t\t\t\t</ul>
\t\t\t</section>
\t\t</div>
\t</div>
</main>

</div>
</div>
<div id="site-footer-slot"></div>

<img src="#" style="width:0px;height:0px;display:none;" alt="สถิติผู้เข้าชม">
</div>
<script type="text/javascript" src="js/3804.js?v=${cssVer}"></script>
<script type="text/javascript" src="js/3805.js?v=${cssVer}"></script>
<script type="text/javascript" src="js/6717.js?v=${cssVer}"></script>
<script type="text/javascript" src="js/6719.js?v=${cssVer}"></script>
<script type="text/javascript" src="js/site-chrome.js?v=${cssVer}"></script>
<script type="text/javascript" src="js/float-mascot.js?v=${cssVer}"></script>
</body>
</html>
`;
}

pages.forEach((page) => {
  fs.writeFileSync(path.join(root, page.file), buildPage(page), 'utf8');
  console.log('Wrote', page.file);
});
