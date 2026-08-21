let agentsCache = [];

document.addEventListener('DOMContentLoaded', async () => {
  const root = document.getElementById('agentNewPageRoot');
  if (!root) return;

  try {
    agentsCache = await App.AgentService.getAgents();
  } catch (err) {
    root.innerHTML = `
      <div class="admin-toolbar agent-page__toolbar">
        <div>
          <a class="agent-page__back" href="agents"><i data-lucide="arrow-left"></i> กลับไปจัดการนายหน้า</a>
          <h1 class="admin-page-title">เพิ่มนายหน้า</h1>
          <p class="admin-hint">${escapeHtml(err.message || 'โหลดข้อมูลไม่สำเร็จ')}</p>
        </div>
      </div>
    `;
    if (typeof lucide !== 'undefined') lucide.createIcons();
    return;
  }

  renderNewAgentPage(root);
  if (typeof lucide !== 'undefined') lucide.createIcons();
});

function teamMemberLimit() {
  return Number(App.Config?.TEAM_MEMBER_LIMIT) || 2;
}

function generateNextAgentCode() {
  const usedCodes = new Set((agentsCache || []).map((a) => a?.code).filter(Boolean));
  const codeRe = /^([A-Za-z]+)(\d+)-(\d+)$/;

  let maxGroup = 0;
  let maxSeq = 0;
  const prefixCounts = {};

  for (const code of usedCodes) {
    const m = String(code).match(codeRe);
    if (!m) continue;
    const prefix = m[1];
    const group = Number(m[2]);
    const seq = Number(m[3]);
    prefixCounts[prefix] = (prefixCounts[prefix] || 0) + 1;
    if (Number.isFinite(group)) maxGroup = Math.max(maxGroup, group);
    if (Number.isFinite(seq)) maxSeq = Math.max(maxSeq, seq);
  }

  const prefix = Object.entries(prefixCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Ag';
  const nextGroup = (maxGroup || 0) + 1;
  const baseSeq = (maxSeq || 0) + 1;
  const pad3 = (n) => String(n).padStart(3, '0');

  for (let i = 0; i < 100; i++) {
    const candidate = `${prefix}${nextGroup}-${pad3(baseSeq + i)}`;
    if (!usedCodes.has(candidate)) return candidate;
  }

  const fallbackSeq = baseSeq + (Date.now() % 1000);
  return `${prefix}${nextGroup}-${pad3(fallbackSeq)}`;
}

function parentOptionsHtml(selectedParentId) {
  const limit = teamMemberLimit();
  const options = (agentsCache || [])
    .filter((a) => a.status !== 'inactive')
    .filter((a) => {
      if (a.id === selectedParentId) return true;
      const taken = (agentsCache || []).filter((m) => m.parentId === a.id).length;
      return taken < limit;
    })
    .map((a) => {
      const selected = a.id === selectedParentId ? ' selected' : '';
      return `<option value="${a.id}"${selected}>${escapeHtml(a.code)} — ${escapeHtml(a.name)}</option>`;
    })
    .join('');

  return `
    <option value="">ไม่ขึ้นกับใคร — เป็นหัวทีม</option>
    ${options}
  `;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function generateRandomPassword(length = 10) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const bytes = new Uint32Array(length);
  if (window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < length; i++) bytes[i] = Math.floor(Math.random() * chars.length);
  }
  let out = '';
  for (let i = 0; i < length; i++) {
    out += chars[bytes[i] % chars.length];
  }
  return out;
}

