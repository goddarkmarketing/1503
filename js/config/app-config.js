/**
 * Application configuration
 * - USE_REAL_AUTH: login/me/logout/change-password ใช้ PHP API + MySQL
 * - USE_REAL_AGENTS: จัดการนายหน้า + ประวัติวงเงิน/สลิปโอน ใช้ PHP API + MySQL
 * - USE_REAL_ADMIN_USERS: จัดการผู้ดูแลระบบใช้ PHP API + MySQL
 * - USE_REAL_CREDIT: บัญชีรับโอน + คำขอเติมวงเงิน ใช้ PHP API + MySQL
 * - USE_REAL_WITHDRAW: คำขอถอนเงิน ใช้ PHP API + MySQL และส่งอีเมลแจ้งแอดมิน
 * - USE_REAL_AGENT_REQUESTS: คำขอเพิ่มตัวแทนจากนายหน้า → แอดมินอนุมัติ + อีเมล
 * - USE_REAL_IDENTITY: ยืนยันตัวตนครั้งแรก + ลืมรหัสผ่านทางอีเมล (auth routes)
 * - USE_MOCK_API: ฟีเจอร์อื่นยังใช้ mock จนกว่า endpoint จะครบ
 */
window.App = window.App || {};

App.Config = {
  USE_MOCK_API: true,
  USE_REAL_AUTH: true,
  USE_REAL_AGENTS: true,
  USE_REAL_ADMIN_USERS: true,
  USE_REAL_CREDIT: false,
  USE_REAL_WITHDRAW: true,
  USE_REAL_AGENT_REQUESTS: true,
  USE_REAL_IDENTITY: true,
  // Production on Atom/Plesk: '/api/v1'
  // Local XAMPP under /kladeebroker/ is detected automatically
  API_BASE_URL: (() => {
    const path = window.location.pathname || '';
    if (path === '/kladeebroker' || path.indexOf('/kladeebroker/') === 0) {
      return '/kladeebroker/api/v1';
    }
    return '/api/v1';
  })(),
  SESSION_KEY: 'kladeebroker_session',
  AGENT_PERMISSIONS_KEY: 'kladeebroker_agent_permissions',
  AGENT_COMMISSION_RATES_KEY: 'kladeebroker_agent_commission_rates',
  AGENT_TEAM_KEY: 'kladeebroker_agent_team',
  RECEIPT_PAPER_KEY: 'kladeebroker_receipt_paper',
  CREDIT_DATA_KEY: 'kladeebroker_credit_data',
  // When enabled: commission is "cleared" immediately via agent wallet,
  // so there is no "pending -> mark as paid" workflow.
  COMMISSION_PAY_THROUGH_WALLET: true,
  CREDIT_BANK_ACCOUNTS_KEY: 'kladeebroker_credit_bank_accounts',
  AGENT_PAYOUT_BANK_KEY: 'kladeebroker_agent_payout_bank',
  WHT50_DATA_KEY: 'kladeebroker_wht50_documents',
  WHT50_SETTINGS_KEY: 'kladeebroker_wht50_settings',
  LOGIN_REMEMBER_KEY: 'kladeebroker_login_remember',
  LOGIN_LOCKOUT_KEY: 'kladeebroker_login_lockout',
  LOGIN_MAX_ATTEMPTS: 5,
  LOGIN_LOCKOUT_MS: 15 * 60 * 1000, // 15 minutes
  TEAM_MEMBER_LIMIT: 2,
  // Payer (ผู้มีหน้าที่หักภาษี) on Form 50 ทวิ
  COMPANY: {
    name: 'บริษัท กล้าดีโบรคเกอร์ จำกัด',
    address: '1311/35 หมู่ 10 ต.นครสวรรค์ตก อ.เมือง จ.นครสวรรค์ 60000',
    taxId: '0125566000000'
  },
  MOCK_DELAY_MS: 300
};
