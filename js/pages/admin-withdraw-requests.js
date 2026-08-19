(function () {
  const tbody = document.getElementById('withdrawRequestsBody');
  if (!tbody) return;

  const filter = document.getElementById('withdrawRequestFilter');
  let requestCache = [];

  function statusLabel(s) {
    return { pending: 'รอโอน', paid: 'โอนแล้ว', rejected: 'ปฏิเสธ' }[s] || s;
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function pillClass(status) {
    if (status === 'paid') return 'paid';
    return status;
  }

  function openReviewModal(req) {
    const isPending = req.status === 'pending';
    let selectedSlip = null;

    App.Modal.open({
      title: `คำขอถอนเงิน ${req.id}`,
      size: 'wide',
      body: `
        <div class="credit-review">
          <div class="credit-review__grid">
            <div class="credit-review__card">
              <h3>ข้อมูลคำขอ</h3>
              <dl class="credit-review__dl">
                <div><dt>นายหน้า</dt><dd>${escapeHtml(req.agentCode)} — ${escapeHtml(req.agentName || '')}</dd></div>
                <div><dt>จำนวนเงิน</dt><dd class="credit-review__amount">${App.Shell.formatCurrency(req.amount)} บาท</dd></div>
                <div><dt>ค่าคอมสะสม</dt><dd>${App.Shell.formatCurrency(req.commissionEarned || 0)} บาท</dd></div>
                <div><dt>ถอนได้ (ก่อนรายการนี้)</dt><dd>${App.Shell.formatCurrency(req.commissionAvailable || 0)} บาท</dd></div>
                <div><dt>วันที่ขอ</dt><dd>${App.AdminUtils.formatDateTime(req.createdAt)}</dd></div>
                <div><dt>สถานะ</dt><dd><span class="status-pill ${pillClass(req.status)}">${statusLabel(req.status)}</span></dd></div>
                <div><dt>หมายเหตุ</dt><dd>${escapeHtml(req.note || '-')}</dd></div>
              </dl>
              ${isPending && req.commissionAvailable != null && Number(req.amount) > Number(req.commissionAvailable)
                ? '<p class="admin-hint" style="color:var(--accent-red);margin:12px 0 0">ยอดนี้เกินค่าคอมที่ถอนได้ — ไม่สามารถบันทึกว่าโอนแล้ว</p>'
                : ''}
            </div>
            <div class="credit-review__card">
              <h3>บัญชีที่โอนเข้า (ของนายหน้า)</h3>
              <dl class="credit-review__dl">
                <div><dt>ธนาคาร</dt><dd>${escapeHtml(req.bankName || '-')}</dd></div>
                <div><dt>เลขบัญชี</dt><dd>${escapeHtml(req.accountNo || '-')}</dd></div>
                <div><dt>ชื่อบัญชี</dt><dd>${escapeHtml(req.accountName || '-')}</dd></div>
              </dl>
            </div>
          </div>
          ${isPending ? `
            <div class="form-field" style="margin-top:16px">
              <label for="withdrawPaySlip">หลักฐานการโอนเงิน <span class="req">*</span></label>
              <p class="admin-hint" style="margin:0 0 8px">โอนเข้าบัญชีด้านบนแล้วแนบสลิป นายหน้าจะเห็นหลักฐานนี้</p>
              <label class="adjust-slip-upload" id="withdrawPaySlipUpload" for="withdrawPaySlip">
                <input type="file" id="withdrawPaySlip" accept="image/jpeg,image/png,image/webp,application/pdf" hidden>
                <span>คลิกเพื่ออัปโหลดสลิป (JPG, PNG, WEBP, PDF สูงสุด 5 MB)</span>
              </label>
              <div class="adjust-slip-preview" id="withdrawPaySlipPreview" hidden>
                <img id="withdrawPaySlipImg" alt="ตัวอย่างสลิป">
                <div class="adjust-slip-preview__meta">
                  <span id="withdrawPaySlipName">-</span>
                </div>
              </div>
            </div>
          ` : (App.CreditSlip.hasSlip(req)
            ? `<p class="admin-hint" style="margin-top:16px"><button type="button" class="btn-text" id="withdrawViewPaidSlip">ดูสลิปที่โอนแล้ว</button></p>`
            : '')}
        </div>
      `,
      footer: isPending
        ? `<button type="button" class="btn-secondary" data-dismiss>ปิด</button>
           <button type="button" class="btn-danger" id="withdrawReject">ปฏิเสธ</button>
           <button type="button" class="btn-primary" id="withdrawPay">บันทึกว่าโอนแล้ว</button>`
        : '<button type="button" class="btn-secondary" data-dismiss>ปิด</button>'
    });

    const overlay = App.Modal.getEl();
    overlay?.querySelector('[data-dismiss]')?.addEventListener('click', () => App.Modal.close());
    overlay?.querySelector('#withdrawViewPaidSlip')?.addEventListener('click', () => App.CreditSlip.open(req));

    overlay?.querySelector('#withdrawPaySlip')?.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        selectedSlip = await App.CreditSlip.readFile(file);
        const preview = overlay.querySelector('#withdrawPaySlipPreview');
        const img = overlay.querySelector('#withdrawPaySlipImg');
        const nameEl = overlay.querySelector('#withdrawPaySlipName');
        if (preview) preview.hidden = false;
        if (nameEl) nameEl.textContent = selectedSlip.fileName;
        if (img) {
          if (selectedSlip.mimeType === 'application/pdf') {
            img.hidden = true;
            img.removeAttribute('src');
          } else {
            img.hidden = false;
            img.src = selectedSlip.dataUrl;
          }
        }
        overlay.querySelector('#withdrawPaySlipUpload')?.classList.add('has-file');
      } catch (err) {
        selectedSlip = null;
        App.AdminUtils.showToast(err.message || 'อัปโหลดสลิปไม่สำเร็จ', 'error');
      }
    });

    overlay?.querySelector('#withdrawPay')?.addEventListener('click', async () => {
      if (!selectedSlip) {
        App.AdminUtils.showToast('กรุณาแนบหลักฐานการโอนเงิน', 'error');
        return;
      }
      const btn = overlay.querySelector('#withdrawPay');
      try {
        await App.ButtonUI.withLoading(btn, async () => {
          await App.WithdrawService.review(req.id, 'pay', { slip: selectedSlip });
          await App.AdminNotificationService?.acknowledge('withdraw-requests');
          App.Modal.close();
          App.AdminUtils.showToast(`โอนเงิน ${req.agentCode} แล้ว นายหน้าเห็นสลิปได้`);
          await load();
        }, { label: 'กำลังบันทึก...' });
      } catch (err) {
        App.AdminUtils.showToast(err.message || 'บันทึกไม่สำเร็จ', 'error');
      }
    });

    overlay?.querySelector('#withdrawReject')?.addEventListener('click', async () => {
      if (!confirm('ปฏิเสธคำขอถอนเงินนี้?')) return;
      try {
        await App.WithdrawService.review(req.id, 'reject');
        await App.AdminNotificationService?.acknowledge('withdraw-requests');
        App.Modal.close();
        App.AdminUtils.showToast('ปฏิเสธคำขอแล้ว');
        await load();
      } catch (err) {
        App.AdminUtils.showToast(err.message || 'ดำเนินการไม่สำเร็จ', 'error');
      }
    });
  }

  async function load() {
    App.TableUI.showLoading(tbody, 7);
    try {
      requestCache = await App.WithdrawService.getAll({
        status: filter?.value || undefined
      });
    } catch (err) {
      requestCache = [];
      App.TableUI.showEmpty(tbody, 7, err.message || 'โหลดรายการไม่สำเร็จ');
      App.AdminUtils.showToast(err.message || 'โหลดรายการไม่สำเร็จ', 'error');
      return;
    }
    if (!requestCache.length) {
      App.TableUI.showEmpty(tbody, 7);
      return;
    }
    tbody.innerHTML = requestCache.map((r) => `
      <tr>
        <td>${App.AdminUtils.formatDateTime(r.createdAt)}</td>
        <td>
          <div class="admin-agent-cell">
            <span class="admin-agent-cell__code">${escapeHtml(r.agentCode)}</span>
            <span class="admin-agent-cell__name">${escapeHtml(r.agentName || '')}</span>
          </div>
        </td>
        <td class="col-money">${App.Shell.formatCurrency(r.amount)}</td>
        <td>
          <div class="credit-pay-cell">
            <strong>${escapeHtml(r.bankName || '-')}</strong>
            <span>${escapeHtml(r.accountNo || '-')}</span>
          </div>
        </td>
        <td>${App.CreditSlip ? App.CreditSlip.buttonHtml(r) : '-'}</td>
        <td><span class="status-pill ${pillClass(r.status)}">${statusLabel(r.status)}</span></td>
        <td>
          <button type="button" class="btn-secondary btn-sm btn-review-withdraw" data-id="${escapeHtml(r.id)}">
            ${r.status === 'pending' ? 'โอนเงิน' : 'ดูรายละเอียด'}
          </button>
        </td>
      </tr>
    `).join('');
    App.CreditSlip?.bindButtons(tbody, requestCache);
    tbody.querySelectorAll('.btn-review-withdraw').forEach((btn) => {
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
