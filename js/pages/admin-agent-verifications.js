(function () {
  const tbody = document.getElementById('identityVerificationsBody');
  if (!tbody) return;

  const filter = document.getElementById('identityFilter');
  let cache = [];
  const blobUrls = [];

  function statusLabel(s) {
    return { pending: 'รอตรวจสอบ', approved: 'ยืนยันแล้ว', rejected: 'ปฏิเสธ' }[s] || s;
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function revokeBlobs() {
    blobUrls.splice(0).forEach((url) => URL.revokeObjectURL(url));
  }

  async function fillDocFrame(el, path, title) {
    if (!el) return;
    if (!path) {
      el.innerHTML = '<div class="identity-review-empty">ไม่มีไฟล์แนบ</div>';
      return;
    }
    try {
      const blob = await App.API.requestBlob(path);
      const url = URL.createObjectURL(blob);
      blobUrls.push(url);
      if (blob.type === 'application/pdf') {
        el.innerHTML = `<embed src="${url}" type="application/pdf" title="${escapeHtml(title)}">`;
        return;
      }
      el.innerHTML = `<img src="${url}" alt="${escapeHtml(title)}">`;
    } catch (err) {
      el.innerHTML = `<div class="identity-review-empty">${escapeHtml(err.message || 'โหลดเอกสารไม่สำเร็จ')}</div>`;
    }
  }

  function setBusy(busy) {
    const approveBtn = document.getElementById('approveIdentityBtn');
    const rejectBtn = document.getElementById('rejectIdentityBtn');
    if (approveBtn) {
      approveBtn.disabled = busy;
      if (busy) approveBtn.textContent = 'กำลังบันทึก...';
      else approveBtn.textContent = 'อนุมัติ';
    }
    if (rejectBtn) {
      rejectBtn.disabled = busy;
      if (busy) rejectBtn.textContent = 'กำลังบันทึก...';
      else rejectBtn.textContent = 'ปฏิเสธ';
    }
  }

  function openReviewModal(req) {
    const isPending = req.status === 'pending';
    revokeBlobs();
    const overlay = App.Modal.open({
      title: `ยืนยันตัวตน ${req.agentCode || req.agentId}`,
      size: 'wide',
      body: `
        <dl class="credit-review__dl identity-review__dl">
          <div><dt>ชื่อ-นามสกุล</dt><dd>${escapeHtml(req.name)}</dd></div>
          <div><dt>อีเมล</dt><dd>${escapeHtml(req.email || '-')}</dd></div>
          <div><dt>โทรศัพท์</dt><dd>${escapeHtml(req.phone || '-')}</dd></div>
          <div><dt>วันที่ส่ง</dt><dd>${App.AdminUtils.formatDateTime(req.submittedAt)}</dd></div>
          <div><dt>ธนาคาร</dt><dd>${escapeHtml(req.payoutBankName || req.payoutBankCode || '-')}</dd></div>
          <div><dt>เลขที่บัญชี</dt><dd>${escapeHtml(req.payoutAccountNo || '-')}</dd></div>
          <div class="identity-review__note"><dt>ชื่อบัญชี</dt><dd>${escapeHtml(req.payoutAccountName || '-')}</dd></div>
          ${req.adminNote ? `<div class="identity-review__note"><dt>หมายเหตุ</dt><dd>${escapeHtml(req.adminNote)}</dd></div>` : ''}
        </dl>
        <div class="identity-review-docs">
          <figure class="identity-review-doc">
            <figcaption>สำเนาบัตรประชาชน</figcaption>
            <div class="identity-review-frame" id="identityIdPreview">
              <div class="identity-review-empty">กำลังโหลด...</div>
            </div>
          </figure>
          <figure class="identity-review-doc">
            <figcaption>รูปหน้าบัญชีธนาคาร</figcaption>
            <div class="identity-review-frame" id="identityBankPreview">
              <div class="identity-review-empty">กำลังโหลด...</div>
            </div>
          </figure>
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

    fillDocFrame(overlay.querySelector('#identityIdPreview'), req.idCardUrl, 'สำเนาบัตรประชาชน');
    fillDocFrame(overlay.querySelector('#identityBankPreview'), req.bankAccountUrl, 'หน้าบัญชีธนาคาร');

    overlay.querySelector('#approveIdentityBtn')?.addEventListener('click', async () => {
      if (!window.confirm(`อนุมัติการยืนยันตัวตนของ ${req.agentCode || req.name}?`)) return;
      setBusy(true);
      try {
        await App.AgentIdentityService.approve(req.id);
        App.Modal.close();
        await load();
        App.AdminNotificationService?.acknowledge?.('agent-verifications');
        alert('อนุมัติแล้ว นายหน้าสามารถใช้งานระบบได้');
      } catch (err) {
        setBusy(false);
        alert(err.message || 'อนุมัติไม่สำเร็จ');
      }
    });

    overlay.querySelector('#rejectIdentityBtn')?.addEventListener('click', async () => {
      const note = overlay.querySelector('#rejectNote')?.value?.trim() || '';
      if (!note) {
        alert('กรุณาระบุเหตุผลเมื่อปฏิเสธ');
        overlay.querySelector('#rejectNote')?.focus();
        return;
      }
      if (!window.confirm('ยืนยันปฏิเสธคำขอนี้?')) return;
      setBusy(true);
      try {
        await App.AgentIdentityService.reject(req.id, note);
        App.Modal.close();
        await load();
        App.AdminNotificationService?.acknowledge?.('agent-verifications');
        alert('ปฏิเสธคำขอแล้ว');
      } catch (err) {
        setBusy(false);
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
        <td><span class="status-pill ${escapeHtml(req.status)} status-pill--${escapeHtml(req.status)}">${statusLabel(req.status)}</span></td>
        <td><button type="button" class="btn-text btn-review-identity" data-id="${escapeHtml(req.id)}">ตรวจสอบ</button></td>
      </tr>
    `).join('');

    tbody.querySelectorAll('.btn-review-identity').forEach((btn) => {
      btn.addEventListener('click', () => {
        const req = cache.find((r) => String(r.id) === String(btn.dataset.id));
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
  App.AdminNotificationService?.acknowledgeCurrentPage?.('admin/agent-verifications');
})();
