/**
 * Identity verification gate — blurred overlay + form on agent dashboard.
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
      return App.Paths.agentHome().replace(window.location.origin, '').replace(/^\//, '') || 'agent/';
    }
    return defaultPath;
  },

  async enforce(options = {}) {
    const user = App.AuthService.getCurrentUser();
    if (!user || user.role !== 'agent') return Promise.resolve(true);
    if (this.isAllowedPage()) return Promise.resolve(true);

    // Be robust: rely on the latest server status, not only the identityStatus
    // present in the login payload (which might be stale on some deployments).
    let identityStatus = user.identityStatus || 'none';
    let reference = null;
    let latest = null;
    try {
      const data = await App.AgentIdentityService.getStatus(user.id);
      identityStatus = data?.identityStatus || identityStatus;
      reference = data?.reference ?? null;
      latest = data?.latest ?? null;
    } catch {
      // Fallback to identityStatus from session payload.
    }

    if (identityStatus === 'approved') {
      this.hideGateModal();
      return Promise.resolve(true);
    }

    return this.showGateModal({ ...options, identityStatus, reference, latest })
      .then(() => false);
  },

  async showGateModal(options = {}) {
    this.ensureStyles();
    const user = App.AuthService.getCurrentUser();
    if (!user) return;

    let status = (options.identityStatus ?? user.identityStatus ?? 'none') || 'none';
    let reference = options.reference ?? null;
    let latest = options.latest ?? null;

    // Only fetch again if the caller didn't provide preloaded status.
    if (options.identityStatus === undefined) {
      try {
        const data = await App.AgentIdentityService.getStatus(user.id);
        status = data.identityStatus || status;
        reference = data.reference;
        latest = data.latest;
      } catch {
        /* use session status */
      }
    }

    document.getElementById(this.OVERLAY_ID)?.remove();

    const isPending = status === 'pending';
    const isRejected = status === 'rejected';
    const rejectNote = latest?.adminNote ? `<p class="identity-gate-reject">${this._esc(latest.adminNote)}</p>` : '';

    const overlay = document.createElement('div');
    overlay.id = this.OVERLAY_ID;
    overlay.className = 'identity-gate-overlay';
    overlay.innerHTML = isPending ? `
      <div class="identity-gate-dialog identity-gate-dialog--wide" role="dialog" aria-modal="true">
        <div class="identity-gate-icon" aria-hidden="true">🪪</div>
        <h2>รอแอดมินตรวจสอบ</h2>
        <p class="identity-gate-lead">คุณส่งคำขอยืนยันตัวตนแล้ว กรุณารอแอดมินตรวจสอบเอกสาร<br>เมื่ออนุมัติแล้วระบบจะเปิดใช้งานให้อัตโนมัติ</p>
        <div class="identity-gate-actions">
          <button type="button" class="identity-gate-logout" data-action="logout">ออกจากระบบ</button>
        </div>
      </div>
    ` : `
      <div class="identity-gate-dialog identity-gate-dialog--wide" role="dialog" aria-modal="true">
        <div class="identity-gate-icon" aria-hidden="true">🪪</div>
        <h2>ยืนยันตัวตนก่อนใช้งาน</h2>
        <p class="identity-gate-lead">${isRejected
          ? 'คำขอถูกปฏิเสธ กรุณาแก้ไขข้อมูลและส่งใหม่'
          : 'กรอกข้อมูลให้ตรงกับที่ลงทะเบียน และแนบเอกสารเพื่อให้แอดมินตรวจสอบ'}</p>
        ${rejectNote}
        <form id="identityGateForm" class="identity-gate-form" novalidate>
          <div class="identity-gate-field">
            <label for="igName">ชื่อ-นามสกุล *</label>
            <input id="igName" name="name" type="text" required value="${this._esc(reference?.name || user.name || '')}">
          </div>
          <div class="identity-gate-row">
            <div class="identity-gate-field">
              <label for="igEmail">อีเมล *</label>
              <input id="igEmail" name="email" type="email" required value="${this._esc(reference?.email || user.email || '')}">
            </div>
            <div class="identity-gate-field">
              <label for="igPhone">เบอร์โทร *</label>
              <input id="igPhone" name="phone" type="tel" required value="${this._esc(reference?.phone || user.phone || '')}">
            </div>
          </div>
          <div class="identity-gate-row">
            <div class="identity-gate-field">
              <label for="igBank">รูปหน้าบัญชีธนาคาร *</label>
              <label class="identity-gate-file" for="igBank">
                <input id="igBank" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" required hidden>
                <span class="identity-gate-file-btn">เลือกไฟล์</span>
                <span class="identity-gate-file-name">JPG / PNG / PDF</span>
              </label>
            </div>
            <div class="identity-gate-field">
              <label for="igIdCard">สำเนาบัตรประชาชน *</label>
              <label class="identity-gate-file" for="igIdCard">
                <input id="igIdCard" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" required hidden>
                <span class="identity-gate-file-btn">เลือกไฟล์</span>
                <span class="identity-gate-file-name">JPG / PNG / PDF</span>
              </label>
            </div>
          </div>
          ${reference?.name ? `<p class="identity-gate-hint">ข้อมูลต้องตรงกับที่ลงทะเบียน: ${this._esc([reference.name, reference.email, reference.phone].filter(Boolean).join(' · '))}</p>` : ''}
          <div class="identity-gate-actions">
            <button type="submit" class="identity-gate-primary" id="igSubmit">ส่งคำขอยืนยันตัวตน</button>
            <button type="button" class="identity-gate-logout" data-action="logout">ออกจากระบบ</button>
          </div>
        </form>
      </div>
    `;

    overlay.querySelector('[data-action="logout"]')?.addEventListener('click', async () => {
      await App.AuthService.logout();
      App.Paths.go('login');
    });

    this._bindFileInputs(overlay);

    const form = overlay.querySelector('#identityGateForm');
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = overlay.querySelector('#igSubmit');
      const bankFile = overlay.querySelector('#igBank')?.files?.[0];
      const idFile = overlay.querySelector('#igIdCard')?.files?.[0];
      if (!bankFile || !idFile) {
        alert('กรุณาแนบเอกสารครบทั้ง 2 ไฟล์');
        return;
      }
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'กำลังส่ง...';
      }
      try {
        const [bankAccount, idCard] = await Promise.all([
          App.CreditSlip.readFile(bankFile),
          App.CreditSlip.readFile(idFile)
        ]);
        await App.AgentIdentityService.submit(user.id, {
          name: form.name.value.trim(),
          email: form.email.value.trim(),
          phone: form.phone.value.trim(),
          bankAccount,
          idCard
        });
        await App.AuthService.refreshUser();
        await this.showGateModal(options);
      } catch (err) {
        alert(err.message || 'ส่งคำขอไม่สำเร็จ');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'ส่งคำขอยืนยันตัวตน';
        }
      }
    });

    document.body.appendChild(overlay);
    document.body.classList.add('identity-gate-open');
  },

  hideGateModal() {
    document.getElementById(this.OVERLAY_ID)?.remove();
    document.body.classList.remove('identity-gate-open');
  },

  _esc(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  },

  _bindFileInputs(root) {
    root.querySelectorAll('.identity-gate-file input[type=file]').forEach((input) => {
      const wrap = input.closest('.identity-gate-file');
      const nameEl = wrap?.querySelector('.identity-gate-file-name');
      const placeholder = nameEl?.textContent || 'ยังไม่ได้เลือกไฟล์';
      input.addEventListener('change', () => {
        const file = input.files?.[0];
        if (nameEl) nameEl.textContent = file ? file.name : placeholder;
        wrap?.classList.toggle('has-file', !!file);
      });
    });
  },

  ensureStyles() {
    if (document.getElementById('identity-gate-css')) return;
    const style = document.createElement('style');
    style.id = 'identity-gate-css';
    style.textContent = `
      .identity-gate-overlay{
        position:fixed;inset:0;z-index:20000;
        display:flex;align-items:center;justify-content:center;padding:16px;
        background:rgba(15,23,42,.42);
        backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);
      }

      .identity-gate-dialog{
        width:min(620px,100%);
        overflow:hidden;
        background:#fff;border-radius:18px;
        text-align:center;
        box-shadow:0 24px 64px rgba(15,23,42,.22);
        border:1px solid var(--border);
        padding:16px 20px 14px;
      }

      .identity-gate-dialog--wide{ text-align:left; }

      .identity-gate-icon{
        width:40px;height:40px;margin:0 auto 6px;
        background:var(--accent-green-soft);
        color:var(--accent-green);
        border-radius:12px;
        display:flex;align-items:center;justify-content:center;
        font-size:1.35rem;
      }

      .identity-gate-dialog h2{
        margin:0 0 4px;
        font-size:1.18rem;
        color:var(--accent-green);
        text-align:center;
      }

      .identity-gate-lead{
        margin:0 0 10px;
        color:var(--text-muted);
        font-size:.82rem;line-height:1.45;
        text-align:center;
      }

      .identity-gate-reject{
        margin:0 0 10px;
        padding:8px 10px;background:#fef2f2;
        border:1px solid #fecaca;border-radius:10px;
        color:#b91c1c;font-size:.82rem;
      }

      .identity-gate-form{display:flex;flex-direction:column;gap:8px}
      .identity-gate-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
      @media(max-width:560px){.identity-gate-row{grid-template-columns:1fr}}

      .identity-gate-field label{
        display:block;margin-bottom:4px;
        font-size:.8rem;font-weight:700;color:#334155
      }

      .identity-gate-field input:not([type=file]){
        width:100%;padding:9px 12px;
        border:1px solid var(--border);border-radius:10px;
        font:inherit;box-sizing:border-box;background:#fff;
      }

      .identity-gate-file{
        display:flex;align-items:center;gap:8px;
        width:100%;padding:8px 10px;
        border:1.5px dashed var(--border);border-radius:10px;
        background:#f8fafc;cursor:pointer;box-sizing:border-box;
        transition:border-color .15s,background .15s;
      }

      .identity-gate-file:hover,
      .identity-gate-file.has-file{
        border-color:var(--accent-green);
        background:var(--accent-green-soft);
      }

      .identity-gate-file-btn{
        display:inline-flex;align-items:center;
        padding:6px 12px;border-radius:8px;
        background:var(--brand-green-gradient);
        color:#fff;font-size:.78rem;font-weight:700;
        white-space:nowrap;flex-shrink:0;
      }

      .identity-gate-file-name{
        flex:1;font-size:.75rem;color:var(--text-muted);
        overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
      }

      .identity-gate-file.has-file .identity-gate-file-name{
        color:#334155;font-weight:600;
      }

      .identity-gate-field input:focus{
        outline:none;border-color:var(--accent-green);
        box-shadow:0 0 0 3px var(--accent-green-soft);
      }

      .identity-gate-hint{
        margin:0;font-size:.75rem;color:var(--text-muted);
        text-align:center;
      }

      .identity-gate-actions{
        display:grid;grid-template-columns:1.4fr .8fr;gap:8px;margin-top:4px;
      }
      @media(max-width:560px){.identity-gate-actions{grid-template-columns:1fr}}

      .identity-gate-primary{
        display:block;width:100%;
        padding:11px 14px;border:0;border-radius:10px;
        background:var(--brand-green-gradient);
        color:#fff;font-weight:700;font:inherit;
        cursor:pointer;text-align:center;
        box-shadow:var(--brand-green-shadow);
      }

      .identity-gate-primary:disabled{opacity:.6;cursor:not-allowed;box-shadow:none}

      .identity-gate-logout{
        padding:11px 14px;border:1px solid var(--border);
        border-radius:10px;background:#fff;color:var(--text-muted);
        font:inherit;cursor:pointer;
      }

      .identity-gate-logout:hover{background:var(--bg-page);color:var(--text-dark)}

      body.identity-gate-open{overflow:hidden}
    `;
    document.head.appendChild(style);
  }
};
