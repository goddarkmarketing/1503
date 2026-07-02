const fs = require('fs');
const path = require('path');

const CACHE = '20260630l';
const OUT = path.join(__dirname, 'plans');

const CAR_IMAGES = [
  'plans/plan-car-01.png',
  'plans/plan-car-02.png',
  'plans/plan-car-03.png',
];

const CATEGORY_IMAGES = {
  car: CAR_IMAGES,
  compulsory: [
    'plans/plan-car-03.png',
    'plans/plan-car-01.png',
    'plans/plan-car-02.png',
  ],
  life: [
    'plans/plan-01-family-tablet.png',
    'plans/plan-10-family-hug.png',
    'plans/plan-07-happy-woman.png',
  ],
  health: [
    'plans/plan-03-spa-wellness.png',
    'plans/plan-05-gym-active.png',
    'plans/plan-09-elderly-care.png',
  ],
  pa: [
    'plans/plan-06-park-exercise.png',
    'plans/plan-05-gym-active.png',
    'plans/plan-02-outdoor-lifestyle.png',
  ],
  home: [
    'plans/plan-10-family-hug.png',
    'plans/plan-01-family-tablet.png',
    'plans/plan-04-pension-reading.png',
  ],
  travel: [
    'plans/plan-02-outdoor-lifestyle.png',
    'plans/plan-06-park-exercise.png',
    'plans/plan-07-happy-woman.png',
  ],
  business: [
    'plans/plan-01-family-tablet.png',
    'plans/plan-05-gym-active.png',
    'plans/plan-07-happy-woman.png',
  ],
  critical: [
    'plans/plan-03-spa-wellness.png',
    'plans/plan-09-elderly-care.png',
    'plans/plan-08-senior-park.png',
  ],
  education: [
    'plans/plan-01-family-tablet.png',
    'plans/plan-10-family-hug.png',
    'plans/plan-04-pension-reading.png',
  ],
  pension: [
    'plans/plan-04-pension-reading.png',
    'plans/plan-08-senior-park.png',
    'plans/plan-10-family-hug.png',
  ],
  cargo: CAR_IMAGES,
  group: [
    'plans/plan-05-gym-active.png',
    'plans/plan-06-park-exercise.png',
    'plans/plan-09-elderly-care.png',
  ],
};

function getCategoryPartClass(slug) {
  if (['car', 'compulsory'].includes(slug)) return 'part1';
  if (['life', 'health', 'pa', 'critical'].includes(slug)) return 'part2';
  return 'part3';
}

