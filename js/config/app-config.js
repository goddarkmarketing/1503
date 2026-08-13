/**
 * Application configuration — set USE_MOCK_API false when PHP API + MySQL are ready.
 */
window.App = window.App || {};

App.Config = {
  USE_MOCK_API: true,
  // Production on Atom/Plesk: '/api/v1'
  // Local XAMPP example: '/kladeebroker/api/v1'
  API_BASE_URL: '/api/v1',
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
  WHT50_DATA_KEY: 'kladeebroker_wht50_documents',
  WHT50_SETTINGS_KEY: 'kladeebroker_wht50_settings',
  LOGIN_REMEMBER_KEY: 'kladeebroker_login_remember',
  LOGIN_LOCKOUT_KEY: 'kladeebroker_login_lockout',
  LOGIN_MAX_ATTEMPTS: 5,
  LOGIN_LOCKOUT_MS: 15 * 60 * 1000, // 15 minutes
  // Payer (ผู้มีหน้าที่หักภาษี) on Form 50 ทวิ
  COMPANY: {
    name: 'บริษัท กล้าดีโบรคเกอร์ จำกัด',
    address: '1311/35 หมู่ 10 ต.นครสวรรค์ตก อ.เมือง จ.นครสวรรค์ 60000',
    taxId: '0125566000000'
  },
  MOCK_DELAY_MS: 300
};
