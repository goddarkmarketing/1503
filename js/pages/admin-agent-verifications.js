(function () {
  const tbody = document.getElementById('identityVerificationsBody');
  if (!tbody) return;

  const filter = document.getElementById('identityFilter');
  let cache = [];

  function statusLabel(s) {
    return { pending: 'รอตรวจสอบ', approved: 'อนุมัติแล้ว', rejected: 'ปฏิเสธ' }[s] || s;
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  async function openDoc(path, title) {
    const blob = await App.API.requestBlob(path);
    const url = URL.createObjectURL(blob);
    const isPdf = blob.type === 'application/pdf';
    App.Modal.open({
      title,
      size: 'wide',
      body: isPdf
        ? `<embed src="${url}" type="application/pdf" style="width:100%;height:70vh;border:0">`
        : `<img src="${url}" alt="${escapeHtml(title)}" style="max-width:100%;height:auto;display:block;margin:0 auto">`
    });
  }

  function openReviewModal(req) {
    const isPending = req.status === 'pending';
    App.Modal.open({
      title: `ยืนยันตัวตน ${req.agentCode || req.agentId}`,
      size: 'wide',
      body: `
        <dl class="credit-review__dl">
          <div><dt>ชื่อ-นามสกุล</dt><dd>${escapeHtml(req.name)}</dd></div>
          <div><dt>อีเมล</dt><dd>${escapeHtml(req.email || '-')}</dd></div>
          <div><dt>โทรศัพท์</dt><dd>${escapeHtml(req.phone || '-')}</dd></div>
          <div><dt>วันที่ส่ง</dt><dd>${App.AdminUtils.formatDateTime(req.submittedAt)}</dd></div>
          ${req.adminNote ? `<div><dt>หมายเหตุ</dt><dd>${escapeHtml(req.adminNote)}</dd></div>` : ''}
        </dl>
        <div class="form-actions" style="margin-top:16px">
          ${req.hasBankAccountDoc ? `<button type="button" class="btn btn-secondary" id="viewBankDoc">ดูหน้าบัญชีธนาคาร</button>` : ''}
          ${req.hasIdCardDoc ? `<button type="button" class="btn btn-secondary" id="viewIdDoc">ดูสำเนาบัตร ปชช.</button>` : ''}
        </div>
        ${isPending ? `
          <form id="rejectIdentityForm" class="agent-form" style="margin-top:20px">
            <div class="form-field full">
              <label for="rejectNote">เหตุผลเมื่อปฏิเสธ</label>
              <textarea id="rejectNote" rows="2" placeholder="ระบุเหตุผล (จำเป็นเมื่อปฏิเสธ)"></textarea>
            </div>
          </form>
        ` : ''}
      `,
      footer: isPending ? `
        <button type="button" class="btn btn-secondary" data-modal-close>ปิด</button>
        <button type="button" class="btn btn-danger" id="rejectIdentityBtn">ปฏิเสธ</button>
        <button type="button" class="btn btn-primary" id="approveIdentityBtn">อนุมัติ</button>
      ` : `<button type="button" class="btn btn-secondary" data-modal-close>ปิด</button>`
    });

    document.getElementById('viewBankDoc')?.addEventListener('click', () => {
      openDoc(req.bankAccountUrl, 'หน้าบัญชีธนาคาร').catch((e) => alert(e.message));
    });
    document.getElementById('viewIdDoc')?.addEventListener('click', () => {
      openDoc(req.idCardUrl, 'สำเนาบัตรประชาชน').catch((e) => alert(e.message));
    });

    document.getElementById('approveIdentityBtn')?.addEventListener('click', async () => {
      try {
        await App.AgentIdentityService.approve(req.id);
        App.Modal.close();
        await load();
        App.AdminNotificationService.acknowledge('agent-verifications');
      } catch (err) {
        alert(err.message || 'อนุมัติไม่สำเร็จ');
      }
    });

    document.getElementById('rejectIdentityBtn')?.addEventListener('click', async () => {
      const note = document.getElementById('rejectNote')?.value?.trim() || '';
      if (!note) {
        alert('กรุณาระบุเหตุผลเมื่อปฏิเสธ');
        return;
      }
      try {
        await App.AgentIdentityService.reject(req.id, note);
        App.Modal.close();
        await load();
        App.AdminNotificationService.acknowledge('agent-verifications');
      } catch (err) {
        alert(err.message || 'ปฏิเสธไม่สำเร็จ');
      }
    });
  }

  function render() {
    const status = filter?.value || '';
    const rows = cache.filter((r) => !status || r.status === status);
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="table-empty">ไม่มีรายการ</td></tr>';
      return;
    }
    tbody.innerHTML = rows.map((req) => `
      <tr>
        <td>${App.AdminUtils.formatDateTime(req.submittedAt)}</td>
        <td>${escapeHtml(req.agentCode)}</td>
        <td>${escapeHtml(req.name)}</td>
        <td>${escapeHtml(req.phone || '-')}</td>
        <td><span class="status-pill status-pill--${req.status}">${statusLabel(req.status)}</span></td>
        <td><button type="button" class="btn-text btn-review-identity" data-id="${escapeHtml(req.id)}">ตรวจสอบ</button></td>
      </tr>
    `).join('');

    tbody.querySelectorAll('.btn-review-identity').forEach((btn) => {
      btn.addEventListener('click', () => {
        const req = cache.find((r) => r.id === btn.dataset.id);
        if (req) openReviewModal(req);
      });
    });
  }

  async function load() {
    tbody.innerHTML = '<tr><td colspan="6" class="table-empty">กำลังโหลด...</td></tr>';
    cache = await App.AgentIdentityService.getAll({ status: filter?.value || '' });
    render();
  }

  filter?.addEventListener('change', load);
  load();
  App.AdminNotificationService.acknowledgeCurrentPage('admin/agent-verifications');
})();