const categories = [
  {
    slug: 'car',
    file: 'car.html',
    title: 'ประกันรถยนต์',
    badge: 'ภาคสมัครใจ',
    desc: 'เปรียบเทียบแผนประกันรถยนต์ชั้น 1 / 2+ / 2 / 3+ จากบริษัทประกันชั้นนำ คุ้มครองรถ คนขับ และบุคคลที่สาม — ปรึกษาฟรีกับที่ปรึกษากล้าดีโบรคเกอร์',
    intro: 'เราช่วยคัดแผนที่เหมาะกับการใช้งาน อายุรถ และงบประมาณของคุณ ไม่ว่าจะเป็นรถใหม่ รถมือสอง หรือรถใช้งาน',
    benefits: [
      { title: 'เปรียบเทียบหลายบริษัท', text: 'ดูเบี้ยและความคุ้มครองจากหลายบริษัทในที่เดียว' },
      { title: 'ช่วยเรื่องเคลม', text: 'ทีมงานช่วยประสานงานเคลมให้ราบรื่น' },
      { title: 'ต่ออายุไม่พลาด', text: 'แจ้งเตือนก่อนกรมธรรม์หมดอายุ' },
    ],
    plans: [
      { name: 'ประกันรถยนต์ชั้น 1', txt: 'คุ้มครองรอบคัน ชน-หาย-ไฟไหม้ ซ่อมห้างอุ่นใจ', price: 'เริ่ม ~12,500 บ./ปี' },
      { name: 'ประกันรถยนต์ชั้น 2', txt: 'คุ้มครองรถและคู่กรณี ยอดนิยม', price: 'เริ่ม ~10,200 บ./ปี' },
      { name: 'ประกันรถยนต์ 2+ / 3+', txt: 'เบี้ยเบา คุ้มค่า คุ้มครองคู่กรณีครบ', price: 'เริ่ม ~8,900 บ./ปี' },
      { name: 'พ.ร.บ. รถยนต์', txt: 'ต่อง่าย ราคามาตรฐาน คุ้มครองตามกฎหมาย', price: '~645 บ./ปี' },
    ],
  },
  {
    slug: 'life',
    file: 'life.html',
    title: 'ประกันชีวิต',
    badge: 'วางแผนระยะยาว',
    desc: 'แผนประกันชีวิตและสะสมทรัพย์ วางแผนความมั่นคงให้ครอบครัว รองรับทั้งความคุ้มครองและการออม',
    intro: 'เลือกแผนที่สอดคล้องเป้าหมายชีวิต ไม่ว่าจะเป็นการคุ้มครองครอบครัว การออม หรือการวางแผนภาษี',
    benefits: [
      { title: 'วิเคราะห์ความต้องการ', text: 'ประเมินความจำเป็นและงบประมาณก่อนเสนอแผน' },
      { title: 'หลายรูปแบบแผน', text: 'Term Whole Life Unit Linked สะสมทรัพย์' },
      { title: 'ดูแลต่อเนื่อง', text: 'ช่วยตรวจสอบและปรับแผนเมื่อสถานการณ์เปลี่ยน' },
    ],
    plans: [
      { co: 'บริษัท A', name: 'Family Protect 20 ปี', txt: 'คุ้มครองชีวิต วงเงินสูง ราคาเบี้ยคงที่', price: 'เริ่ม ~350 บ./เดือน' },
      { co: 'บริษัท B', name: 'Life Saver Plus', txt: 'คุ้มครองชีวิต + ผลประโยชน์ครบวงจร', price: 'เริ่ม ~520 บ./เดือน' },
      { co: 'บริษัท C', name: 'Wealth Plan', txt: 'ออมและคุ้มครองชีวิตในแผนเดียว', price: 'เริ่ม ~2,000 บ./เดือน' },
    ],
  },
  {
    slug: 'health',
    file: 'health.html',
    title: 'ประกันสุขภาพ',
    badge: 'IPD / OPD',
    desc: 'ประกันสุขภาพคุ้มครองค่ารักษาพยาบาล ทั้งผู้ป่วยในและผู้ป่วยนอก เลือกวงเงินและโรงพยาบาลที่เหมาะกับคุณ',
    intro: 'เปรียบเทียบแผนที่ครอบคลุมค่าห้อง ค่าผ่าตัด ค่ายา และค่าตรวจ OPD จากหลายบริษัท',
    benefits: [
      { title: 'เลือกวงเงินได้', text: 'ตั้งแต่แผนเริ่มต้นถึงแผน Premium' },
      { title: 'เครือข่ายโรงพยาบาล', text: 'ใช้สิทธิ์ได้กับโรงพยาบาลในเครือ' },
      { title: 'ปรึกษาฟรี', text: 'ช่วยอ่านเงื่อนไขและข้อยกเว้นให้เข้าใจ' },
    ],
    plans: [
      { co: 'บริษัท A', name: 'Health Care 5 ล้าน', txt: 'คุ้มครอง IPD วงเงิน 5 ล้าน/ปี', price: 'เริ่ม ~680 บ./เดือน' },
      { co: 'บริษัท B', name: 'OPD Plus', txt: 'คุ้มครอง IPD + OPD ครบจบ', price: 'เริ่ม ~950 บ./เดือน' },
      { co: 'บริษัท C', name: 'Senior Health', txt: 'เหมาะวัย 50+ คุ้มครองโรคเรื้อรัง', price: 'เริ่ม ~1,200 บ./เดือน' },
    ],
  },
  {
    slug: 'pa',
    file: 'pa.html',
    title: 'ประกันอุบัติเหตุ (PA)',
    badge: 'Personal Accident',
    desc: 'คุ้มครองอุบัติเหตุ ทุกที่ทุกเวลา รวมค่ารักษา ทุพพลภาพ และเสียชีวิตจากอุบัติเหตุ',
    intro: 'เหมาะสำหรับพนักงาน ฟรีแลนซ์ และผู้ที่ต้องการความคุ้มครองเสริมในราคาไม่สูง',
    benefits: [
      { title: 'เบี้ยไม่แพง', text: 'ความคุ้มครองสูงเมื่อเทียบกับเบี้ยที่จ่าย' },
      { title: 'ครอบคลุม 24 ชม.', text: 'คุ้มครองทั้งในที่ทำงานและนอกที่ทำงาน' },
      { title: 'ซื้อเสริมได้', text: 'จับคู่กับประกันสุขภาพหรือชีวิตได้' },
    ],
    plans: [
      { co: 'บริษัท A', name: 'PA Basic 500K', txt: 'ทุนประกัน 500,000 บาท ค่ารักษา 50,000', price: 'เริ่ม ~890 บ./ปี' },
      { co: 'บริษัท B', name: 'PA Family', txt: 'คุ้มครองครอบครัว สูงสุด 4 คน', price: 'เริ่ม ~2,400 บ./ปี' },
      { co: 'บริษัท C', name: 'PA Pro 1M', txt: 'ทุนสูง เหมาะอาชีพเสี่ยง', price: 'เริ่ม ~1,800 บ./ปี' },
    ],
  },
  {
    slug: 'home',
    file: 'home.html',
    title: 'ประกันบ้าน/ทรัพย์สิน',
    badge: 'Home & Property',
    desc: 'คุ้มครองบ้าน คอนโด และทรัพย์สินภายในบ้านจากไฟไหม้ น้ำท่วม โจรกรรม และภัยธรรมชาติ',
    intro: 'ปกป้องสิ่งที่คุณลงทุนและของใช้ในบ้าน ด้วยแผนที่ปรับวงเงินได้ตามมูลค่าทรัพย์สิน',
    benefits: [
      { title: 'คุ้มครองโครงสร้าง', text: 'บ้าน คอนโด อาคารพาณิชย์' },
      { title: 'ของใช้ในบ้าน', text: 'เครื่องใช้ไฟฟ้า เฟอร์นิเจอร์ ของมีค่า' },
      { title: 'ความรับผิดชอบ', text: 'คุ้มครองบุคคลที่สามจากอุบัติเหตุในบ้าน' },
    ],
    plans: [
      { co: 'บริษัท A', name: 'Home Shield', txt: 'คุ้มครองโครงสร้าง + ของใช้ 3 ล้าน', price: 'เริ่ม ~3,500 บ./ปี' },
      { co: 'บริษัท B', name: 'Condo Care', txt: 'เหมาะคอนโด คุ้มครองภายในและโครงสร้าง', price: 'เริ่ม ~2,800 บ./ปี' },
      { co: 'บริษัท C', name: 'Flood Plus', txt: 'เสริมความคุ้มครองน้ำท่วม', price: 'เริ่ม ~4,200 บ./ปี' },
    ],
  },
  {
    slug: 'travel',
    file: 'travel.html',
    title: 'ประกันการเดินทาง',
    badge: 'Travel Insurance',
    desc: 'ประกันเดินทางในประเทศและต่างประเทศ คุ้มครองการล่าช้า กระเป๋าหาย ค่ารักษา และอุบัติเหตุ',
    intro: 'เลือกแผนตามจำนวนวันเดินทางและปลายทาง ออกกรมธรรม์ได้รวดเร็วก่อนเดินทาง',
    benefits: [
      { title: 'ออกกรมธรรม์เร็ว', text: 'พร้อมเดินทางภายในไม่กี่นาที' },
      { title: 'ครอบคลุม Schengen', text: 'แผนที่ผ่านเงื่อนไขวีซ่ายุโรป' },
      { title: 'Hotline 24 ชม.', text: 'ช่วยเหลือฉุกเฉินขณะเดินทาง' },
    ],
    plans: [
      { co: 'บริษัท A', name: 'Asia Trip 7 วัน', txt: 'เดินทางเอเชีย คุ้มครองครบ', price: 'เริ่ม ~350 บ./เที่ยว' },
      { co: 'บริษัท B', name: 'World Wide 30 วัน', txt: 'ทั่วโลก วงเงินสูง', price: 'เริ่ม ~1,890 บ./เที่ยว' },
      { co: 'บริษัท C', name: 'Domestic Easy', txt: 'เที่ยวในประเทศ ราคาประหยัด', price: 'เริ่ม ~120 บ./เที่ยว' },
    ],
  },
  {
    slug: 'business',
    file: 'business.html',
    title: 'ประกันธุรกิจ / SME',
    badge: 'SME & Business',
    desc: 'ประกันสำหรับร้านค้า สำนักงาน และ SME คุ้มครองทรัพย์สิน ความรับผิดชอบ และการหยุดชะงักของธุรกิจ',
    intro: 'ออกแบบความคุ้มครองให้เหมาะกับขนาดและลักษณะธุรกิจของคุณ',
    benefits: [
      { title: 'ปรับแต่งได้', text: 'เลือกความคุ้มครองตามประเภทธุรกิจ' },
      { title: 'ความรับผิด', text: 'คุ้มครองลูกค้าและบุคคลที่สาม' },
      { title: 'ที่ปรึกษามืออาชีพ', text: 'ช่วยประเมินความเสี่ยงของธุรกิจ' },
    ],
    plans: [
      { co: 'บริษัท A', name: 'Shop Protect', txt: 'เหมาะร้านค้าและร้านอาหาร', price: 'เริ่ม ~6,500 บ./ปี' },
      { co: 'บริษัท B', name: 'Office Pack', txt: 'สำนักงาน SME ครบวงจร', price: 'เริ่ม ~9,800 บ./ปี' },
      { co: 'บริษัท C', name: 'Liability Plus', txt: 'เน้นความรับผิดต่อบุคคลที่สาม', price: 'เริ่ม ~4,500 บ./ปี' },
    ],
  },
  {
    slug: 'critical',
    file: 'critical.html',
    title: 'ประกันโรคร้ายแรง',
    badge: 'Critical Illness',
    desc: 'จ่ายเงินก้อนเมื่อวินิจฉัยโรคร้ายแรง ช่วยให้มีเงินสำรองรักษาและดูแลครอบครัว',
    intro: 'ครอบคลุมมะเร็ง โรคหัวใจ ไตวาย และโรคร้ายแรงอื่นๆ ตามเงื่อนไขกรมธรรม์',
    benefits: [
      { title: 'เงินก้อนล่วงหน้า', text: 'ใช้จ่ายได้อิสระเมื่อได้รับการวินิจฉัย' },
      { title: 'เสริมสุขภาพ', text: 'จับคู่กับประกันสุขภาพได้' },
      { title: 'หลายระดับความคุ้มครอง', text: 'เลือกจำนวนโรคและวงเงินได้' },
    ],
    plans: [
      { co: 'บริษัท A', name: 'CI 25 โรค', txt: 'คุ้มครอง 25 โรคร้ายแรง ทุน 1 ล้าน', price: 'เริ่ม ~450 บ./เดือน' },
      { co: 'บริษัท B', name: 'Cancer Care', txt: 'เน้นคุ้มครองมะเร็งทุกระยะ', price: 'เริ่ม ~380 บ./เดือน' },
      { co: 'บริษัท C', name: 'CI Premium 40', txt: 'ครอบคลุม 40 โรค วงเงินสูง', price: 'เริ่ม ~720 บ./เดือน' },
    ],
  },
  {
    slug: 'education',
    file: 'education.html',
    title: 'ประกันเพื่อการศึกษาบุตร',
    badge: 'Education Plan',
    desc: 'วางแผนอนาคตการศึกษาบุตรด้วยแผนประกันและออม สร้างเงินกองทุนการศึกษาเมื่อบุตรเข้าเรียน',
    intro: 'เหมาะสำหรับพ่อแม่ที่ต้องการความมั่นใจว่าบุตรจะมีทุนการศึกษาในอนาคต',
    benefits: [
      { title: 'ออมสม่ำเสมอ', text: 'สร้างวินัยการออมระยะยาว' },
      { title: 'คุ้มครองชีวิต', text: 'ครอบครัวยังได้รับผลประโยชน์หากเกิดเหตุไม่คาดฝัน' },
      { title: 'รับเงินตามช่วงอายุ', text: 'จ่ายเมื่อบุตรเข้าเรียนระดับที่กำหนด' },
    ],
    plans: [
      { co: 'บริษัท A', name: 'Edu Fund 18', txt: 'รับเงินเมื่อบุตรอายุ 18 ปี', price: 'เริ่ม ~1,500 บ./เดือน' },
      { co: 'บริษัท B', name: 'Smart Kid', txt: 'ออม + คุ้มครองชีวิตผู้ปกครอง', price: 'เริ่ม ~2,200 บ./เดือน' },
      { co: 'บริษัท C', name: 'Graduate Plan', txt: 'เงินก้อนเมื่อจบการศึกษา', price: 'เริ่ม ~3,000 บ./เดือน' },
    ],
  },
  {
    slug: 'pension',
    file: 'pension.html',
    title: 'ประกันบำนาญ',
    badge: 'Retirement',
    desc: 'วางแผนเกษียณและรับเงินบำนาญรายปี สร้างรายได้หลังเกษียณอย่างมั่นคง',
    intro: 'เลือกอายุรับเงินและระยะเวลาจ่ายเบี้ยให้เหมาะกับเป้าหมายเกษียณของคุณ',
    benefits: [
      { title: 'รายได้ประจำ', text: 'รับเงินบำนาญตามที่กำหนด' },
      { title: 'ลดหย่อนภาษี', text: 'เบี้ยประกันบางแผนลดหย่อนได้' },
      { title: 'วางแผนระยะยาว', text: 'ที่ปรึกษาช่วยคำนวณเป้าหมายเกษียณ' },
    ],
    plans: [
      { co: 'บริษัท A', name: 'Retire 60', txt: 'เริ่มรับเงินเมื่ออายุ 60 ปี', price: 'เริ่ม ~3,500 บ./เดือน' },
      { co: 'บริษัท B', name: 'Annuity Plus', txt: 'รับบำนาญตลอดชีพ', price: 'เริ่ม ~5,000 บ./เดือน' },
      { co: 'บริษัท C', name: 'Flex Pension', txt: 'เลือกอายุและระยะเวลาจ่ายได้', price: 'เริ่ม ~2,800 บ./เดือน' },
    ],
  },
  {
    slug: 'compulsory',
    file: 'compulsory.html',
    title: 'พ.ร.บ. รถยนต์',
    badge: 'Compulsory Motor',
    desc: 'ประกันภาคบังคับ (พ.ร.บ.) ตามกฎหมาย คุ้มครองผู้ประสบภัยจากรถ ออกกรมธรรม์ได้รวดเร็ว',
    intro: 'จำเป็นสำหรับรถทุกคันที่จดทะเบียน เราช่วยออก พ.ร.บ. คู่กับประกันภาคสมัครใจได้ในครั้งเดียว',
    benefits: [
      { title: 'ถูกกฎหมาย', text: 'ครบตาม พ.ร.บ. ว่าด้วยคุ้มครองผู้ประสบภัย' },
      { title: 'ออกเร็ว', text: 'ได้กรมธรรม์ภายในไม่กี่นาที' },
      { title: 'จับคู่ภาคสมัครใจ', text: 'รวมเบี้ยและความคุ้มครองในที่เดียว' },
    ],
    plans: [
      { co: 'บริษัท A', name: 'พ.ร.บ. รถเก๋ง', txt: 'รถส่วนบุคคลไม่เกิน 7 ที่นั่ง', price: '~645 บ./ปี' },
      { co: 'บริษัท B', name: 'พ.ร.บ. รถกระบะ', txt: 'รถบรรทุกส่วนบุคคล', price: '~967 บ./ปี' },
      { co: 'บริษัท C', name: 'พ.ร.บ. + ภาคสมัครใจ', txt: 'แพ็กเกจรวมคุ้มครองครบ', price: 'สอบถามเบี้ย' },
    ],
  },
  {
    slug: 'cargo',
    file: 'cargo.html',
    title: 'ประกันขนส่งสินค้า',
    badge: 'Cargo & Transit',
    desc: 'คุ้มครองสินค้าระหว่างขนส่ง ทั้งทางบก ทางเรือ และทางอากาศ สำหรับผู้ประกอบการและโลจิสติกส์',
    intro: 'ลดความเสี่ยงจากสินค้าเสียหาย สูญหาย หรือล่าช้าระหว่างการขนส่ง',
    benefits: [
      { title: 'ครอบคลุมหลายเส้นทาง', text: 'ในประเทศและระหว่างประเทศ' },
      { title: 'ปรับตามมูลค่าสินค้า', text: 'กำหนดทุนประกันตามใบขนส่ง' },
      { title: 'ช่วยเคลม', text: 'ประสานงานเมื่อเกิดความเสียหาย' },
    ],
    plans: [
      { co: 'บริษัท A', name: 'Inland Cargo', txt: 'ขนส่งภายในประเทศ', price: 'ตามมูลค่าสินค้า' },
      { co: 'บริษัท B', name: 'Marine Cargo', txt: 'ขนส่งทางเรือ', price: 'ตามมูลค่าสินค้า' },
      { co: 'บริษัท C', name: 'All Risk Transit', txt: 'คุ้มครองครบระหว่างขนส่ง', price: 'ตามมูลค่าสินค้า' },
    ],
  },
  {
    slug: 'group',
    file: 'group.html',
    title: 'ประกันกลุ่มพนักงาน',
    badge: 'Group Employee',
    desc: 'สวัสดิการประกันกลุ่มสำหรับพนักงาน ครอบคลุมชีวิต สุขภาพ และอุบัติเหตุ ในราคาเหมาะสม',
    intro: 'เหมาะสำหรับ SME และองค์กรที่ต้องการดูแลพนักงานและลดภาระค่ารักษา',
    benefits: [
      { title: 'เบี้ยรายกลุ่ม', text: 'ต่อรองเบี้ยตามจำนวนพนักงาน' },
      { title: 'ปรับแผนได้', text: 'เลือกความคุ้มครองตามงบสวัสดิการ' },
      { title: 'บริหารง่าย', text: 'ช่วยจัดทำเอกสารและต่ออายุกลุ่ม' },
    ],
    plans: [
      { co: 'บริษัท A', name: 'Group Health 50+', txt: 'สุขภาพพนักงาน 50 คนขึ้นไป', price: 'สอบถามเบี้ย' },
      { co: 'บริษัท B', name: 'Group Life PA', txt: 'ชีวิต + อุบัติเหตุ รายกลุ่ม', price: 'สอบถามเบี้ย' },
      { co: 'บริษัท C', name: 'SME Welfare Pack', txt: 'แพ็กสวัสดิการ SME', price: 'สอบถามเบี้ย' },
    ],
  },
];

