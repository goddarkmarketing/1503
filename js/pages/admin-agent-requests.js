(function () {
  const tbody = document.getElementById('agentRequestsBody');
  if (!tbody) return;

  const filter = document.getElementById('agentRequestFilter');
  let requestCache = [];
  let agentsCache = [];

  function statusLabel(s) {
    return { pending: 'รออนุมัติ', approved: 'อนุมัติแล้ว', rejected: 'ปฏิเสธ' }[s] || s;
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
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
    return `${prefix}${nextGroup}-${pad3(baseSeq + (Date.now() % 1000))}`;
  }

  function parentOptionsHtml(selectedParentId, excludeId) {
    const options = (agentsCache || [])
      .filter((a) => a.id !== excludeId && a.status !== 'inactive')
      .map((a) => {
        const selected = a.id === selectedParentId ? ' selected' : '';
        return `<option value="${a.id}"${selected}>${escapeHtml(a.code)} — ${escapeHtml(a.name)}</option>`;
      })
      .join('');
    return `<option value="">ไม่ขึ้นกับใคร — เป็นหัวทีม</option>${options}`;
  }

  function openReviewModal(req) {
    const isPending = req.status === 'pending';

    App.Modal.open({
      title: `คำขอเพิ่มตัวแทน ${req.id}`,
      size: 'wide',
      body: isPending ? `
        <form id="approveAgentRequestForm" class="agent-form" novalidate>
          <p class="agent-form__intro">ตรวจสอบข้อมูลจากนายหน้า ${escapeHtml(req.requesterCode)} แล้วตั้งค่าบัญชีก่อนเปิดใช้งาน</p>
          <section class="agent-form__section">
            <div class="agent-form__sectionHead">
              <h3 class="agent-form__sectionTitle">ข้อมูลจากนายหน้า</h3>
            </div>
            <dl class="credit-review__dl">
              <div><dt>ชื่อ</dt><dd>${escapeHtml(req.name)}</dd></div>
              <div><dt>โทรศัพท์</dt><dd>${escapeHtml(req.phone || '-')}</dd></div>
              <div><dt>อีเมล</dt><dd>${escapeHtml(req.email || '-')}</dd></div>
              <div><dt>เลขบัตรประชาชน</dt><dd>${escapeHtml(req.idCard || '-')}</dd></div>
              <div><dt>วันเกิด</dt><dd>${escapeHtml(req.birthDate || '-')}</dd></div>
              <div><dt>ที่อยู่</dt><dd>${escapeHtml(req.address || '-')}</dd></div>
              <div><dt>วันที่ขอ</dt><dd>${App.AdminUtils.formatDateTime(req.createdAt)}</dd></div>
            </dl>
          </section>
          <section class="agent-form__section">
            <div class="agent-form__sectionHead">
              <h3 class="agent-form__sectionTitle">ตั้งค่าบัญชี</h3>
              <span class="agent-form__sectionBadge">จำเป็น</span>
            </div>
            <div class="agent-form__grid">
              <div class="form-field">
                <label for="approveCode">รหัสนายหน้า <span class="req">*</span></label>
                <input id="approveCode" name="code" required readonly>
              </div>
              <div class="form-field">
                <label for="approvePassword">รหัสผ่านเริ่มต้น <span class="req">*</span></label>
                <input id="approvePassword" name="password" required value="demo">
              </div>
              <div class="form-field full">
                <label for="approveName">ชื่อ-นามสกุล <span class="req">*</span></label>
                <input id="approveName" name="name" required value="${escapeHtml(req.name)}">
              </div>
              <div class="form-field">
                <label for="approveEmail">อีเมล</label>
                <input id="approveEmail" name="email" type="email" value="${escapeAttr(req.email && req.email !== '-' ? req.email : '')}">
              </div>
              <div class="form-field">
                <label for="approvePhone">โทรศัพท์</label>
                <input id="approvePhone" name="phone" value="${escapeAttr(req.phone && req.phone !== '-' ? req.phone : '')}">
              </div>
              <div class="form-field">
                <label for="approveInitialBalance">วงเงินเริ่มต้น</label>
                <input id="approveInitialBalance" name="initialBalance" type="number" min="0" step="0.01" value="0">
              </div>
              <div class="form-field">
                <label for="approveCreditLimit">วงเงินสูงสุด</label>
                <input id="approveCreditLimit" name="creditLimit" type="number" min="0" step="0.01" value="50000">
              </div>
              <div class="form-field full">
                <label for="approveParentId">ขึ้นกับหัวหน้า</label>
                <select id="approveParentId" name="parentId">${parentOptionsHtml(req.requesterAgentId, null)}</select>
              </div>
            </div>
          </section>
          ${App.AgentFeatures ? `
            <section class="agent-form__section">
              <div class="agent-form__sectionHead">
                <h3 class="agent-form__sectionTitle">สิทธิ์มองเห็นเมนู</h3>
              </div>
              ${App.AgentFeatures.renderPermissionsTable()}
            </section>
          ` : ''}
          ${App.AgentCommissionRates ? App.AgentCommissionRates.renderFormSection() : ''}
        </form>
      ` : `
        <div class="credit-review">
          <dl class="credit-review__dl">
            <div><dt>นายหน้าผู้แจ้ง</dt><dd>${escapeHtml(req.requesterCode)} — ${escapeHtml(req.requesterName || '')}</dd></div>
            <div><dt>ชื่อที่ขอ</dt><dd>${escapeHtml(req.name)}</dd></div>
            <div><dt>สถานะ</dt><dd><span class="status-pill ${req.status}">${statusLabel(req.status)}</span></dd></div>
            <div><dt>รหัสที่สร้าง</dt><dd>${escapeHtml(req.createdAgentCode || '-')}</dd></div>
            <div><dt>หมายเหตุแอดมิน</dt><dd>${escapeHtml(req.adminNote || '-')}</dd></div>
            <div><dt>วันที่ดำเนินการ</dt><dd>${req.reviewedAt ? App.AdminUtils.formatDateTime(req.reviewedAt) : '-'}</dd></div>
          </dl>
        </div>
      `,
      footer: isPending
        ? `<button type="button" class="btn-secondary" data-dismiss>ปิด</button>
           <button type="button" class="btn-danger" id="agentRequestReject">ปฏิเสธ</button>
           <button type="button" class="btn-primary" id="agentRequestApprove">อนุมัติและสร้างบัญชี</button>`
        : '<button type="button" class="btn-secondary" data-dismiss>ปิด</button>'
    });

    const overlay = App.Modal.getEl();
    overlay?.querySelector('[data-dismiss]')?.addEventListener('click', () => App.Modal.close());

    if (isPending) {
      const codeInput = overlay.querySelector('#approveCode');
      if (codeInput) codeInput.value = generateNextAgentCode();
      App.AgentCommissionRates?.bindForm(overlay);

      overlay.querySelector('#agentRequestApprove')?.addEventListener('click', async () => {
        const form = overlay.querySelector('#approveAgentRequestForm');
        if (!form.checkValidity()) {
          form.reportValidity();
          return;
        }
        const btn = overlay.querySelector('#agentRequestApprove');
        try {
          await App.ButtonUI.withLoading(btn, async () => {
            const payload = {
              code: form.code.value.trim(),
              name: form.name.value.trim(),
              password: form.password.value,
              email: form.email.value.trim(),
              phone: form.phone.value.trim(),
              initialBalance: parseFloat(form.initialBalance.value) || 0,
              creditLimit: parseFloat(form.creditLimit.value) || 50000,
              parentId: form.parentId.value || req.requesterAgentId,
              commissionRates: App.AgentCommissionRates?.readFromForm(form)
            };
            if (App.AgentFeatures) {
              payload.featurePermissions = App.AgentFeatures.readPermissionsFromForm(form);
            }
            await App.AgentRegistrationService.review(req.id, 'approve', payload);
            await App.AdminNotificationService?.acknowledge('agent-requests');
            App.Modal.close();
            App.AdminUtils.showToast(`สร้างบัญชี ${payload.code} เรียบร้อยแล้ว`);
            await load();
          }, { label: 'กำลังสร้าง...' });
        } catch (err) {
          App.AdminUtils.showToast(err.message || 'อนุมัติไม่สำเร็จ', 'error');
        }
      });

      overlay.querySelector('#agentRequestReject')?.addEventListener('click', async () => {
        const note = prompt('เหตุผลที่ปฏิเสธ (ไม่บังคับ)') || '';
        if (note === null) return;
        try {
          await App.AgentRegistrationService.review(req.id, 'reject', { adminNote: note });
          await App.AdminNotificationService?.acknowledge('agent-requests');
          App.Modal.close();
          App.AdminUtils.showToast('ปฏิเสธคำขอแล้ว');
          await load();
        } catch (err) {
          App.AdminUtils.showToast(err.message || 'ดำเนินการไม่สำเร็จ', 'error');
        }
      });
    }
  }

  function escapeAttr(str) {
    return escapeHtml(str).replace(/'/g, '&#39;');
  }

  async function load() {
    App.TableUI.showLoading(tbody, 6);
    try {
      agentsCache = await App.AgentService.getAgents();
      requestCache = await App.AgentRegistrationService.getAll({
        status: filter?.value || undefined
      });
    } catch (err) {
      requestCache = [];
      App.TableUI.showEmpty(tbody, 6, err.message || 'โหลดรายการไม่สำเร็จ');
      App.AdminUtils.showToast(err.message || 'โหลดรายการไม่สำเร็จ', 'error');
      return;
    }
    if (!requestCache.length) {
      App.TableUI.showEmpty(tbody, 6);
      return;
    }
    tbody.innerHTML = requestCache.map((r) => `
      <tr>
        <td>${App.AdminUtils.formatDateTime(r.createdAt)}</td>
        <td>
          <div class="admin-agent-cell">
            <span class="admin-agent-cell__code">${escapeHtml(r.requesterCode)}</span>
            <span class="admin-agent-cell__name">${escapeHtml(r.requesterName || '')}</span>
          </div>
        </td>
        <td>${escapeHtml(r.name)}</td>
        <td>${escapeHtml(r.phone || '-')}</td>
        <td><span class="status-pill ${r.status}">${statusLabel(r.status)}</span></td>
        <td>
          <button type="button" class="btn-secondary btn-sm btn-review-agent-request" data-id="${escapeHtml(r.id)}">
            ${r.status === 'pending' ? 'ตรวจสอบ' : 'ดูรายละเอียด'}
          </button>
        </td>
      </tr>
    `).join('');
    tbody.querySelectorAll('.btn-review-agent-request').forEach((btn) => {
      btn.addEventListener('click', () => {
        const req = requestCache.find((r) => r.id === btn.dataset.id);
        if (req) openReviewModal(req);
      });
    });
  }

  filter?.addEventListener('change', load);

  function init() {
    load();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
