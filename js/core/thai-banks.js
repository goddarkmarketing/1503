/**
 * Thai bank catalog for credit transfer receiving accounts.
 * Logos from: https://github.com/casperstack/thai-banks-logo
 * Local copies: images/banks/thai-banks-logo/
 */
window.App = window.App || {};

App.ThaiBanks = {
  LOGO_BASE: 'images/banks/thai-banks-logo',

  /** Banks suitable for receiving bank transfers (excludes PromptPay / TrueMoney). */
  list() {
    const base = this.LOGO_BASE;
    return [
      { code: 'BBL', short: 'กรุงเทพ', name: 'ธนาคารกรุงเทพ', color: '#29449D', logo: `${base}/BBL.png` },
      { code: 'KBANK', short: 'กสิกรไทย', name: 'ธนาคารกสิกรไทย', color: '#1DA858', logo: `${base}/KBANK.png` },
      { code: 'KTB', short: 'กรุงไทย', name: 'ธนาคารกรุงไทย', color: '#1DA8E6', logo: `${base}/KTB.png` },
      { code: 'TTB', short: 'ทีเอ็มบีธนชาต', name: 'ธนาคารทีเอ็มบีธนชาต', color: '#0C55F2', logo: `${base}/TTB.png` },
      { code: 'SCB', short: 'ไทยพาณิชย์', name: 'ธนาคารไทยพาณิชย์', color: '#543186', logo: `${base}/SCB.png` },
      { code: 'BAY', short: 'กรุงศรีอยุธยา', name: 'ธนาคารกรุงศรีอยุธยา', color: '#FFD51C', logo: `${base}/BAY.png` },
      { code: 'CIMB', short: 'ซีไอเอ็มบี', name: 'ธนาคารซีไอเอ็มบี', color: '#BD1325', logo: `${base}/CIMB.png` },
      { code: 'UOB', short: 'ยูโอบี', name: 'ธนาคารยูโอบี', color: '#E41A26', logo: `${base}/UOB.png` },
      { code: 'GSB', short: 'ออมสิน', name: 'ธนาคารออมสิน', color: '#ED1891', logo: `${base}/GSB.png` },
      { code: 'GHB', short: 'ธ.อ.ส.', name: 'ธนาคารอาคารสงเคราะห์', color: '#FF8614', logo: `${base}/GHB.png` },
      { code: 'BAAC', short: 'ธ.ก.ส.', name: 'ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร', color: '#CCA41C', logo: `${base}/BAAC.png` },
      { code: 'IBANK', short: 'อิสลามแห่งประเทศไทย', name: 'ธนาคารอิสลามแห่งประเทศไทย', color: '#164626', logo: `${base}/IBANK.png` },
      { code: 'KKP', short: 'เกียรตินาคิน', name: 'ธนาคารเกียรตินาคินภัทร', color: '#5A547C', logo: `${base}/KKP.png` },
      { code: 'TISCO', short: 'ทิสโก้', name: 'ธนาคารทิสโก้', color: '#267CBC', logo: `${base}/TISCO.png` },
      { code: 'ICBC', short: 'ไอซีบีซี', name: 'ธนาคารไอซีบีซี', color: '#CD1511', logo: `${base}/ICBC.png` },
      { code: 'TCRB', short: 'ไทยเครดิต', name: 'ธนาคารไทยเครดิต', color: '#FF7813', logo: `${base}/TCRB.png` },
      { code: 'LHB', short: 'แลนด์ แอนด์ เฮ้าส์', name: 'ธนาคารแลนด์ แอนด์ เฮ้าส์', color: '#727375', logo: `${base}/LHB.png` },
      { code: 'CITI', short: 'ซิตี้แบงก์', name: 'ธนาคารซิตี้แบงก์', color: '#0F3D89', logo: `${base}/CITI.png` },
      { code: 'HSBC', short: 'เอชเอสบีซี', name: 'ธนาคารเอชเอสบีซี', color: '#FF1518', logo: `${base}/HSBC.png` }
    ];
  },

  findByCode(code) {
    const key = String(code || '').trim().toUpperCase();
    const aliases = {
      CIMBT: 'CIMB',
      UOBT: 'UOB',
      ISBT: 'IBANK',
      ICBCT: 'ICBC',
      LHBANK: 'LHB',
      TMB: 'TTB'
    };
    const resolved = aliases[key] || key;
    return this.list().find((b) => b.code === resolved) || null;
  },

  resolveLogo(bankOrCode) {
    if (!bankOrCode) return '';
    if (typeof bankOrCode === 'string') {
      return this.findByCode(bankOrCode)?.logo || '';
    }
    if (bankOrCode.logo) return bankOrCode.logo;
    return this.findByCode(bankOrCode.bankCode || bankOrCode.code)?.logo || '';
  }
};