const DEFAULT_STEPS = [
  { title: 'ปรึกษาฟรี', text: 'บอกความต้องการ งบประมาณ และข้อมูลเบื้องต้น' },
  { title: 'เปรียบเทียบแผน', text: 'เราเสนอแผนจากหลายบริษัทที่เหมาะกับคุณ' },
  { title: 'ออกกรมธรรม์', text: 'ช่วยเตรียมเอกสารและทำรายการให้ครบถ้วน' },
  { title: 'ดูแลหลังขาย', text: 'เตือนต่ออายุ ช่วยเคลม และตอบคำถามตลอดอายุกรมธรรม์' },
];

const planDetails = {
  car: {
    audience: ['เจ้าของรถใหม่และรถมือสองที่ต้องการคุ้มครองรอบคัน', 'ผู้ใช้รถประจำทุกวันที่ต้องการซ่อมห้างหรือเบี้ยประหยัด', 'ผู้ที่ต้องการจับคู่ พ.ร.บ. กับภาคสมัครใจในที่เดียว'],
    coverage: {
      headers: ['ความคุ้มครอง', 'ชั้น 1', '2+ / 3+', 'พ.ร.บ.'],
      rows: [
        ['รถเสียหายจากอุบัติเหตุ', '✓', '✓', '—'],
        ['ไฟไหม้ / น้ำท่วม / ลูกเห็บ', '✓', 'ตามแผน', '—'],
        ['รถสูญหาย', '✓', '—', '—'],
        ['คู่กรณี (บุคคลที่สาม)', '✓', '✓', '✓'],
        ['คนขับและผู้โดยสาร', 'ตามแผน', 'ตามแผน', 'จำกัด'],
        ['ซ่อมห้าง / อู่', '✓', 'ตามแผน', '—'],
      ],
    },
    conditions: [
      { label: 'อายุรถ', text: 'รับรถใหม่ถึงมือสอง ขึ้นกับบริษัทและชั้นประกัน' },
      { label: 'ทุนประกัน', text: 'กำหนดตามราคาตลาดหรือทุนจริงของรถ' },
      { label: 'ค่าเสียหายส่วนแรก', text: 'บางแผนมี Deductible ตามเงื่อนไขกรมธรรม์' },
      { label: 'เอกสาร', text: 'เล่มทะเบียนรถ ใบขับขี่ และรูปรถ (กรณีที่กำหนด)' },
    ],
    faq: [
      { q: 'รถมือสองทำประกันชั้น 1 ได้ไหม?', a: 'ได้ ขึ้นกับอายุรถ สภาพรถ และนโยบายของแต่ละบริษัท เราช่วยเปรียบเทียบให้' },
      { q: 'พ.ร.บ. กับภาคสมัครใจต่างกันอย่างไร?', a: 'พ.ร.บ. เป็นภาคบังคับคุ้มครองผู้ประสบภัยตามกฎหมาย ภาคสมัครใจเสริมความคุ้มครองรถและคู่กรณีเพิ่มเติม' },
      { q: 'เปลี่ยนบริษัทตอนต่ออายุได้ไหม?', a: 'ได้ เราช่วยเปรียบเทียบเบี้ยและความคุ้มครองก่อนต่ออายุทุกครั้ง' },
      { q: 'แจ้งเคลมต้องทำอย่างไร?', a: 'โทรแจ้งบริษัทประกันหรือติดต่อทีมกล้าดีโบรคเกอร์เพื่อประสานงานและแนะนำเอกสาร' },
    ],
  },
  compulsory: {
    audience: ['เจ้าของรถทุกประเภทที่จดทะเบียน', 'ผู้ที่ต้องการต่อ พ.ร.บ. ก่อนหมดอายุ', 'ผู้ที่ต้องการจับคู่กับประกันภาคสมัครใจ'],
    coverage: {
      headers: ['ผลประโยชน์', 'วงเงินคุ้มครอง (โดยสรุป)'],
      rows: [
        ['ค่ารักษาพยาบาลผู้บาดเจ็บ', 'ตาม พ.ร.บ.'],
        ['ทุพพลภาพถาวร', 'ตาม พ.ร.บ.'],
        ['เสียชีวิต', 'ตาม พ.ร.บ.'],
        ['รถของผู้เอาประกัน', 'ไม่คุ้มครอง'],
      ],
    },
    conditions: [
      { label: 'บังคับใช้', text: 'รถทุกคันที่จดทะเบียนต้องมี พ.ร.บ. ที่ยังไม่หมดอายุ' },
      { label: 'ระยะเวลา', text: 'อายุกรมธรรม์ 1 ปี นับจากวันเริ่มคุ้มครอง' },
      { label: 'เบี้ยประกัน', text: 'กำหนดตามประเภทรถและขนาดเครื่องยนต์ (CC)' },
      { label: 'เอกสาร', text: 'เล่มทะเบียนรถและบัตรประชาชนเจ้าของรถ' },
    ],
    faq: [
      { q: 'ไม่ทำ พ.ร.บ. มีโทษอย่างไร?', a: 'อาจถูกปรับตามกฎหมายและไม่สามารถต่อทะเบียนรถได้' },
      { q: 'พ.ร.บ. คุ้มครองรถเราไหม?', a: 'ไม่คุ้มครองความเสียหายของรถคุณ คุ้มครองผู้ประสบภัยจากรถเป็นหลัก' },
      { q: 'ทำ พ.ร.บ. ซ้ำได้ไหมถ้าหมดอายุ?', a: 'ได้ แต่ช่วงที่ไม่มีกรมธรรม์จะไม่ได้รับความคุ้มครอง' },
    ],
  },
  life: {
    audience: ['หัวหน้าครอบครัวที่ต้องการสร้างความมั่นคง', 'ผู้ที่ต้องการวางแผนภาษีและมรดก', 'ผู้ที่ต้องการออมและคุ้มครองชีวิตในแผนเดียว'],
    coverage: {
      type: 'list',
      items: [
        { title: 'Term Life', text: 'คุ้มครองชีวิตระยะเวลากำหนด เบี้ยต่ำทุนสูง' },
        { title: 'Whole Life', text: 'คุ้มครองตลอดชีพ มีมูลค่าเงินคืนตามแผน' },
        { title: 'Endowment', text: 'คุ้มครองชีวิต + รับเงินก้อนเมื่อครบสัญญา' },
        { title: 'Unit Linked', text: 'ลงทุนและคุ้มครองชีวิตผสมผสาน' },
      ],
    },
    conditions: [
      { label: 'อายุรับประกัน', text: 'โดยทั่วไป 18–65 ปี ขึ้นกับแผนและบริษัท' },
      { label: 'การตรวจสุขภาพ', text: 'อาจต้องตรวจตามทุนประกันและอายุ' },
      { label: 'ระยะเวลา', text: 'เลือกได้ตั้งแต่ 10 ปี ถึงตลอดชีพ' },
      { label: 'ผู้รับผลประโยชน์', text: 'กำหนดได้ตามต้องการ' },
    ],
    faq: [
      { q: 'มีโรคประจำตัวทำได้ไหม?', a: 'ขึ้นกับแผนและบริษัท เราช่วยหาแผนที่รับได้หรือปรับทุนให้เหมาะสม' },
      { q: 'ยกเลิกกลางคันได้ไหม?', a: 'ได้ แต่อาจได้เงินคืนน้อยหรือไม่ได้เลย ขึ้นกับประเภทแผน' },
      { q: 'ลดหย่อนภาษีได้ไหม?', a: 'บางแผนลดหย่อนได้ตามเงื่อนไขสรรพากร ควรปรึกษาก่อนตัดสินใจ' },
    ],
  },
  health: {
    audience: ['พนักงานและฟรีแลนซ์ที่ต้องการคุ้มครองค่ารักษา', 'ผู้สูงอายุที่ต้องการวงเงินสูง', 'ผู้ที่ต้องการ OPD และ IPD ในแผนเดียว'],
    coverage: {
      headers: ['ความคุ้มครอง', 'แผนเริ่มต้น', 'แผนมาตรฐาน', 'แผน Premium'],
      rows: [
        ['ผู้ป่วยใน (IPD)', '✓', '✓', '✓'],
        ['ผู้ป่วยนอก (OPD)', '—', '✓', '✓'],
        ['ค่าห้อง / ค่าผ่าตัด', 'จำกัด', '✓', '✓'],
        ['เครือข่ายโรงพยาบาล', '✓', '✓', '✓'],
        ['โรคเรื้อรัง', 'ตามแผน', 'ตามแผน', '✓'],
      ],
    },
    conditions: [
      { label: 'Waiting period', text: 'โรคบางประการรอคุ้มครอง 30–120 วัน' },
      { label: 'โรคเดิม', text: 'ต้องแจ้งตามจริง อาจมีข้อยกเว้นหรือเพิ่มเบี้ย' },
      { label: 'วงเงิน', text: 'เลือกได้ตั้งแต่หลักแสน ถึงหลักสิบล้านต่อปี' },
      { label: 'อายุ', text: 'รับตั้งแต่ทารก ถึงวัยเกษียณ (ขึ้นกับแผน)' },
    ],
    faq: [
      { q: 'ใช้กับโรงพยาบาลไหนได้บ้าง?', a: 'ขึ้นกับเครือข่ายของแต่ละบริษัท เราช่วยเลือกแผนที่มีโรงพยาบาลใกล้คุณ' },
      { q: 'ต้องสำรองจ่ายก่อนไหม?', a: 'โรงพยาบาลในเครือมักเบิกตรงได้ นอกเครืออาจต้องสำรองจ่ายแล้วเคลม' },
      { q: 'ต่ออายุแล้วเคลมเดิมได้ไหม?', a: 'โดยทั่วไปเคลมต่อเนื่องได้ แต่ต้องดูเงื่อนไขโรคเรื้อรังของแต่ละบริษัท' },
    ],
  },
  pa: {
    audience: ['พนักงานและฟรีแลนซ์ที่ต้องการความคุ้มครองเสริม', 'ผู้ที่เดินทางหรือทำงานนอกสถานที่บ่อย', 'ครอบครัวที่ต้องการคุ้มครองหลายคนในเบี้ยเดียว'],
    coverage: {
      headers: ['ผลประโยชน์', 'Basic', 'Family', 'Pro'],
      rows: [
        ['เสียชีวิตจากอุบัติเหตุ', '✓', '✓', '✓'],
        ['ทุพพลภาพถาวร', '✓', '✓', '✓'],
        ['ค่ารักษาพยาบาล', '✓', '✓', '✓'],
        ['ค่าชดเชยรายวัน', '—', 'ตามแผน', '✓'],
        ['คุ้มครอง 24 ชม.', '✓', '✓', '✓'],
      ],
    },
    conditions: [
      { label: 'ขอบเขต', text: 'คุ้มครองอุบัติเหตุ ไม่รวมโรค' },
      { label: 'อาชีพเสี่ยง', text: 'บางอาชีพอาจต้องแผนพิเศษหรือเพิ่มเบี้ย' },
      { label: 'กีฬาเสี่ยง', text: 'กิจกรรมบางประเภทอาจอยู่นอกความคุ้มครอง' },
      { label: 'อายุ', text: 'โดยทั่วไป 1–70 ปี ขึ้นกับแผน' },
    ],
    faq: [
      { q: 'PA ต่างจากประกันสุขภาพอย่างไร?', a: 'PA คุ้มครองเฉพาะอุบัติเหตุ สุขภาพคุ้มครองการเจ็บป่วยและการรักษาทั่วไป' },
      { q: 'ซ้อนกับประกันอื่นได้ไหม?', a: 'ได้ มักซื้อเสริมคู่กับสุขภาพหรือชีวิตเพื่อเพิ่มวงเงิน' },
      { q: 'อุบัติเหตุจากมอเตอร์ไซค์คุ้มครองไหม?', a: 'ขึ้นกับเงื่อนไขแผน ต้องตรวจสอบข้อยกเว้นก่อนทำประกัน' },
    ],
  },
  home: {
    audience: ['เจ้าของบ้านและคอนโด', 'ผู้ให้เช่าที่ต้องการคุ้มครองทรัพย์สิน', 'ร้านค้าหรือ SME ในพื้นที่เชิงพาณิชย์'],
    coverage: {
      type: 'list',
      items: [
        { title: 'โครงสร้างอาคาร', text: 'บ้าน คอนโด ตัวอาคารจากไฟไหม้ ภัยธรรมชาติ' },
        { title: 'ทรัพย์สินภายใน', text: 'เฟอร์นิเจอร์ เครื่องใช้ไฟฟ้า ของมีค่า' },
        { title: 'โจรกรรม', text: 'ทรัพย์สินถูกขโมยตามเงื่อนไข' },
        { title: 'ความรับผิดต่อบุคคลที่สาม', text: 'อุบัติเหตุในบ้านที่กระทบเพื่อนบ้าน' },
      ],
    },
    conditions: [
      { label: 'ทุนประกัน', text: 'กำหนดตามมูลค่าสิ่งปลูกสร้างและทรัพย์สิน' },
      { label: 'น้ำท่วม', text: 'บางแผนต้องซื้อเสริมหรือมีข้อจำกัดพื้นที่' },
      { label: 'ที่อยู่อาศัย', text: 'แยกแผนบ้านอยู่อาศัยกับให้เช่า' },
      { label: 'เอกสาร', text: 'โฉนด/หนังสือกรรมสิทธิ์ รูปทรัพย์สิน และรายการของมีค่า' },
    ],
    faq: [
      { q: 'คอนโดทำประกันได้ไหม?', a: 'ได้ ทั้งโครงสร้างส่วนตัวและเฟอร์นิเจอร์ภายในห้อง' },
      { q: 'น้ำท่วมคุ้มครองไหม?', a: 'ขึ้นกับแผน หลายแผนต้องซื้อความคุ้มครองน้ำท่วมเพิ่ม' },
      { q: 'ให้เช่าต้องแจ้งบริษัทไหม?', a: 'ควรแจ้งการใช้งานที่แท้จริงเพื่อให้ความคุ้มครองถูกต้อง' },
    ],
  },
  travel: {
    audience: ['นักท่องเที่ยวในประเทศและต่างประเทศ', 'ผู้สมัครวีซ่า Schengen', 'ครอบครัวและกลุ่มทัวร์ที่เดินทางเป็นประจำ'],
    coverage: {
      headers: ['ความคุ้มครอง', 'ในประเทศ', 'เอเชีย', 'ทั่วโลก'],
      rows: [
        ['ค่ารักษาฉุกเฉิน', '✓', '✓', '✓'],
        ['เที่ยวบินล่าช้า / ยกเลิก', 'ตามแผน', '✓', '✓'],
        ['กระเป๋าเดินทาง', 'ตามแผน', '✓', '✓'],
        ['อุบัติเหตุ / เสียชีวิต', '✓', '✓', '✓'],
        ['เงื่อนไขวีซ่า', '—', 'ตามแผน', '✓'],
      ],
    },
    conditions: [
      { label: 'ระยะเวลา', text: 'เลือกจำนวนวันให้ครอบคลุมทั้งทริป' },
      { label: 'อายุผู้เดินทาง', text: 'แผนเด็กและผู้สูงอายุอาจมีเงื่อนไขต่างกัน' },
      { label: 'กีฬาเสี่ยง', text: 'กิจกรรมบางอย่างต้องซื้อเสริม' },
      { label: 'เวลาซื้อ', text: 'ควรซื้อก่อนออกเดินทางเพื่อความคุ้มครองครบ' },
    ],
    faq: [
      { q: 'ซื้อหลังออกเดินทางแล้วได้ไหม?', a: 'บางแผนรับ แต่ควรซื้อล่วงหน้าเพื่อคุ้มครองการยกเลิกทริป' },
      { q: 'เที่ยวหลายประเทศใช้แผนเดียวได้ไหม?', a: 'ได้ถ้าอยู่ในขอบเขตภูมิภาคที่กำหนด เช่น ทั่วโลกไม่รวมสหรัฐฯ' },
      { q: 'เด็กต้องซื้อแยกไหม?', a: 'ขึ้นกับแผน มีทั้งแบบครอบครัวและแยกรายคน' },
    ],
  },
  business: {
    audience: ['ร้านค้าปลีกและร้านอาหาร', 'สำนักงาน SME', 'ธุรกิจที่ต้องการคุ้มครองความรับผิดต่อลูกค้า'],
    coverage: {
      type: 'list',
      items: [
        { title: 'ทรัพย์สินธุรกิจ', text: 'อาคาร ตกแต่ง สต็อกสินค้า อุปกรณ์' },
        { title: 'ความรับผิดต่อบุคคลที่สาม', text: 'ลูกค้าหรือบุคคลภายนอกได้รับอันตราย' },
        { title: 'การหยุดชะงัก', text: 'ชดเชยรายได้เมื่อธุรกิจต้องหยุดชั่วคราว' },
        { title: 'ภัยธรรมชาติและอัคคีภัย', text: 'ไฟไหม้ น้ำท่วม ลมพายุ ตามแผน' },
      ],
    },
    conditions: [
      { label: 'ประเภทธุรกิจ', text: 'เบี้ยและความคุ้มครองขึ้นกับลักษณะกิจการ' },
      { label: 'ทุนประกัน', text: 'ประเมินจากมูลค่าทรัพย์สินและรายได้' },
      { label: 'พื้นที่', text: 'พื้นที่น้ำท่วมหรือเสี่ยงภัยอาจมีเงื่อนไข' },
      { label: 'เอกสาร', text: 'ทะเบียนการค้า สัญญาเช่า รูปสถานที่' },
    ],
    faq: [
      { q: 'ร้านค้าเล็กทำได้ไหม?', a: 'ได้ มีแผนสำหรับ SME ที่ปรับทุนและความคุ้มครองตามขนาดร้าน' },
      { q: 'ลูกค้าลื่นล้มในร้านเคลมได้ไหม?', a: 'ได้ถ้ามีความคุ้มครองความรับผิดต่อบุคคลที่สาม' },
      { q: 'ทำประกันกลุ่มพนักงานคู่กันได้ไหม?', a: 'ได้ เราช่วยออกแบบแพ็กสวัสดิการรวมให้ธุรกิจ' },
    ],
  },
  critical: {
    audience: ['ผู้ที่ต้องการเงินก้อนเมื่อป่วยหนัก', 'ผู้ที่มีประวัติโรคในครอบครัว', 'ผู้ที่มีประกันสุขภาพแล้วแต่ต้องการทุนเสริม'],
    coverage: {
      headers: ['รายการ', 'แผน 25 โรค', 'มะเร็ง', 'Premium 40 โรค'],
      rows: [
        ['มะเร็ง', '✓', '✓', '✓'],
        ['โรคหัวใจ', '✓', '—', '✓'],
        ['ไตวาย / อวัยวะล้มเหลว', '✓', '—', '✓'],
        ['จ่ายเงินก้อน', '✓', '✓', '✓'],
        ['เคลมซ้ำบางโรค', 'ตามแผน', 'ตามแผน', 'ตามแผน'],
      ],
    },
    conditions: [
      { label: 'Waiting period', text: 'โดยทั่วไป 90 วันแรกหลังออกกรมธรรม์' },
      { label: 'การแจ้งสุขภาพ', text: 'ต้องแจ้งโรคประจำตัวตามจริง' },
      { label: 'การวินิจฉัย', text: 'ต้องได้รับการวินิจฉัยจากแพทย์ที่กำหนด' },
      { label: 'อายุ', text: 'รับตั้งแต่ 18 ปี ขึ้นกับแผนและบริษัท' },
    ],
    faq: [
      { q: 'ได้เงินแล้วใช้ทำอะไรก็ได้ไหม?', a: 'ได้ เป็นเงินก้อนอิสระ ไม่จำกัดการใช้จ่าย' },
      { q: 'มีประวัติครอบครัวเป็นมะเร็งทำได้ไหม?', a: 'อาจทำได้ แต่ต้องดูผลการพิจารณารับประกันของแต่ละบริษัท' },
      { q: 'ซื้อคู่ประกันสุขภาพได้ไหม?', a: 'ได้ และแนะนำ เพราะสุขภาพดูแลค่ารักษา CI ให้เงินก้อนสำรอง' },
    ],
  },
  education: {
    audience: ['พ่อแม่ที่วางแผนการศึกษาบุตร', 'ผู้ปกครองที่ต้องการออมระยะยาว', 'ครอบครัวที่ต้องการคุ้มครองชีวิตผู้หาเงิน'],
    coverage: {
      type: 'list',
      items: [
        { title: 'เงินกองทุนการศึกษา', text: 'จ่ายเมื่อบุตรถึงวัยเรียนที่กำหนด' },
        { title: 'คุ้มครองชีวิตผู้ปกครอง', text: 'ครอบครัวยังได้รับผลประโยชน์หากเกิดเหตุไม่คาดฝัน' },
        { title: 'ออมสม่ำเสมอ', text: 'สร้างวินัยการออมระยะยาว' },
        { title: 'ผลประโยชน์ครบสัญญา', text: 'รับเงินก้อนเมื่อครบระยะเวลา' },
      ],
    },
    conditions: [
      { label: 'อายุบุตร', text: 'เริ่มออมได้ตั้งแต่แรกเกิด' },
      { label: 'ระยะจ่ายเบี้ย', text: 'เลือกได้ตามเป้าหมายการศึกษา' },
      { label: 'ผู้ชำระเบี้ย', text: 'ผู้ปกครองเป็นผู้เอาประกันหลัก' },
      { label: 'ผลประโยชน์', text: 'จ่ายตามช่วงอายุหรือระดับการศึกษา' },
    ],
    faq: [
      { q: 'ถอนเงินกลางคันได้ไหม?', a: 'ขึ้นกับแผน อาจได้เงินคืนตามมูลค่า แต่ผลประโยชน์ลดลง' },
      { q: 'บุตรหลายคนทำแยกได้ไหม?', a: 'ได้ แนะนำแผนแยกตามบุตรแต่ละคน' },
      { q: 'ถ้าผู้ปกครองเสียชีวิตลูกยังได้เงินเรียนไหม?', a: 'ได้ตามเงื่อนไขแผน มักยกเว้นเบี้ยหรือจ่ายเงินก้อนให้บุตร' },
    ],
  },
  pension: {
    audience: ['ผู้วางแผนเกษียณอายุ 45–55 ปี', 'ฟรีแลนซ์ที่ไม่มีบำนาญจากที่ทำงาน', 'ผู้ที่ต้องการรายได้หลังเกษียณ'],
    coverage: {
      type: 'list',
      items: [
        { title: 'Annuity', text: 'จ่ายเบี้ยระยะหนึ่ง รับบำนาญรายเดือน/รายปี' },
        { title: 'รับตลอดชีพ', text: 'บำนาญจนกว่าจะสิ้นอายุขัย' },
        { title: 'เลือกอายุรับเงิน', text: 'เริ่มรับ 55 / 60 / 65 ปี ตามแผน' },
        { title: 'ลดหย่อนภาษี', text: 'บางแผนเบี้ยลดหย่อนได้ตามกฎหมาย' },
      ],
    },
    conditions: [
      { label: 'อายุเริ่มทำ', text: 'โดยทั่วไป 30–60 ปี' },
      { label: 'ระยะจ่ายเบี้ย', text: '5 ปี 10 ปี หรือจนถึงอายุที่กำหนด' },
      { label: 'อายุรับเงิน', text: 'เลือกได้ตามเป้าหมายเกษียณ' },
      { label: 'ผลตอบแทน', text: 'ขึ้นกับแผน อาจมีเงินคืนเมื่อครบสัญญา' },
    ],
    faq: [
      { q: 'ต่างจากกองทุนสำรองเลี้ยงชีพอย่างไร?', a: 'กองทุนสำรองเลี้ยงชีพเป็นสวัสดิการจากนายจ้าง บำนาญเป็นประกันที่ซื้อเอง' },
      { q: 'รับเงินก่อนกำหนดได้ไหม?', a: 'บางแผนมีเงินคืนกรณีถอนก่อน แต่อาจได้น้อยกว่าที่คาด' },
      { q: 'ลดหย่อนภาษีได้เท่าไหร่?', a: 'ขึ้นกับแผนและวงเงินลดหย่อนประจำปี ควรปรึกษาผู้เชี่ยวชาญ' },
    ],
  },
  cargo: {
    audience: ['ผู้ประกอบการขนส่งและโลจิสติกส์', 'ผู้ส่งออก-นำเข้าสินค้า', 'ร้านค้าออนไลน์ที่จัดส่งสินค้าจำนวนมาก'],
    coverage: {
      headers: ['ประเภท', 'Inland', 'Marine', 'All Risk'],
      rows: [
        ['ขนส่งทางบก', '✓', '—', '✓'],
        ['ขนส่งทางเรือ', '—', '✓', '✓'],
        ['ขนส่งทางอากาศ', 'ตามแผน', 'ตามแผน', '✓'],
        ['สินค้าเสียหาย/สูญหาย', '✓', '✓', '✓'],
        ['ระหว่างขนถ่าย', 'ตามแผน', '✓', '✓'],
      ],
    },
    conditions: [
      { label: 'ทุนประกัน', text: 'กำหนดตามมูลค่าสินค้าในใบขนส่ง' },
      { label: 'ประเภทสินค้า', text: 'สินค้าเปราะบางหรือเสี่ยงอาจมีข้อจำกัด' },
      { label: 'เส้นทาง', text: 'ในประเทศหรือระหว่างประเทศตามกรมธรรม์' },
      { label: 'เอกสาร', text: 'ใบขนส่ง Invoice Packing List' },
    ],
    faq: [
      { q: 'สินค้าเสียหายบางส่วนเคลมได้ไหม?', a: 'ได้ตามสัดส่วนความเสียหายและเงื่อนไขกรมธรรม์' },
      { q: 'ต้องทำประกันทุกครั้งที่ส่งไหม?', a: 'มีทั้งแบบรายเที่ยวและแบบประจำปีสำหรับผู้ส่งบ่อย' },
      { q: 'สินค้าอาหารและของเหลวทำได้ไหม?', a: 'ได้บางประเภท ต้องแจ้งลักษณะสินค้าล่วงหน้า' },
    ],
  },
  group: {
    audience: ['SME 5 คนขึ้นไป', 'องค์กรที่ต้องการสวัสดิการพนักงาน', 'บริษัทที่ต้องการลดภาระค่ารักษาพนักงาน'],
    coverage: {
      headers: ['แพ็กเกจ', 'Health 50+', 'Life + PA', 'SME Welfare'],
      rows: [
        ['ประกันสุขภาพกลุ่ม', '✓', '—', '✓'],
        ['ประกันชีวิตกลุ่ม', '—', '✓', '✓'],
        ['ประกันอุบัติเหตุ', 'ตามแผน', '✓', '✓'],
        ['ทันตกรรม', 'ตามแผน', '—', 'ตามแผน'],
        ['ครอบครัวพนักงาน', 'ตามแผน', 'ตามแผน', '✓'],
      ],
    },
    conditions: [
      { label: 'จำนวนขั้นต่ำ', text: 'โดยทั่วไป 5–10 คนขึ้นไป ขึ้นกับบริษัท' },
      { label: 'อายุพนักงาน', text: 'กำหนดช่วงอายุรับประกันกลุ่ม' },
      { label: 'งบสวัสดิการ', text: 'ปรับความคุ้มครองให้เหมาะกับงบ' },
      { label: 'เอกสาร', text: 'รายชื่อพนักงาน โครงสร้างบริษัท แบบฟอร์มกลุ่ม' },
    ],
    faq: [
      { q: 'บริษัท 5 คนทำได้ไหม?', a: 'ได้ มีแผนสำหรับ SME ขนาดเล็ก เราช่วยประเมินแพ็กที่เหมาะสม' },
      { q: 'พนักงานลาออกกลางปีทำอย่างไร?', a: 'แจ้งปรับรายชื่อกลุ่มตามรอบบัญชีกรมธรรม์' },
      { q: 'ลดหย่อนภาษีให้บริษัทได้ไหม?', a: 'เบี้ยประกันกลุ่มมักเป็นค่าใช้จ่ายบริษัทได้ตามเงื่อนไขภาษี' },
    ],
  },
};

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function cellClass(v) {
  if (v === '✓') return 'planCompare__yes';
  if (v === '—' || v === '-') return 'planCompare__no';
  return '';
}