function renderNewAgentPage(root) {
  root.innerHTML = `
    <div class="admin-toolbar agent-page__toolbar">
      <div>
        <a class="agent-page__back" href="agents"><i data-lucide="arrow-left"></i> กลับไปจัดการนายหน้า</a>
        <h1 class="admin-page-title">เพิ่มนายหน้าใหม่</h1>
        <p class="admin-hint">สร้างบัญชีนายหน้า พร้อมวงเงิน ทีม และค่าคอมเบื้องต้น</p>
      </div>
    </div>
    <div class="agent-page__body">
      <form id="addAgentForm" class="agent-form" novalidate>
        <section class="agent-form__section">
          <div class="agent-form__sectionHead">
            <h3 class="agent-form__sectionTitle">ข้อมูลบัญชี</h3>
            <span class="agent-form__sectionBadge">จำเป็น</span>
          </div>
          <div class="agent-form__grid">
            <div class="form-field">
              <label for="addCode">รหัสนายหน้า <span class="form-req" aria-hidden="true">*</span></label>
              <input id="addCode" name="code" required autocomplete="off" placeholder="เช่น Ag4-301" spellcheck="false">
              <span class="form-field__hint">ระบบจะสร้างรหัสให้โดยอัตโนมัติ ใช้เป็น Username เข้าสู่ระบบ</span>
            </div>
            <div class="form-field">
              <label for="addPassword">รหัสผ่านเริ่มต้น <span class="form-req" aria-hidden="true">*</span></label>
              <div class="form-field__with-action">
                <input id="addPassword" name="password" required value="demo" autocomplete="new-password" spellcheck="false">
                <button type="button" class="btn-secondary btn-sm" id="btnGeneratePassword" title="สุ่มรหัสผ่าน">สุ่มรหัส</button>
              </div>
              <span class="form-field__hint">แอดมินเป็นผู้ตั้งรหัสผ่าน — นายหน้าเปลี่ยนเองไม่ได้</span>
            </div>
            <div class="form-field full">
              <label for="addName">ชื่อ-นามสกุล <span class="form-req" aria-hidden="true">*</span></label>
              <input id="addName" name="name" required autocomplete="name" placeholder="ชื่อจริง นามสกุล">
            </div>
          </div>
        </section>

        <section class="agent-form__section">
          <div class="agent-form__sectionHead">
            <h3 class="agent-form__sectionTitle">ข้อมูลติดต่อ</h3>
            <span class="agent-form__sectionBadge agent-form__sectionBadge--muted">ไม่บังคับ</span>
          </div>
          <div class="agent-form__grid">
            <div class="form-field">
              <label for="addEmail">อีเมล</label>
              <input id="addEmail" name="email" type="email" autocomplete="email" placeholder="name@example.com">
            </div>
            <div class="form-field">
              <label for="addPhone">โทรศัพท์</label>
              <input id="addPhone" name="phone" inputmode="tel" autocomplete="tel" placeholder="08x-xxx-xxxx">
            </div>
          </div>
        </section>

        <section class="agent-form__section">
          <div class="agent-form__sectionHead">
            <h3 class="agent-form__sectionTitle">วงเงิน</h3>
          </div>
          <div class="agent-form__grid">
            <div class="form-field">
              <label for="addInitialBalance">วงเงินเริ่มต้น (บาท)</label>
              <input id="addInitialBalance" name="initialBalance" type="number" min="0" step="0.01" value="0">
              <span class="form-field__hint">ยอดคงเหลือตอนเปิดบัญชี</span>
            </div>
            <div class="form-field">
              <label for="addCreditLimit">วงเงินสูงสุด (บาท)</label>
              <input id="addCreditLimit" name="creditLimit" type="number" min="0" step="0.01" value="50000">
              <span class="form-field__hint">Credit Limit ของบัญชีนี้</span>
            </div>
          </div>
        </section>

        <section class="agent-form__section">
          <div class="agent-form__sectionHead">
            <h3 class="agent-form__sectionTitle">โครงสร้างทีม</h3>
            <span class="agent-form__sectionBadge agent-form__sectionBadge--muted">ไม่บังคับ</span>
          </div>
          <div class="agent-form__grid">
            <div class="form-field full">
              <label for="teamParentId">ขึ้นกับหัวหน้าคนไหน?</label>
              <select id="teamParentId" name="parentId">
                ${parentOptionsHtml('')}
              </select>
              <span class="form-field__hint">พิมพ์ค้นหารหัสหรือชื่อได้ · ไม่เลือก = เป็นหัวทีมเอง</span>
            </div>
          </div>
        </section>

        ${App.AgentCommissionRates ? App.AgentCommissionRates.renderQuickCommissionBlock() : ''}
        <details class="agent-form__advanced" open>
          <summary>ค่าคอมรายบริษัท / หักภาษี (ขั้นสูง)</summary>
          ${App.AgentCommissionRates ? App.AgentCommissionRates.renderDetailedCommissionSections() : ''}
        </details>

        <div class="agent-page__actions">
          <a class="btn-secondary" href="agents">ยกเลิก</a>
          <button type="button" class="btn-primary" id="confirmAdd">สร้างบัญชี</button>
        </div>
      </form>
    </div>
  `;

  const form = root.querySelector('#addAgentForm');
  const codeInput = root.querySelector('#addCode');
  if (codeInput) {
    codeInput.value = generateNextAgentCode();
    codeInput.readOnly = true;
    codeInput.setAttribute('aria-readonly', 'true');
    codeInput.focus();
  }

  const passwordInput = root.querySelector('#addPassword');
  root.querySelector('#btnGeneratePassword')?.addEventListener('click', () => {
    if (!passwordInput) return;
    passwordInput.value = generateRandomPassword();
    passwordInput.focus();
    passwordInput.select();
  });

  if (typeof SearchableSelect !== 'undefined') {
    SearchableSelect.create(root.querySelector('#teamParentId'), {
      placeholder: 'ค้นหาหัวหน้า (รหัส/ชื่อ) หรือเว้นว่าง = หัวทีม',
      includeEmpty: true
    });
  }

  App.AgentCommissionRates?.bindForm(root);

  root.querySelector('#confirmAdd')?.addEventListener('click', async () => {
    const btn = root.querySelector('#confirmAdd');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    try {
      await App.ButtonUI.withLoading(btn, async () => {
        const codeEl = root.querySelector('#addCode');
        const buildPayload = () => {
          App.AgentCommissionRates?.applyQuickRatesFromForm(form);
          return {
            code: String(codeEl?.value || form.code.value || '').trim(),
            name: form.name.value.trim(),
            email: form.email.value.trim(),
            phone: form.phone.value.trim(),
            initialBalance: parseFloat(form.initialBalance.value) || 0,
            creditLimit: parseFloat(form.creditLimit.value) || 50000,
            password: form.password.value || 'demo',
            parentId: form.parentId?.value || null,
            featurePermissions: App.AgentFeatures?.defaultPermissions?.(),
            commissionRates: App.AgentCommissionRates?.readFromForm(form)
          };
        };

        let created;
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            created = await App.AgentService.createAgent(buildPayload());
            break;
          } catch (err) {
            const msg = err?.message || '';
            if (msg.includes('รหัสนายหน้านี้มีอยู่แล้ว') && codeEl && attempt === 0) {
              codeEl.value = generateNextAgentCode();
              continue;
            }
            throw err;
          }
        }

        App.AdminUtils.showToast(`สร้างบัญชี ${created?.code || form.code.value.trim()} เรียบร้อยแล้ว`);
        window.location.href = 'agents';
      }, { label: 'กำลังสร้าง...' });
    } catch (err) {
      App.AdminUtils.showToast(err?.message || 'สร้างบัญชีไม่สำเร็จ', 'error');
    }
  });
}
