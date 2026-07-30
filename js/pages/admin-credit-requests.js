(function () {
  const tbody = document.getElementById('creditRequestsBody');
  if (!tbody) return;

  const filter = document.getElementById('creditRequestFilter');
  let requestCache = [];

  function formatTransferAt(dateStr, timeStr) {
    if (!dateStr && !timeStr) return '-';
    if (!dateStr) return timeStr || '-';
    const [y, m, d] = String(dateStr).split('-');
    const thDate = (d && m && y) ? `${d}/${m}/${y}` : dateStr;
    return timeStr ? `${thDate} ${timeStr}` : thDate;
  }

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

  function openSlip(src, name) {
    if (!src) return;
    const isPdf = /\.pdf$/i.test(name || '') || String(src).startsWith('data:application/pdf');
    App.Modal.open({
      title: `หลักฐานการโอนเงิน${name ? ` — ${escapeHtml(name)}` : ''}`,
      size: 'wide',
      body: isPdf
        ? `<div class="credit-slip-modal credit-slip-modal--pdf"><embed src="${src}" type="application/pdf" width="100%" height="640"></div>`
        : `<div class="credit-slip-modal"><img src="${src}" alt="${escapeHtml(name || 'สลิปโอนเงิน')}"></div>`,
      footer: '<button type="button" class="btn-secondary" data-close-slip>ปิด</button>'
    });
    App.Modal.getEl()?.querySelector('[data-close-slip]')?.addEventListener('click', () => App.Modal.close());
  }

  function openReviewModal(req) {
    const isPending = req.status === 'pending';
    const isPdf = /\.pdf$/i.test(req.slipFileName || '') || String(req.slipDataUrl || '').startsWith('data:application/pdf');
    const slipBlock = req.slipDataUrl
      ? (isPdf
        ? `<div class="credit-review__slip credit-review__slip--pdf">
             <p>ไฟล์ PDF: ${escapeHtml(req.slipFileName || 'slip.pdf')}</p>
             <button type="button" class="btn-secondary btn-sm" data-open-slip>เปิดไฟล์สลิป</button>
           </div>`
        : `<div class="credit-review__slip">
             <img src="${req.slipDataUrl}" alt="สลิปโอนเงิน ${escapeHtml(req.slipFileName || '')}">
             <button type="button" class="btn-text" data-open-slip>เปิดภาพเต็ม</button>
           </div>`)
      : '<p class="admin-hint">ไม่มีหลักฐานสลิปแนบมา</p>';

    App.Modal.open({
      title: `ตรวจสอบคำขอ ${req.id}`,
      size: 'wide',
      body: `
        <div class="credit-review">
          <div class="credit-review__grid">
            <div class="credit-review__card">
              <h3>ข้อมูลคำขอ</h3>
              <dl class="credit-review__dl">
                <div><dt>นายหน้า</dt><dd>${escapeHtml(req.agentCode)}</dd></div>
                <div><dt>จำนวนเงิน</dt><dd class="credit-review__amount">${App.Shell.formatCurrency(req.amount)} บาท</dd></div>
                <div><dt>วันที่โอน</dt><dd>${escapeHtml(formatTransferAt(req.transferDate, req.transferTime))}</dd></div>
                <div><dt>วันที่ขอ</dt><dd>${App.AdminUtils.formatDateTime(req.createdAt)}</dd></div>
                <div><dt>สถานะ</dt><dd><span class="status-pill ${req.status}">${statusLabel(req.status)}</span></dd></div>
                <div><dt>หมายเหตุ</dt><dd>${escapeHtml(req.note || '-')}</dd></div>
              </dl>
            </div>
            <div class="credit-review__card">
              <h3>บัญชีที่โอนเข้า</h3>
              <dl class="credit-review__dl">
                <div><dt>ธนาคาร</dt><dd>${escapeHtml(req.bankName || '-')}</dd></div>
                <div><dt>เลขบัญชี</dt><dd>${escapeHtml(req.accountNo || '-')}</dd></div>
                <div><dt>ชื่อบัญชี</dt><dd>${escapeHtml(req.accountName || '-')}</dd></div>
              </dl>
            </div>
          </div>
          <div class="credit-review__card">
            <h3>หลักฐานการโอนเงิน</h3>
            ${slipBlock}
          </div>
          ${isPending ? '<p class="admin-hint" style="margin:12px 0 0">ตรวจสอบว่ายอดในสลิปตรงกับจำนวนที่ขอ แล้วจึงอนุมัติวงเงิน</p>' : ''}
        </div>
      `,
      footer: isPending
        ? `
          <button type="button" class="btn-secondary" data-close>ปิด</button>
          <button type="button" class="btn-danger" data-reject>ปฏิเสธ</button>
          <button type="button" class="btn-success" data-approve>อนุมัติวงเงิน</button>
        `
        : `<button type="button" class="btn-secondary" data-close>ปิด</button>`
    });

    const overlay = App.Modal.getEl();
    overlay?.querySelector('[data-close]')?.addEventListener('click', () => App.Modal.close());
    overlay?.querySelector('[data-open-slip]')?.addEventListener('click', () => {
      openSlip(req.slipDataUrl, req.slipFileName);
    });
    overlay?.querySelector('[data-approve]')?.addEventListener('click', async () => {
      const approveBtn = overlay.querySelector('[data-approve]');
      const rejectBtn = overlay.querySelector('[data-reject]');
      if (!confirm(`ยืนยันอนุมัติวงเงิน ${App.Shell.formatCurrency(req.amount)} บาท ให้ ${req.agentCode}?`)) return;
      await App.ButtonUI.withLoading(approveBtn, async () => {
        if (rejectBtn) rejectBtn.disabled = true;
        try {
          await App.CreditService.reviewRequest(req.id, 'approve');
          App.Modal.close();
          await load();
          await App.AdminNotificationService?.acknowledge('credit-requests');
          await App.AdminNotificationService?.applySidebarBadges(document.querySelector('.sidebar-nav[data-admin-sidebar]'));
          await App.Shell.refreshNotifications?.();
          App.AdminUtils.showToast(`อนุมัติวงเงิน ${req.agentCode} เรียบร้อยแล้ว`);
        } catch (err) {
          if (rejectBtn) rejectBtn.disabled = false;
          App.AdminUtils.showToast(err.message || 'อนุมัติวงเงินไม่สำเร็จ', 'error');
        }
      }, { label: 'กำลังอนุมัติ...' });
    });
    overlay?.querySelector('[data-reject]')?.addEventListener('click', async () => {
      const approveBtn = overlay.querySelector('[data-approve]');
      const rejectBtn = overlay.querySelector('[data-reject]');
      if (!confirm(`ยืนยันปฏิเสธคำขอ ${req.id}?`)) return;
      await App.ButtonUI.withLoading(rejectBtn, async () => {
        if (approveBtn) approveBtn.disabled = true;
        try {
          await App.CreditService.reviewRequest(req.id, 'reject');
          App.Modal.close();
          await load();
          await App.AdminNotificationService?.acknowledge('credit-requests');
          await App.AdminNotificationService?.applySidebarBadges(document.querySelector('.sidebar-nav[data-admin-sidebar]'));
          await App.Shell.refreshNotifications?.();
          App.AdminUtils.showToast(`ปฏิเสธคำขอ ${req.id} แล้ว`);
        } catch (err) {
          if (approveBtn) approveBtn.disabled = false;
          App.AdminUtils.showToast(err.message || 'ปฏิเสธคำขอไม่สำเร็จ', 'error');
        }
      }, { label: 'กำลังปฏิเสธ...' });
    });
  }

  async function load() {
    App.TableUI.showLoading(tbody, 7);
    const status = filter?.value || '';
    requestCache = await App.CreditService.getAllRequests(status ? { status } : {});
    if (!requestCache.length) {
      App.TableUI.showEmpty(tbody, 7, 'ไม่มีคำขอ');
      App.Shell.refreshNotifications?.();
      return;
    }

    tbody.innerHTML = requestCache.map((r) => `
      <tr data-id="${r.id}">
        <td>${App.AdminUtils.formatDateTime(r.createdAt)}</td>
        <td>${escapeHtml(r.agentCode)}</td>
        <td class="col-money">${App.Shell.formatCurrency(r.amount)}</td>
        <td>
          <div class="credit-pay-cell">
            <strong>${escapeHtml(r.bankName || 'โอนธนาคาร')}</strong>
            <span>${escapeHtml(r.accountNo || '-')}</span>
          </div>
        </td>
        <td>
          ${r.slipDataUrl
            ? `<button type="button" class="btn-text btn-slip-thumb" data-id="${r.id}">ดูสลิป</button>`
            : '-'}
        </td>
        <td><span class="status-pill ${r.status}">${statusLabel(r.status)}</span></td>
        <td>
          <div class="btn-group">
            <button type="button" class="btn-secondary btn-sm btn-review" data-id="${r.id}">
              ${r.status === 'pending' ? 'ตรวจสอบ' : 'รายละเอียด'}
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('.btn-review').forEach((btn) => {
      btn.addEventListener('click', () => {
        const req = requestCache.find((item) => item.id === btn.dataset.id);
        if (req) openReviewModal(req);
      });
    });

    tbody.querySelectorAll('.btn-slip-thumb').forEach((btn) => {
      btn.addEventListener('click', () => {
        const req = requestCache.find((item) => item.id === btn.dataset.id);
        if (req?.slipDataUrl) openSlip(req.slipDataUrl, req.slipFileName);
      });
    });
  }

  filter?.addEventListener('change', load);
  load();
})();