function renderAudience(items) {
  return items
    .map((t) => `<li>${esc(t)}</li>`)
    .join('\n\t\t\t');
}

function renderCoverage(cov) {
  if (!cov) return '';
  if (cov.type === 'list') {
    return cov.items
      .map(
        (i) => `<div class="planCoverItem">
\t\t\t\t<h3>${esc(i.title)}</h3>
\t\t\t\t<p>${esc(i.text)}</p>
\t\t\t</div>`
      )
      .join('\n\t\t\t');
  }
  const head = cov.headers.map((h) => `<th scope="col">${esc(h)}</th>`).join('');
  const rows = cov.rows
    .map((row) => {
      const cells = row
        .map((cell, i) => {
          const cls = i === 0 ? '' : cellClass(cell);
          return `<td${cls ? ` class="${cls}"` : ''}>${esc(cell)}</td>`;
        })
        .join('');
      return `<tr>${cells}</tr>`;
    })
    .join('\n\t\t\t\t');
  return `<div class="planCompareWrap">
\t\t\t<table class="planCompare">
\t\t\t\t<thead><tr>${head}</tr></thead>
\t\t\t\t<tbody>
\t\t\t\t${rows}
\t\t\t\t</tbody>
\t\t\t</table>
\t\t</div>`;
}

