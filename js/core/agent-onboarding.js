/**
 * Identity verification gate — blocking modal for unverified agents.
 */
window.App = window.App || {};

App.AgentOnboarding = {
  VERIFY_PAGE: 'agent/verify-identity',
  OVERLAY_ID: 'identityGateOverlay',

  isAllowedPage() {
    const path = App.RoleGuard.currentPagePath();
    return path === this.VERIFY_PAGE || path === 'agent/access-denied';
  },

  needsVerification(user) {
    if (!user || user.role !== 'agent') return false;
    if (!App.Config.USE_REAL_IDENTITY && App.Config.USE_MOCK_API) {
      return App.MockAPI.agentNeedsIdentityVerification?.(user) ?? false;
    }
    const status = user.identityStatus;
    if (status == null || status === '') return true;
    return status !== 'approved';
  },

  postLoginPath(user, defaultPath) {
    if (this.needsVerification(user)) {
      return this.VERIFY_PAGE;
    }
    return defaultPath;
  },

  _basePath(options = {}) {
    if (options.basePath && !App.Paths.isBadBase(options.basePath)) {
      return App.Paths.normalizeBasePath(options.basePath);
    }
    return App.Paths.detectBasePath();
  },

  enforce(options = {}) {
    const user = App.AuthService.getCurrentUser();
    if (!this.needsVerification(user)) {
      this.hideGateModal();
      return true;
    }
    if (this.isAllowedPage()) return true;
    this.showGateModal(options);
    return false;
  },

  showGateModal(options = {}) {
    this.ensureStyles();
    const base = this._basePath(options);
    const user = App.AuthService.getCurrentUser();
    const status = user?.identityStatus || 'none';
    const verifyUrl = App.Paths.verifyIdentity(base);

    let existing = document.getElementById(this.OVERLAY_ID);
    if (existing) {
      existing.hidden = false;
      return;
    }

    const isPending = status === 'pending';
    const isRejected = status === 'rejected';

    const overlay = document.createElement('div');
    overlay.id = this.OVERLAY_ID;
    overlay.className = 'identity-gate-overlay';
    overlay.innerHTML = `
      <div class="identity-gate-dialog" role="dialog" aria-modal="true" aria-labelledby="identityGateTitle">
        <div class="identity-gate-icon" aria-hidden="true">🪪</div>
        <h2 id="identityGateTitle">ยืนยันตัวตนก่อนใช้งาน</h2>
        <p class="identity-gate-lead">
          ${isPending
            ? 'คุณส่งคำขอยืนยันตัวตนแล้ว กรุณารอแอดมินตรวจสอบเอกสาร'
            : isRejected
              ? 'คำขอยืนยันตัวตนถูกปฏิเสธ กรุณาตรวจสอบข้อมูลและส่งใหม่'
              : 'กรุณายืนยันชื่อ อีเมล เบอร์โทร และแนบเอกสารให้ตรงกับที่ลงทะเบียนไว้'}
        </p>
        <ul class="identity-gate-checklist">
          <li>ชื่อ-นามสกุล</li>
          <li>อีเมล และเบอร์โทรศัพท์</li>
          <li>รูปหน้าบัญชีธนาคาร</li>
          <li>สำเนาบัตรประชาชน</li>
        </ul>
        <div class="identity-gate-actions">
          ${isPending
            ? ''
            : `<a href="${verifyUrl}" class="identity-gate-primary">เริ่มยืนยันตัวตน</a>`}
          <button type="button" class="identity-gate-logout" data-action="logout">ออกจากระบบ</button>
        </div>
      </div>
    `;

    overlay.querySelector('[data-action="logout"]')?.addEventListener('click', async () => {
      await App.AuthService.logout();
      window.location.href = App.Paths.login(base);
    });

    document.body.appendChild(overlay);
    document.body.classList.add('identity-gate-open');
  },

  hideGateModal() {
    document.getElementById(this.OVERLAY_ID)?.remove();
    document.body.classList.remove('identity-gate-open');
  },

  ensureStyles() {
    if (document.getElementById('identity-gate-css')) return;
    const style = document.createElement('style');
    style.id = 'identity-gate-css';
    style.textContent = `
      .identity-gate-overlay{
        position:fixed;inset:0;z-index:20000;
        display:flex;align-items:center;justify-content:center;padding:20px;
        background:rgba(241,245,249,.35);
        backdrop-filter:blur(12px);
        -webkit-backdrop-filter:blur(12px);
      }
      .identity-gate-dialog{
        width:min(480px,100%);background:#fff;border-radius:16px;padding:28px 24px;text-align:center;
        box-shadow:0 24px 64px rgba(15,23,42,.22);
        border:1px solid rgba(255,255,255,.85);
      }
      .identity-gate-icon{font-size:2rem;margin-bottom:8px}
      .identity-gate-dialog h2{margin:0 0 10px;font-size:1.25rem;color:#0f172a}
      .identity-gate-lead{margin:0 0 16px;color:#64748b;font-size:.95rem;line-height:1.55}
      .identity-gate-checklist{margin:0 0 20px;padding:0;list-style:none;text-align:left;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px 16px}
      .identity-gate-checklist li{padding:6px 0 6px 22px;position:relative;color:#334155;font-size:.92rem}
      .identity-gate-checklist li::before{content:'✓';position:absolute;left:0;color:#1a7d58;font-weight:700}
      .identity-gate-actions{display:flex;flex-direction:column;gap:10px}
      .identity-gate-primary{display:inline-block;padding:13px 20px;border-radius:10px;background:#1a7d58;color:#fff!important;font-weight:600;text-decoration:none}
      .identity-gate-logout{padding:10px 16px;border:0;border-radius:10px;background:#f1f5f9;color:#64748b;font:inherit;cursor:pointer}
      body.identity-gate-open{overflow:hidden}
    `;
    document.head.appendChild(style);
  }
};
