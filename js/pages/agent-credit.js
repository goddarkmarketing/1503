(function () {
  const requestTbody = document.getElementById('creditRequestBody');
  const ledgerTbody = document.getElementById('creditLedgerBody');
  if (!requestTbody || !ledgerTbody) return;

  const form = document.getElementById('creditRequestForm');
  const msgEl = document.getElementById('creditFormMessage');
  const noteInput = document.getElementById('creditNote');
  const noteCounter = document.getElementById('creditNoteCounter');

  function formatMoney(n) {
    return App.Shell.formatCurrency(n);
  }

  function statusLabel(status) {
    return { pending: 'รออนุมัติ', approved: 'อนุมัติแล้ว', rejected: 'ปฏิเสธ' }[status] || status;
  }

  function updateNoteCounter() {
    if (!noteInput || !noteCounter) return;
    const len = noteInput.value.length;
    noteCounter.textContent = `${len} / 200`;
  }

  async function loadBalance() {
    const agentId = App.Session.getAgentId();
    const agent = await App.AgentService.getAgent(agentId);
    const balance = agent.balance || 0;
    const limit = agent.creditLimit || 0;
    const used = Math.max(0, limit - balance);
    const usedPct = limit > 0 ? (used / limit) * 100 : 0;
    const remainPct = limit > 0 ? Math.min(100, (balance / limit) * 100) : 0;

    const balanceEl = document.getElementById('financeBalance');
    const limitTextEl = document.getElementById('financeLimitText');
    const progressEl = document.getElementById('financeProgressFill');
    const usedAmountEl = document.getElementById('financeUsedAmount');
    const usedPctEl = document.getElementById('financeUsedPct');

    if (balanceEl) balanceEl.textContent = formatMoney(balance);
    if (limitTextEl) {
      limitTextEl.textContent = `${formatMoney(balance)} / ${formatMoney(limit)} บาท`;
    }
    if (progressEl) {
      progressEl.style.width = `${remainPct}%`;
      progressEl.classList.toggle('warn', remainPct < 40);
      progressEl.classList.toggle('danger', remainPct < 20);
    }
    if (usedAmountEl) usedAmountEl.textContent = `${formatMoney(used)} บาท`;
    if (usedPctEl) usedPctEl.textContent = `${usedPct.toFixed(2)}%`;

    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  async function loadRequests() {
    App.TableUI.showLoading(requestTbody, 5);
    const list = await App.CreditService.getRequests();
    if (!list.length) {
      App.TableUI.showEmpty(requestTbody, 5, 'ยังไม่มีคำขอเติมวงเงิน');
      return;
    }
    requestTbody.innerHTML = list.map((r) => `
      <tr>
        <td>${App.AdminUtils.formatDateTime(r.createdAt)}</td>
        <td class="col-money">${formatMoney(r.amount)}</td>
        <td>${r.note || '-'}</td>
        <td><span class="status-pill ${r.status}">${statusLabel(r.status)}</span></td>
        <td>${r.reviewedAt ? App.AdminUtils.formatDateTime(r.reviewedAt) : '-'}</td>
      </tr>
    `).join('');
  }

  async function loadLedger() {
    App.TableUI.showLoading(ledgerTbody, 4);
    const list = await App.CreditService.getLedger();
    if (!list.length) {
      App.TableUI.showEmpty(ledgerTbody, 4, 'ไม่มีประวัติวงเงิน');
      return;
    }
    ledgerTbody.innerHTML = list.map((e) => `
      <tr>
        <td>${App.AdminUtils.formatDateTime(e.createdAt)}</td>
        <td class="col-money ${e.amount >= 0 ? 'text-green' : 'text-red'}">${e.amount >= 0 ? '+' : ''}${formatMoney(e.amount)}</td>
        <td class="col-money">${formatMoney(e.balanceAfter)}</td>
        <td>${e.note || '-'}</td>
      </tr>
    `).join('');
  }

  noteInput?.addEventListener('input', updateNoteCounter);
  updateNoteCounter();

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (msgEl) {
      msgEl.textContent = '';
      msgEl.className = 'finance-form-message';
      msgEl.style.color = '';
    }

    const amount = Number(form.amount.value);
    const note = form.note.value.trim();

    if (!amount || amount < 1000) {
      if (msgEl) {
        msgEl.textContent = 'กรุณาระบุจำนวนเงินขั้นต่ำ 1,000 บาท';
        msgEl.style.color = 'var(--accent-red)';
      }
      return;
    }
    if (amount > 50000) {
      if (msgEl) {
        msgEl.textContent = 'จำนวนเงินสูงสุด 50,000 บาท';
        msgEl.style.color = 'var(--accent-red)';
      }
      return;
    }

    try {
      await App.CreditService.createRequest(amount, note);
      if (msgEl) {
        msgEl.textContent = 'ส่งคำขอเติมวงเงินเรียบร้อย — รอการอนุมัติจากผู้ดูแลระบบ';
        msgEl.style.color = 'var(--accent-green, #16a34a)';
      }
      form.reset();
      updateNoteCounter();
      await loadRequests();
    } catch (err) {
      if (msgEl) {
        msgEl.textContent = err.message || 'ส่งคำขอไม่สำเร็จ';
        msgEl.style.color = 'var(--accent-red)';
      }
    }
  });

  loadBalance();
  loadRequests();
  loadLedger();
})();