function renderConditions(items) {
  return items
    .map(
      (c) => `<div class="planCond">
\t\t\t\t<strong>${esc(c.label)}</strong>
\t\t\t\t<p>${esc(c.text)}</p>
\t\t\t</div>`
    )
    .join('\n\t\t\t');
}

function renderSteps(steps) {
  return steps
    .map(
      (s, i) => `<div class="planStep">
\t\t\t\t<span class="planStep__num">${i + 1}</span>
\t\t\t\t<div>
\t\t\t\t\t<h3>${esc(s.title)}</h3>
\t\t\t\t\t<p>${esc(s.text)}</p>
\t\t\t\t</div>
\t\t\t</div>`
    )
    .join('\n\t\t\t');
}

function renderFaq(items) {
  return items
    .map(
      (f) => `<details class="planFaq__item">
\t\t\t\t<summary>${esc(f.q)}</summary>
\t\t\t\t<p>${esc(f.a)}</p>
\t\t\t</details>`
    )
    .join('\n\t\t\t');
}

function collectPlanItems() {
  const items = [];
  categories.forEach((cat) => {
    cat.plans.forEach((plan, pi) => {
      const imgs = CATEGORY_IMAGES[cat.slug] || CAR_IMAGES;
      items.push({
        cat,
        plan,
        img: plan.img || imgs[pi % imgs.length],
        part: getCategoryPartClass(cat.slug),
      });
    });
  });
  return items;
}

