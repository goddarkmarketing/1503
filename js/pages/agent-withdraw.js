(function () {
  const form = document.getElementById('withdrawForm');
  const tbody = document.getElementById('withdrawRequestBody');
  if (!form || !tbody) return;

  const msgEl = document.getElementById('withdrawFormMessage');
  const noteInput = document.getElementById('withdrawNote');
  const noteCounter = document.getElementById('withdrawNoteCounter');
  const bankSelect = document.getElementById('withdrawBankCode');
  const amountInput = form.amount;
  const useAllBtn = document.getElementById('withdrawUseAll');
  const submitBtn = form.querySelector('button[type="submit"]');
  let available = 0;

  function formatMoney(n) {
    return App.Shell.formatCurrency(n);
  }

  function statusLabel(status) {
    return { pending: 'รอโอน', paid: 'โอนแล้ว', rejected: 'ปฏิเสธ' }[status] || status;
  }

  function setMessage(text, type) {
    if (!msgEl) return;
    msgEl.textContent = text || '';
    msgEl.className = 'finance-form-message' + (type ? ` is-${type}` : '');
    msgEl.hidden = !text;
  }

  function fillBanks() {
    if (!bankSelect || !App.ThaiBanks) return;
    bankSelect.innerHTML = '<option value="">เลือกธนาคาร</option>' +
      App.ThaiBanks.list().map((b) => `<option value="${b.code}">${b.name}</option>`).join('');
  }

  async function fillSavedBank() {
    const saved = await App.WithdrawService.getPayoutBank();
    if (!saved) return;
    if (saved.bankCode && bankSelect) bankSelect.value = saved.bankCode;
    if (saved.accountNo && form.accountNo) form.accountNo.value = saved.accountNo;
    if (saved.accountName && form.accountName) form.accountName.value = saved.accountName;
  }

  async function loadBalance(options = {}) {
    const balance = await App.WithdrawService.getBalance();
    available = Number(balance.available) || 0;
    const reserved = (Number(balance.paid) || 0) + (Number(balance.pending) || 0);
    const hasPending = (Number(balance.pending) || 0) > 0;
    const el = (id) => document.getElementById(id);
    if (el('statWithdrawEarned')) el('statWithdrawEarned').textContent = formatMoney(balance.earned);
    if (el('statWithdrawReserved')) el('statWithdrawReserved').textContent = formatMoney(reserved);
    if (el('statWithdrawAvailable')) el('statWithdrawAvailable').textContent = formatMoney(available);
    if (amountInput) {
      amountInput.max = String(available);
      amountInput.placeholder = formatMoney(available);
      amountInput.disabled = hasPending || available < 100;
    }
    const hint = document.getElementById('withdrawAmountHint');
    if (hint) {
      hint.textContent = available >= 100
        ? `ถอนได้สูงสุด ${formatMoney(available)} บาท · ขั้นต่ำ 100 บาท`
        : 'ยอดที่ถอนได้ยังไม่ถึงขั้นต่ำ 100 บาท';
    }
    if (useAllBtn) {
      useAllBtn.hidden = hasPending || available < 100;
      useAllBtn.disabled = hasPending || available < 100;
    }
    if (submitBtn) submitBtn.disabled = hasPending || available < 100;
    if (options.announce) {
      if (hasPending) setMessage('มีคำขอถอนเงินที่รอโอนอยู่แล้ว กรุณารอแอดมินดำเนินการก่อน', 'error');
      else if (available < 100) setMessage('ยอดค่าคอมที่ถอนได้ยังไม่ถึงขั้นต่ำ 100 บาท', 'error');
    }
  }

  async function loadRequests() {
    App.TableUI.showLoading(tbody, 6);
    const list = await App.WithdrawService.getRequests();
    if (!list.length) {
      App.TableUI.showEmpty(tbody, 6, 'ยังไม่มีคำขอถอนเงิน');
      return;
    }
    tbody.innerHTML = list.map((r) => `
      <tr>
        <td>${App.AdminUtils.formatDateTime(r.createdAt)}</td>
        <td class="col-money">${formatMoney(r.amount)}</td>
        <td>
          <div class="credit-pay-cell">
            <strong>${r.bankName || r.bankCode || '-'}</strong>
            <span>${r.accountNo || '-'}</span>
          </div>
        </td>
        <td>${App.CreditSlip ? App.CreditSlip.buttonHtml(r) : '-'}</td>
        <td><span class="status-pill ${r.status === 'paid' ? 'paid' : r.status}">${statusLabel(r.status)}</span></td>
        <td>${r.reviewedAt ? App.AdminUtils.formatDateTime(r.reviewedAt) : '-'}</td>
      </tr>
    `).join('');
    App.CreditSlip?.bindButtons(tbody, list);
  }

  noteInput?.addEventListener('input', () => {
    if (noteCounter) noteCounter.textContent = `${noteInput.value.length} / 200`;
  });

  useAllBtn?.addEventListener('click', () => {
    if (!amountInput || available < 100) return;
    amountInput.value = available.toFixed(2);
    setMessage('');
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setMessage('');
    const amount = Number(form.amount.value);
    if (amount > available) {
      setMessage(`ถอนได้ไม่เกิน ${formatMoney(available)} บาท`, 'error');
      return;
    }
    try {
      await App.ButtonUI.withLoading(submitBtn, async () => {
        await App.WithdrawService.create({
          amount,
          bankCode: form.bankCode.value,
          accountNo: form.accountNo.value.trim(),
          accountName: form.accountName.value.trim(),
          note: form.note.value.trim()
        });
        form.amount.value = '';
        form.note.value = '';
        if (noteCounter) noteCounter.textContent = '0 / 200';
        setMessage('ส่งคำขอถอนเงินแล้ว รอแอดมินโอนและแนบสลิป', 'success');
        await loadBalance();
        await loadRequests();
      }, { label: 'กำลังส่ง...' });
    } catch (err) {
      setMessage(err.message || 'ส่งคำขอไม่สำเร็จ', 'error');
    }
  });

  fillBanks();
  fillSavedBank();
  loadBalance({ announce: true });
  loadRequests();
  if (window.lucide) lucide.createIcons();
})();
