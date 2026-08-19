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
    const justSubmitted = !!options.justSubmitted;
    const rejectNote = latest?.adminNote ? `<p class="identity-gate-reject">${this._esc(latest.adminNote)}</p>` : '';

    const overlay = document.createElement('div');
    overlay.id = this.OVERLAY_ID;
    overlay.className = 'identity-gate-overlay';
    overlay.innerHTML = isPending ? `
      <div class="identity-gate-dialog identity-gate-dialog--status" role="dialog" aria-modal="true">
        <div class="identity-gate-clock ${justSubmitted ? 'identity-gate-clock--spin' : ''}" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>
        <h2>ขอบคุณที่ยืนยันตัวตน</h2>
        <p class="identity-gate-lead">เราได้รับเอกสารของท่านแล้ว<br>เจ้าหน้าที่จะตรวจสอบข้อมูลภายใน 1 วันทำการ<br>เมื่ออนุมัติแล้ว ระบบจะเปิดใช้งานให้อัตโนมัติ</p>
        <div class="identity-gate-status-pill">สถานะ: กำลังรอเจ้าหน้าที่ตรวจสอบ</div>
        <div class="identity-gate-actions identity-gate-actions--single">
          <button type="button" class="identity-gate-logout" data-action="logout">ออกจากระบบ</button>
        </div>
      </div>
    ` : `
      <div class="identity-gate-dialog identity-gate-dialog--wide" role="dialog" aria-modal="true">
        <div class="identity-gate-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="5" width="20" height="14" rx="2"/>
            <circle cx="8.5" cy="12" r="2.5"/>
            <path d="M14 10h5M14 14h5"/>
          </svg>
        </div>
        <h2>ยืนยันตัวตนก่อนใช้งาน</h2>
        <p class="identity-gate-lead">${isRejected
          ? 'คำขอถูกปฏิเสธ กรุณาแก้ไขข้อมูลและส่งใหม่'
          : 'กรอกข้อมูลให้ตรงกับที่ลงทะเบียน และแนบเอกสารเพื่อให้แอดมินตรวจสอบ'}</p>
        ${rejectNote}
        <form id="identityGateForm" class="identity-gate-form" novalidate>
          <ol class="identity-gate-steps" aria-label="ขั้นตอนยืนยันตัวตน">
            <li class="identity-gate-step is-active" data-ig-dot="1"><span>1</span>ข้อมูล</li>
            <li class="identity-gate-step" data-ig-dot="2"><span>2</span>บัญชีรับโอน</li>
            <li class="identity-gate-step" data-ig-dot="3"><span>3</span>เอกสาร</li>
          </ol>
          <div data-ig-step="1">
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
            ${reference?.name ? `<p class="identity-gate-hint">ข้อมูลต้องตรงกับที่ลงทะเบียน: ${this._esc([reference.name, reference.email, reference.phone].filter(Boolean).join(' · '))}</p>` : ''}
          </div>
          <div data-ig-step="2" hidden>
            <div class="identity-gate-field">
              <label>ธนาคาร *</label>
              <input type="hidden" id="igBankCode" name="payoutBankCode" required>
              <div class="ig-bank-picker" id="igBankPicker">
                <button type="button" class="ig-bank-picker__trigger" id="igBankTrigger" aria-haspopup="listbox" aria-expanded="false">
                  <span class="ig-bank-picker__preview" id="igBankChosen">เลือกธนาคาร</span>
                  <span class="ig-bank-picker__chevron" aria-hidden="true">▾</span>
                </button>
                <div class="ig-bank-picker__menu" id="igBankMenu" hidden role="listbox"></div>
              </div>
            </div>
            <div class="identity-gate-row">
              <div class="identity-gate-field">
                <label for="igAccountNo">เลขที่บัญชี *</label>
                <input id="igAccountNo" name="payoutAccountNo" type="text" inputmode="numeric" required placeholder="เช่น 1234567890">
              </div>
              <div class="identity-gate-field">
                <label for="igAccountName">ชื่อบัญชี *</label>
                <input id="igAccountName" name="payoutAccountName" type="text" required value="${this._esc(reference?.name || user.name || '')}">
              </div>
            </div>
            <div class="identity-gate-field">
              <label for="igBank">รูปหน้าบัญชีธนาคาร *</label>
              <label class="identity-gate-file" for="igBank">
                <input id="igBank" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" required hidden>
                <span class="identity-gate-file-btn">เลือกไฟล์</span>
                <span class="identity-gate-file-name">JPG / PNG / PDF</span>
              </label>
              <div class="identity-gate-preview" id="igBankPreview" hidden></div>
            </div>
          </div>
          <div data-ig-step="3" hidden>
            <div class="identity-gate-field">
              <label for="igIdCard">สำเนาบัตรประชาชน *</label>
              <label class="identity-gate-file" for="igIdCard">
                <input id="igIdCard" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" required hidden>
                <span class="identity-gate-file-btn">เลือกไฟล์</span>
                <span class="identity-gate-file-name">JPG / PNG / PDF</span>
              </label>
              <div class="identity-gate-preview" id="igIdPreview" hidden></div>
            </div>
            <div class="identity-gate-confirm" id="igConfirm" hidden>
              <p class="identity-gate-confirm-title">ยืนยันการส่งเอกสาร?</p>
              <p class="identity-gate-confirm-text">กรุณาตรวจสอบว่าข้อมูล บัญชี และไฟล์ถูกต้อง<br>หลังจากส่งแล้ว เจ้าหน้าที่จะตรวจสอบก่อนเปิดใช้งานระบบ</p>
              <div class="identity-gate-actions">
                <button type="button" class="identity-gate-primary" id="igConfirmYes">ยืนยันการส่ง</button>
                <button type="button" class="identity-gate-logout" id="igConfirmNo">กลับไปแก้ไข</button>
              </div>
            </div>
          </div>
          <div class="identity-gate-actions" id="igActions">
            <button type="button" class="identity-gate-logout" id="igBack" hidden>ย้อนกลับ</button>
            <button type="button" class="identity-gate-primary" id="igNext">ถัดไป</button>
            <button type="submit" class="identity-gate-primary" id="igSubmit" hidden>ส่งคำขอยืนยันตัวตน</button>
          </div>
          <button type="button" class="identity-gate-logout identity-gate-logout--full" data-action="logout">ออกจากระบบ</button>
        </form>
      </div>
    `;

    overlay.querySelectorAll('[data-action="logout"]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        await App.AuthService.logout();
        App.Paths.go('login');
      });
    });

    this._bindFileInputs(overlay);
    this._bindBankPicker(overlay);

    const form = overlay.querySelector('#identityGateForm');
    if (!form) {
      document.body.appendChild(overlay);
      document.body.classList.add('identity-gate-open');
      return;
    }

    const actions = overlay.querySelector('#igActions');
    const confirmBox = overlay.querySelector('#igConfirm');
    const confirmYes = overlay.querySelector('#igConfirmYes');
    const nextBtn = overlay.querySelector('#igNext');
    const backBtn = overlay.querySelector('#igBack');
    const submitBtn = overlay.querySelector('#igSubmit');
    let step = 1;

    const setStep = (n) => {
      step = n;
      overlay.querySelectorAll('[data-ig-step]').forEach((panel) => {
        panel.hidden = Number(panel.dataset.igStep) !== n;
      });
      overlay.querySelectorAll('[data-ig-dot]').forEach((dot) => {
        const i = Number(dot.dataset.igDot);
        dot.classList.toggle('is-active', i === n);
        dot.classList.toggle('is-done', i < n);
      });
      if (backBtn) backBtn.hidden = n === 1;
      if (nextBtn) nextBtn.hidden = n === 3;
      if (submitBtn) {
        submitBtn.hidden = n !== 3;
        this._syncSubmitState(overlay, submitBtn);
      }
      if (confirmBox) confirmBox.hidden = true;
      if (actions) actions.hidden = false;
    };

    const validateStep = (n) => {
      if (n === 1) {
        if (!form.name.value.trim() || !form.email.value.trim() || !form.phone.value.trim()) {
          alert('กรุณากรอกชื่อ อีเมล และเบอร์โทรให้ครบ');
          return false;
        }
        return true;
      }
      if (n === 2) {
        const code = form.payoutBankCode.value.trim();
        const accNo = form.payoutAccountNo.value.replace(/\D+/g, '');
        const accName = form.payoutAccountName.value.trim();
        const bankFile = overlay.querySelector('#igBank')?.files?.[0];
        if (!code || !accNo || !accName) {
          alert('กรุณากรอกธนาคาร เลขที่บัญชี และชื่อบัญชี');
          return false;
        }
        if (accNo.length < 8) {
          alert('เลขที่บัญชีไม่ถูกต้อง');
          return false;
        }
        if (!bankFile) {
          alert('กรุณาแนบรูปหน้าบัญชีธนาคาร');
          return false;
        }
        form.payoutAccountNo.value = accNo;
        return true;
      }
      if (n === 3) {
        if (!overlay.querySelector('#igIdCard')?.files?.[0]) {
          alert('กรุณาแนบสำเนาบัตรประชาชน');
          return false;
        }
        return true;
      }
      return true;
    };

    overlay.addEventListener('input', () => this._syncSubmitState(overlay, submitBtn));
    overlay.addEventListener('change', () => this._syncSubmitState(overlay, submitBtn));

    nextBtn?.addEventListener('click', () => {
      if (!validateStep(step)) return;
      setStep(Math.min(3, step + 1));
    });
    backBtn?.addEventListener('click', () => setStep(Math.max(1, step - 1)));

    const toggleConfirm = (show) => {
      if (actions) actions.hidden = show;
      if (confirmBox) confirmBox.hidden = !show;
    };

    overlay.querySelector('#igConfirmNo')?.addEventListener('click', () => toggleConfirm(false));

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (step !== 3) {
        if (validateStep(step)) setStep(Math.min(3, step + 1));
        return;
      }
      if (!this._isFormComplete(overlay)) {
        this._syncSubmitState(overlay, submitBtn);
        return;
      }
      if (!validateStep(1) || !validateStep(2) || !validateStep(3)) return;
      toggleConfirm(true);
    });

    confirmYes?.addEventListener('click', async () => {
      const bankFile = overlay.querySelector('#igBank')?.files?.[0];
      const idFile = overlay.querySelector('#igIdCard')?.files?.[0];
      if (!bankFile || !idFile) {
        toggleConfirm(false);
        alert('กรุณาแนบเอกสารครบทั้ง 2 ไฟล์');
        return;
      }
      confirmYes.disabled = true;
      confirmYes.textContent = 'กำลังส่งเอกสาร...';
      overlay.querySelector('#igConfirmNo')?.setAttribute('disabled', 'disabled');
      try {
        const [bankAccount, idCard] = await Promise.all([
          App.CreditSlip.readFile(bankFile),
          App.CreditSlip.readFile(idFile)
        ]);
        const bank = App.ThaiBanks?.findByCode?.(form.payoutBankCode.value) || null;
        await App.AgentIdentityService.submit(user.id, {
          name: form.name.value.trim(),
          email: form.email.value.trim(),
          phone: form.phone.value.trim(),
          payoutBankCode: form.payoutBankCode.value.trim(),
          payoutBankName: bank?.name || form.payoutBankCode.value.trim(),
          payoutAccountNo: form.payoutAccountNo.value.replace(/\D+/g, ''),
          payoutAccountName: form.payoutAccountName.value.trim(),
          bankAccount,
          idCard
        });
        try { await App.AuthService.refreshUser(); } catch { /* keep going */ }
        await this.showGateModal({ ...options, identityStatus: 'pending', justSubmitted: true });
      } catch (err) {
        alert(err.message || 'ส่งคำขอไม่สำเร็จ กรุณาลองอีกครั้ง');
        confirmYes.disabled = false;
        confirmYes.textContent = 'ยืนยันการส่ง';
        overlay.querySelector('#igConfirmNo')?.removeAttribute('disabled');
      }
    });

    setStep(1);

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

  _logoUrl(bank) {
    const logo = bank?.logo || '';
    if (!logo) return '';
    if (/^https?:\/\//i.test(logo)) return logo;
    return App.Paths?.absolute ? App.Paths.absolute(logo) : `../${logo}`;
  },

  _isFormComplete(root) {
    const form = root.querySelector('#identityGateForm');
    if (!form) return false;
    const bankFile = root.querySelector('#igBank')?.files?.[0];
    const idFile = root.querySelector('#igIdCard')?.files?.[0];
    return !!(
      form.name?.value.trim()
      && form.email?.value.trim()
      && form.phone?.value.trim()
      && form.payoutBankCode?.value.trim()
      && (form.payoutAccountNo?.value || '').replace(/\D+/g, '').length >= 8
      && form.payoutAccountName?.value.trim()
      && bankFile
      && idFile
    );
  },

  _syncSubmitState(root, submitBtn) {
    if (!submitBtn || submitBtn.hidden) return;
    const ready = this._isFormComplete(root);
    submitBtn.disabled = !ready;
    submitBtn.classList.toggle('is-idle', !ready);
  },

  _bindBankPicker(root) {
    const hidden = root.querySelector('#igBankCode');
    const trigger = root.querySelector('#igBankTrigger');
    const menu = root.querySelector('#igBankMenu');
    const preview = root.querySelector('#igBankChosen');
    const picker = root.querySelector('#igBankPicker');
    if (!hidden || !trigger || !menu || !preview) return;

    const banks = App.ThaiBanks?.list?.() || [];
    menu.innerHTML = banks.map((b) => `
      <button type="button" class="ig-bank-picker__option" role="option" data-code="${this._esc(b.code)}">
        <img src="${this._esc(this._logoUrl(b))}" alt="" width="28" height="28">
        <span>
          <strong>${this._esc(b.short || b.name)}</strong>
          <em>${this._esc(b.name)}</em>
        </span>
      </button>
    `).join('');

    const close = () => {
      menu.hidden = true;
      picker?.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
    };

    const apply = (code) => {
      const bank = App.ThaiBanks?.findByCode?.(code);
      hidden.value = bank?.code || '';
      menu.querySelectorAll('.ig-bank-picker__option').forEach((btn) => {
        btn.classList.toggle('is-selected', btn.dataset.code === hidden.value);
      });
      if (!bank) {
        preview.innerHTML = 'เลือกธนาคาร';
        preview.classList.add('is-placeholder');
        return;
      }
      preview.classList.remove('is-placeholder');
      preview.innerHTML = `
        <img src="${this._esc(this._logoUrl(bank))}" alt="" width="24" height="24">
        <span>${this._esc(bank.name)}</span>
      `;
    };

    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const open = menu.hidden;
      menu.hidden = !open;
      picker?.classList.toggle('is-open', open);
      trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    menu.addEventListener('click', (e) => {
      e.stopPropagation();
      const btn = e.target.closest('.ig-bank-picker__option');
      if (!btn) return;
      apply(btn.dataset.code);
      close();
      hidden.dispatchEvent(new Event('change', { bubbles: true }));
    });

    root.addEventListener('click', () => close());

    apply(hidden.value);
  },

  _bindFileInputs(root) {
    root.querySelectorAll('.identity-gate-file input[type=file]').forEach((input) => {
      const wrap = input.closest('.identity-gate-file');
      const nameEl = wrap?.querySelector('.identity-gate-file-name');
      const preview = wrap?.parentElement?.querySelector('.identity-gate-preview');
      const placeholder = nameEl?.textContent || 'ยังไม่ได้เลือกไฟล์';
      input.addEventListener('change', () => {
        const file = input.files?.[0];
        if (nameEl) nameEl.textContent = file ? file.name : placeholder;
        wrap?.classList.toggle('has-file', !!file);
        if (!preview) return;
        preview.hidden = !file;
        preview.innerHTML = '';
        if (!file) return;
        if (file.type.startsWith('image/')) {
          const img = document.createElement('img');
          img.alt = file.name;
          img.src = URL.createObjectURL(file);
          preview.appendChild(img);
        } else {
          preview.innerHTML = `<p class="identity-gate-preview-pdf">ไฟล์ PDF: ${this._esc(file.name)}</p>`;
        }
      });
    });
  },

  ensureStyles() {
    document.getElementById('identity-gate-css')?.remove();
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
        overflow:visible;
        background:#fff;border-radius:18px;
        text-align:center;
        box-shadow:0 24px 64px rgba(15,23,42,.22);
        border:1px solid var(--border);
        padding:16px 20px 14px;
      }

      .identity-gate-dialog--wide{ text-align:left; }
      .identity-gate-dialog--status{ text-align:center; padding:28px 24px 20px; }

      .identity-gate-clock{
        width:56px;height:56px;margin:4px auto 14px;
        border-radius:16px;
        background:var(--accent-green-soft);
        color:var(--accent-green);
        display:flex;align-items:center;justify-content:center;
      }
      .identity-gate-clock svg{width:28px;height:28px;display:block}
      .identity-gate-clock--spin svg{
        transform-origin:center;
        animation:igClock .7s ease-out;
      }
      @keyframes igClock{0%{transform:scale(.7) rotate(-20deg);opacity:0}100%{transform:scale(1) rotate(0);opacity:1}}

      .identity-gate-status-pill{
        display:flex;align-items:center;justify-content:center;
        width:fit-content;margin:4px auto 16px;padding:8px 14px;
        border-radius:999px;background:var(--accent-green-soft);
        color:var(--accent-green);font-size:.82rem;font-weight:700;
      }

      .identity-gate-confirm{
        margin-top:4px;padding:12px 12px 10px;
        border:1px solid var(--border);border-radius:12px;
        background:#f8fafc;text-align:center;
      }
      .identity-gate-confirm-title{
        margin:0 0 4px;font-size:.95rem;font-weight:700;color:#0f172a;
      }
      .identity-gate-confirm-text{
        margin:0 0 10px;font-size:.8rem;line-height:1.5;color:var(--text-muted);
      }

      .identity-gate-icon{
        width:40px;height:40px;margin:0 auto 6px;
        background:var(--accent-green-soft);
        color:var(--accent-green);
        border-radius:12px;
        display:flex;align-items:center;justify-content:center;
      }
      .identity-gate-icon svg{width:22px;height:22px;display:block}

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

      .identity-gate-form{display:flex;flex-direction:column;gap:14px}
      .identity-gate-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
      @media(max-width:560px){.identity-gate-row{grid-template-columns:1fr}}
      [data-ig-step]{display:flex;flex-direction:column;gap:16px;padding-top:8px}
      [data-ig-step][hidden]{display:none !important}

      .identity-gate-steps{
        list-style:none;margin:2px 8px 4px;padding:0;
        display:flex;align-items:flex-start;justify-content:space-between;
      }
      .identity-gate-step{
        flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;
        font-size:.72rem;color:#94a3b8;text-align:center;position:relative;
      }
      .identity-gate-step:not(:last-child)::after{
        content:'';position:absolute;top:13px;
        left:calc(50% + 16px);right:calc(-50% + 16px);
        border-top:1.5px dashed #cbd5e1;pointer-events:none;
      }
      .identity-gate-step.is-done:not(:last-child)::after,
      .identity-gate-step.is-active:not(:last-child)::after{
        border-top-color:#86efac;
      }
      .identity-gate-step span{
        width:26px;height:26px;border-radius:50%;
        display:flex;align-items:center;justify-content:center;
        border:2px solid #cbd5e1;background:#fff;
        font-weight:700;font-size:.8rem;color:#64748b;
        position:relative;z-index:1;
      }
      .identity-gate-step.is-active{color:var(--accent-green);font-weight:700}
      .identity-gate-step.is-active span,
      .identity-gate-step.is-done span{
        border-color:var(--accent-green);background:var(--accent-green);color:#fff;
      }

      .ig-bank-picker{position:relative;z-index:6}
      .ig-bank-picker__trigger{
        width:100%;min-height:46px;padding:8px 12px;
        border:1px solid var(--border);border-radius:10px;
        background:#fff;display:flex;align-items:center;justify-content:space-between;gap:8px;
        font:inherit;cursor:pointer;text-align:left;box-sizing:border-box;
      }
      .ig-bank-picker.is-open .ig-bank-picker__trigger{
        border-color:var(--accent-green);box-shadow:0 0 0 3px var(--accent-green-soft);
      }
      .ig-bank-picker__preview{
        display:flex;align-items:center;gap:10px;color:#334155;font-size:.9rem;
      }
      .ig-bank-picker__preview.is-placeholder,
      .ig-bank-picker__preview:not(:has(img)){color:#94a3b8}
      .ig-bank-picker__preview img{
        width:28px;height:28px;object-fit:contain;border-radius:6px;background:#f8fafc;flex-shrink:0;
      }
      .ig-bank-picker__chevron{color:#94a3b8;font-size:.85rem}
      .ig-bank-picker__menu{
        position:absolute;left:0;right:0;top:calc(100% + 6px);z-index:8;
        max-height:220px;overflow:auto;
        background:#fff;border:1px solid var(--border);border-radius:12px;
        box-shadow:0 12px 32px rgba(15,23,42,.14);padding:6px;
      }
      .ig-bank-picker__menu[hidden]{display:none !important}
      .ig-bank-picker__option{
        width:100%;display:flex;align-items:center;gap:10px;
        padding:8px 10px;border:0;border-radius:10px;background:transparent;
        font:inherit;text-align:left;cursor:pointer;
      }
      .ig-bank-picker__option img{
        width:28px;height:28px;object-fit:contain;border-radius:6px;background:#f8fafc;flex-shrink:0;
      }
      .ig-bank-picker__option span{display:flex;flex-direction:column;line-height:1.25}
      .ig-bank-picker__option strong{font-size:.86rem;color:#0f172a}
      .ig-bank-picker__option em{font-style:normal;font-size:.72rem;color:#64748b}
      .ig-bank-picker__option:hover,
      .ig-bank-picker__option.is-selected{background:#f0fdf4}

      .identity-gate-preview{
        margin-top:8px;border:1px solid var(--border);border-radius:10px;
        background:#f8fafc;padding:8px;text-align:center;
      }
      .identity-gate-preview img{
        display:block;max-width:100%;max-height:140px;margin:0 auto;
        object-fit:contain;border-radius:8px;
      }
      .identity-gate-preview-pdf{margin:8px;font-size:.8rem;color:var(--text-muted)}

      .identity-gate-field{display:flex;flex-direction:column;gap:8px}
      .identity-gate-field > label:not(.identity-gate-file){
        display:block;margin:0;
        font-size:.8rem;font-weight:700;color:#334155
      }

      .identity-gate-field input:not([type=file]),
      .identity-gate-field select{
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
        display:flex;gap:8px;margin-top:6px;
      }
      .identity-gate-actions .identity-gate-primary,
      .identity-gate-actions .identity-gate-logout{flex:1}
      .identity-gate-actions--single{
        display:flex;justify-content:center;grid-template-columns:none;
        max-width:none;margin:12px auto 0;
      }
      .identity-gate-actions--single .identity-gate-logout{
        width:min(260px,100%);margin:0 auto;
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

      .identity-gate-primary[hidden],
      .identity-gate-logout[hidden]{display:none !important}
      .identity-gate-primary.is-idle,
      .identity-gate-primary:disabled{
        background:#e2e8f0;color:#64748b;box-shadow:none;cursor:not-allowed;
      }

      .identity-gate-logout{
        padding:11px 14px;border:1px solid var(--border);
        border-radius:10px;background:#fff;color:var(--text-muted);
        font:inherit;cursor:pointer;
      }

      .identity-gate-logout:hover{background:var(--bg-page);color:var(--text-dark)}
      .identity-gate-logout--full{width:100%;margin-top:4px}

      body.identity-gate-open{overflow:hidden}
    `;
    document.head.appendChild(style);
  }
};