function renderHomeSlide(item) {
  return `\t\t\t\t<li class="swiper-slide ${item.part}">
\t\t\t\t\t<a href="plans/${item.cat.file}">
\t\t\t\t\t\t<div class="photo"><img loading="lazy" src="images/${item.img}" alt="${item.cat.title} ${item.plan.name}"></div>
\t\t\t\t\t\t<div class="infor">
\t\t\t\t\t\t\t<span class="part">${item.cat.title}</span>
\t\t\t\t\t\t\t<span class="tit">${item.plan.name}</span>
\t\t\t\t\t\t\t<span class="date">${item.plan.txt} · ${item.plan.price}</span>
\t\t\t\t\t\t</div>
\t\t\t\t\t</a>
\t\t\t\t</li>`;
}

function renderMobileSwiper(items) {
  if (!items.length) return '';
  const slides = items.map((item) => renderHomeSlide(item)).join('\n\n');
  return `\t\t\t\t<div class="swiper-container mSlide5_mb">
\t\t\t\t\t<ul class="swiper-wrapper">

${slides}

\t\t\t\t\t</ul>
\t\t\t\t\t<div class="control">
\t\t\t\t\t\t<button class="prevSlide4_mb" type="button">ก่อนหน้า</button>
\t\t\t\t\t\t<button class="nextSlide4_mb" type="button">ถัดไป</button>
\t\t\t\t\t</div>
\t\t\t\t</div>`;
}

function renderMCon7Block() {
  const items = collectPlanItems();
  const desktopSlides = items.map((item) => renderHomeSlide(item)).join('\n\n');
  const part1 = items.filter((i) => i.part === 'part1');
  const part2 = items.filter((i) => i.part === 'part2');
  const part3 = items.filter((i) => i.part === 'part3');

  return `\t\t\t<div class="mCon7" id="plans">
\t\t\t\t<div class="planHead">
\t\t\t\t\t<h2>แผนประกันแนะนำ</h2>
\t\t\t\t\t<div class="nNav">
\t\t\t\t\t\t<a class="nHead__all" href="contact.html">ดูเพิ่มเติม</a>
\t\t\t\t\t\t<button class="nNavBtn prevSlide4" type="button" aria-label="ก่อนหน้า"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg></button>
\t\t\t\t\t\t<button class="nNavBtn nextSlide4" type="button" aria-label="ถัดไป"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg></button>
\t\t\t\t\t</div>
\t\t\t\t</div>
\t\t\t\t<div class="swiper-container mSlide5">
\t\t\t\t\t<ul class="swiper-wrapper">

${desktopSlides}

\t\t\t\t\t</ul>
\t\t\t\t</div>
\t\t\t\t<div class="planPage" role="tablist" aria-label="ตำแหน่งสไลด์แผนประกัน">
\t\t\t\t\t<button type="button" class="planDot is-active" data-plan-dot="0" aria-label="สไลด์ชุดที่ 1" aria-selected="true"></button>
\t\t\t\t\t<button type="button" class="planDot" data-plan-dot="1" aria-label="สไลด์ชุดที่ 2" aria-selected="false"></button>
\t\t\t\t\t<button type="button" class="planDot" data-plan-dot="2" aria-label="สไลด์ชุดที่ 3" aria-selected="false"></button>
\t\t\t\t</div>
\t\t\t\t<div class="mobile_media">
${renderMobileSwiper(part1)}
${renderMobileSwiper(part2)}
${renderMobileSwiper(part3)}
\t\t\t\t</div>
\t\t\t\t<div class="kbSectionMore">
\t\t\t\t\t<a class="kbSectionMore__btn" href="contact.html">ดูเพิ่มเติม <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></a>
\t\t\t\t</div>
\t\t\t</div>
`;
}

function patchIndexMCon7() {
  const indexPath = path.join(__dirname, 'index.html');
  let html = fs.readFileSync(indexPath, 'utf8');
  const start = html.indexOf('\t\t\t<div class="mCon7"');
  const end = html.indexOf('\t\t</div>\n\t\t<div class="mConW3">');
  if (start < 0 || end < 0) throw new Error('mCon7 markers not found in index.html');
  html = html.slice(0, start) + renderMCon7Block() + html.slice(end);
  html = html.replace(/\?v=20260627\w/g, `?v=${CACHE}`);
  fs.writeFileSync(indexPath, html, 'utf8');
  console.log('patched index.html mCon7:', collectPlanItems().length, 'plan cards');
}

function renderPage(cat) {
  const details = planDetails[cat.slug] || {};
  const steps = details.steps || DEFAULT_STEPS;

  const navLinks = categories
    .map((c) => `<a href="${c.file}" class="${c.slug === cat.slug ? 'is-active' : ''}">${c.title}</a>`)
    .join('\n\t\t\t');

  const benefits = cat.benefits
    .map(
      (b) => `<div class="planBenefit">
\t\t\t\t<div class="planBenefit__icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></div>
\t\t\t\t<h3>${b.title}</h3>
\t\t\t\t<p>${b.text}</p>
\t\t\t</div>`
    )
    .join('\n\t\t\t');

  const plans = cat.plans
    .map((p, i) => {
      const imgs = CATEGORY_IMAGES[cat.slug] || CAR_IMAGES;
      const img = p.img || imgs[i % imgs.length];
      const partClass = getCategoryPartClass(cat.slug);
      return `<li class="${partClass}">
\t\t\t<a href="../contact.html">
\t\t\t\t<div class="photo"><img loading="lazy" src="../images/${img}" alt="${cat.title} ${p.name}"></div>
\t\t\t\t<div class="infor">
\t\t\t\t\t<span class="part">${cat.title}</span>
\t\t\t\t\t<span class="tit">${p.name}</span>
\t\t\t\t\t<span class="date">${p.txt} · ${p.price}</span>
\t\t\t\t</div>
\t\t\t</a>
\t\t</li>`;
    })
    .join('\n\t\t\t');

  return `<!DOCTYPE html>
<html lang="th">
<head>
<title>${cat.title} | แผนประกันแนะนำ | กล้าดีโบรคเกอร์</title>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="description" content="${cat.desc}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" type="text/css" href="../css/6723.css?v=${CACHE}">
<link rel="stylesheet" type="text/css" href="../css/6720.css?v=${CACHE}">
<link rel="stylesheet" type="text/css" href="../css/3802.css?v=${CACHE}">
<link rel="stylesheet" type="text/css" href="../css/3803.css?v=${CACHE}">
<link rel="stylesheet" type="text/css" href="../css/6714.css?v=${CACHE}">
<link rel="stylesheet" type="text/css" href="../css/header-kladee.css?v=${CACHE}">
<link rel="stylesheet" type="text/css" href="../css/6918.css?v=${CACHE}">
<link rel="stylesheet" type="text/css" href="../css/icons-lucide.css?v=${CACHE}">
<link rel="stylesheet" type="text/css" href="../css/plans.css?v=${CACHE}">
</head>
<body class="chrome-pending subpage subpage--plan" data-page="plan" data-base="../">
<ul id="skip_navi">
<li><a href="#content">ข้ามไปยังเนื้อหาหลัก</a></li>
<li><a href="#gnb">ข้ามไปยังเมนูหลัก</a></li>
</ul>
<div id="wrapper">
<div id="site-header-slot"></div>
<div id="container">
<div id="content">

<main class="planPage">
\t<nav class="planCrumb" aria-label="breadcrumb">
\t\t<a href="../index.html">หน้าแรก</a><span>/</span>
\t\t<span>แผนประกัน</span><span>/</span>
\t\t<span>${cat.title}</span>
\t</nav>

\t<section class="planHero">
\t\t<span class="planHero__badge">${cat.badge}</span>
\t\t<h1 class="planHero__title">${cat.title}</h1>
\t\t<p class="planHero__desc">${cat.desc}</p>
\t</section>

\t<section class="planSection">
\t\t<div class="planSection__head"><h2>เหมาะกับใคร</h2></div>
\t\t<ul class="planAudience">${renderAudience(details.audience || [])}</ul>
\t</section>

\t<section class="planSection">
\t\t<div class="planSection__head">
\t\t\t<h2>ความคุ้มครองหลัก</h2>
\t\t\t<p>สรุปภาพรวมเพื่อเปรียบเทียบเบื้องต้น รายละเอียดจริงขึ้นกับบริษัทและแผนที่เลือก</p>
\t\t</div>
\t\t${details.coverage && details.coverage.type === 'list' ? `<div class="planCoverList">${renderCoverage(details.coverage)}</div>` : renderCoverage(details.coverage)}
\t</section>

\t<section class="planSection">
\t\t<div class="planSection__head"><h2>เงื่อนไขสำคัญ</h2></div>
\t\t<div class="planConds">${renderConditions(details.conditions || [])}</div>
\t</section>

\t<section class="planSection">
\t\t<div class="planSection__head"><h2>ขั้นตอนทำประกันกับเรา</h2></div>
\t\t<div class="planSteps">${renderSteps(steps)}</div>
\t</section>

\t<section class="planSection">
\t\t<div class="planSection__head"><h2>ทำไมต้องเลือกผ่านกล้าดีโบรคเกอร์</h2></div>
\t\t<div class="planBenefits">${benefits}</div>
\t</section>

\t<section class="planSection">
\t\t<div class="planSection__head"><h2>คำถามที่พบบ่อย</h2></div>
\t\t<div class="planFaq">${renderFaq(details.faq || [])}</div>
\t</section>

\t<section class="planSection">
\t\t<div class="planSection__head">
\t\t\t<h2>แผนประกันแนะนำ</h2>
\t\t\t<p>${cat.intro}</p>
\t\t</div>
\t\t<div class="planCardGrid planCardGrid--mCon7">
\t\t\t<ul>${plans}</ul>
\t\t</div>
\t</section>

\t<section class="planSection planCta">
\t\t<div class="planCta__text">
\t\t\t<h2>สนใจ${cat.title}?</h2>
\t\t\t<p>ปรึกษาฟรี ไม่มีค่าใช้จ่าย ทีมงานช่วยเปรียบเทียบแผนและนัดทำรายการกับเจ้าหน้าที่โดยตรง</p>
\t\t</div>
\t\t<div class="planCta__actions">
\t\t\t<a class="planCta__btn planCta__btn--primary" href="tel:0826164555">โทร 082-616-4555</a>
\t\t\t<a class="planCta__btn planCta__btn--ghost" href="../contact.html">ติดต่อเรา</a>
\t\t</div>
\t</section>

\t<section class="planSection">
\t\t<div class="planSection__head"><h2>หมวดประกันอื่นๆ</h2></div>
\t\t<div class="planCats">${navLinks}</div>
\t</section>
</main>

</div>
</div>
<div id="site-footer-slot"></div>

<img src="#" style="width:0px;height:0px;display:none;" alt="สถิติผู้เข้าชม">
</div>
<script type="text/javascript" src="../js/3804.js?v=${CACHE}"></script>
<script type="text/javascript" src="../js/3805.js?v=${CACHE}"></script>
<script type="text/javascript" src="../js/6717.js?v=${CACHE}"></script>
<script type="text/javascript" src="../js/6719.js?v=${CACHE}"></script>
<script type="text/javascript" src="../js/site-chrome.js?v=${CACHE}"></script>
<script type="text/javascript" src="../js/float-mascot.js?v=${CACHE}"></script>
</body>
</html>`;
}

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

categories.forEach((cat) => {
  const html = renderPage(cat);
  fs.writeFileSync(path.join(OUT, cat.file), html, 'utf8');
  console.log('wrote', cat.file);
});

if (process.argv.includes('--patch-index')) {
  patchIndexMCon7();
}

console.log('Done:', categories.length, 'pages');
