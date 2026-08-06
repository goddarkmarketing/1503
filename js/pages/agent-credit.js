(function () {
  const requestTbody = document.getElementById('creditRequestBody');
  const ledgerTbody = document.getElementById('creditLedgerBody');
  if (!requestTbody || !ledgerTbody) return;

  const form = document.getElementById('creditRequestForm');
  const msgEl = document.getElementById('creditFormMessage');
  const noteInput = document.getElementById('creditNote');
  const noteCounter = document.getElementById('creditNoteCounter');
  const bankListEl = document.getElementById('creditBankList');
  const bankAccountInput = document.getElementById('creditBankAccountId');
  const slipInput = document.getElementById('creditSlipInput');
  const slipUpload = document.getElementById('creditSlipUpload');
  const slipPreview = document.getElementById('creditSlipPreview');
  const slipPreviewImg = document.getElementById('creditSlipPreviewImg');
  const slipFileNameEl = document.getElementById('creditSlipFileName');
  const slipClearBtn = document.getElementById('creditSlipClear');

  let selectedSlip = null;

  function formatMoney(n) {
    return App.Shell.formatCurrency(n);
  }

  function statusLabel(status) {
    return { pending: 'รออนุมัติ', approved: 'อนุมัติแล้ว', rejected: 'ปฏิเสธ' }[status] || status;
  }

  function setMessage(text, type) {
    if (!msgEl) return;
    msgEl.textContent = text || '';
    msgEl.className = 'finance-form-message' + (type ? ` is-${type}` : '');
    msgEl.style.color = type === 'error'
      ? 'var(--accent-red)'
      : type === 'success'
        ? 'var(--accent-green, #16a34a)'
        : '';
  }

  function updateNoteCounter() {
    if (!noteInput || !noteCounter) return;
    noteCounter.textContent = `${noteInput.value.length} / 200`;
  }

  function clearSlip() {
    selectedSlip = null;
    if (slipInput) slipInput.value = '';
    if (slipPreview) slipPreview.hidden = true;
    if (slipPreviewImg) {
      slipPreviewImg.removeAttribute('src');
      slipPreviewImg.hidden = false;
    }
    if (slipFileNameEl) slipFileNameEl.textContent = '-';
    slipUpload?.classList.remove('has-file');
  }

  function readSlipFile(file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error('ไม่พบไฟล์'));
        return;
      }
      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      if (!allowed.includes(file.type)) {
        reject(new Error('รองรับเฉพาะไฟล์ JPG, PNG, WEBP หรือ PDF'));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        reject(new Error('ขนาดไฟล์ต้องไม่เกิน 5 MB'));
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve({
        fileName: file.name,
        mimeType: file.type,
        dataUrl: String(reader.result || '')
      });
      reader.onerror = () => reject(new Error('อ่านไฟล์ไม่สำเร็จ'));
      reader.readAsDataURL(file);
    });
  }

  async function onSlipSelected(file) {
    try {
      selectedSlip = await readSlipFile(file);
      if (slipPreview) slipPreview.hidden = false;
      if (slipFileNameEl) slipFileNameEl.textContent = selectedSlip.fileName;
      if (slipPreviewImg) {
        if (selectedSlip.mimeType === 'application/pdf') {
          slipPreviewImg.hidden = true;
          slipPreviewImg.removeAttribute('src');
        } else {
          slipPreviewImg.hidden = false;
          slipPreviewImg.src = selectedSlip.dataUrl;
        }
      }
      slipUpload?.classList.add('has-file');
      setMessage('');
    } catch (err) {
      clearSlip();
      setMessage(err.message || 'อัปโหลดสลิปไม่สำเร็จ', 'error');
    }
  }

  function logoUrl(bank) {
    const base = document.body?.dataset?.basePath || '';
    if (!bank?.logo) return '';
    return bank.logo.startsWith('http') ? bank.logo : `${base}${bank.logo}`;
  }

  function renderBanks(banks) {
    if (!bankListEl) return;
    if (!banks.length) {
      bankListEl.innerHTML = '<p class="finance-field-hint">ยังไม่มีบัญชีรับโอน</p>';
      return;
    }
    if (bankAccountInput && !bankAccountInput.value) {
      bankAccountInput.value = banks[0].id;
    }
    bankListEl.innerHTML = banks.map((bank) => {
      const selected = bankAccountInput?.value === bank.id;
      const logo = logoUrl(bank);
      return `
        <label class="credit-bank-card${selected ? ' is-selected' : ''}" style="--bank-color:${bank.color || '#1f379d'}">
          <input type="radio" name="creditBank" value="${bank.id}" ${selected ? 'checked' : ''}>
          <span class="credit-bank-card__logo" aria-hidden="true">
            ${logo ? `<img src="${logo}" alt="">` : `<span class="credit-bank-card__fallback">${(bank.bankCode || '?').slice(0, 2)}</span>`}
          </span>
          <span class="credit-bank-card__body">
            <span class="credit-bank-card__bank">${bank.bankShort || bank.bankName}</span>
            <span class="credit-bank-card__no">${bank.accountNo}</span>
            <span class="credit-bank-card__name">${bank.accountName}</span>
          </span>
          <button type="button" class="credit-bank-card__copy" data-copy="${bank.accountNo}" title="คัดลอกเลขบัญชี">คัดลอก</button>
        </label>
      `;
    }).join('');

    bankListEl.querySelectorAll('input[name="creditBank"]').forEach((input) => {
      input.addEventListener('change', () => {
        if (bankAccountInput) bankAccountInput.value = input.value;
        bankListEl.querySelectorAll('.credit-bank-card').forEach((card) => {
          card.classList.toggle('is-selected', card.querySelector('input')?.checked);
        });
      });
    });

    bankListEl.querySelectorAll('[data-copy]').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const value = btn.getAttribute('data-copy') || '';
        try {
          await navigator.clipboard.writeText(value.replace(/-/g, ''));
          const prev = btn.textContent;
          btn.textContent = 'คัดลอกแล้ว';
          setTimeout(() => { btn.textContent = prev; }, 1200);
        } catch (_) {
          setMessage('คัดลอกเลขบัญชีไม่สำเร็จ', 'error');
        }
      });
    });

    if (typeof lucide !== 'undefined') lucide.createIcons();
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

  async function loadBanks() {
    // นายหน้าเห็นเฉพาะบัญชีที่เปิดใช้
    const banks = await App.CreditService.getBankAccounts({ enabledOnly: true });
    const now = new Date();

    const toMinutes = (hhmm) => {
      const s = String(hhmm || '').trim();
      if (!s.includes(':')) return 0;
      const [h, m] = s.split(':').map((n) => Number(n));
      if (!Number.isFinite(h) || !Number.isFinite(m)) return 0;
      return h * 60 + m;
    };

    const inRange = (fromMin, toMin, curMin) => {
      // same-day range
      if (fromMin <= toMin) return curMin >= fromMin && curMin <= toMin;
      // overnight range (e.g. 22:00 -> 06:00)
      return curMin >= fromMin || curMin <= toMin;
    };

    const activeBanks = (banks || []).filter((b) => {
      const fromMin = toMinutes(b.activeFrom || '00:00');
      const toMin = toMinutes(b.activeTo || '23:59');
      const curMin = now.getHours() * 60 + now.getMinutes();
      return inRange(fromMin, toMin, curMin);
    });

    // If nobody is active in the schedule, fall back to all enabled banks.
    const listToRender = activeBanks.length ? activeBanks : (banks || []);

    if (bankAccountInput && bankAccountInput.value) {
      const stillExists = listToRender.some((b) => b.id === bankAccountInput.value);
      if (!stillExists) bankAccountInput.value = '';
    }

    renderBanks(listToRender);
  }

  async function loadRequests() {
    App.TableUI.showLoading(requestTbody, 6);
    const list = (await App.CreditService.getRequests()).slice(0, 5);
    if (!list.length) {
      App.TableUI.showEmpty(requestTbody, 6, 'ยังไม่มีคำขอเติมวงเงิน');
      return;
    }
    requestTbody.innerHTML = list.map((r) => `
      <tr>
        <td>${App.AdminUtils.formatDateTime(r.createdAt)}</td>
        <td class="col-money">${formatMoney(r.amount)}</td>
        <td>
          <div class="credit-pay-cell">
            <strong>${r.bankName || 'โอนธนาคาร'}</strong>
            <span>${r.accountNo || '-'}</span>
          </div>
        </td>
        <td>
          ${r.slipDataUrl
            ? `<button type="button" class="btn-text btn-view-slip" data-slip="${encodeURIComponent(r.slipDataUrl)}" data-name="${r.slipFileName || 'slip'}">ดูสลิป</button>`
            : '-'}
        </td>
        <td><span class="status-pill ${r.status}">${statusLabel(r.status)}</span></td>
        <td>${r.reviewedAt ? App.AdminUtils.formatDateTime(r.reviewedAt) : '-'}</td>
      </tr>
    `).join('');

    requestTbody.querySelectorAll('.btn-view-slip').forEach((btn) => {
      btn.addEventListener('click', () => {
        const src = decodeURIComponent(btn.dataset.slip || '');
        const name = btn.dataset.name || 'slip';
        const isPdf = /\.pdf$/i.test(name) || src.startsWith('data:application/pdf');
        const win = window.open('', '_blank');
        if (!win) return;
        if (isPdf) {
          win.document.write(`<title>${name}</title><embed src="${src}" type="application/pdf" width="100%" height="100%">`);
        } else {
          win.document.write(`<title>${name}</title><img src="${src}" alt="${name}" style="max-width:100%;height:auto;display:block;margin:0 auto">`);
        }
        win.document.close();
      });
    });
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

  slipInput?.addEventListener('change', () => {
    const file = slipInput.files?.[0];
    if (file) onSlipSelected(file);
  });

  slipClearBtn?.addEventListener('click', () => {
    clearSlip();
  });

  ['dragenter', 'dragover'].forEach((evt) => {
    slipUpload?.addEventListener(evt, (e) => {
      e.preventDefault();
      slipUpload.classList.add('is-dragover');
    });
  });
  ['dragleave', 'drop'].forEach((evt) => {
    slipUpload?.addEventListener(evt, (e) => {
      e.preventDefault();
      slipUpload.classList.remove('is-dragover');
    });
  });
  slipUpload?.addEventListener('drop', (e) => {
    const file = e.dataTransfer?.files?.[0];
    if (file) onSlipSelected(file);
  });

  function pad2(n) {
    return String(n).padStart(2, '0');
  }

  function syncTransferTime() {
    const hourEl = document.getElementById('creditTransferHour');
    const minuteEl = document.getElementById('creditTransferMinute');
    const timeEl = document.getElementById('creditTransferTime');
    if (!timeEl || !hourEl || !minuteEl) return '';
    const value = `${hourEl.value || '00'}:${minuteEl.value || '00'}`;
    timeEl.value = value;
    return value;
  }

  function fillTimeSelects() {
    const hourEl = document.getElementById('creditTransferHour');
    const minuteEl = document.getElementById('creditTransferMinute');
    if (!hourEl || !minuteEl) return;

    if (!hourEl.options.length) {
      hourEl.innerHTML = Array.from({ length: 24 }, (_, h) => {
        const v = pad2(h);
        return `<option value="${v}">${v}</option>`;
      }).join('');
    }
    if (!minuteEl.options.length) {
      minuteEl.innerHTML = Array.from({ length: 60 }, (_, m) => {
        const v = pad2(m);
        return `<option value="${v}">${v}</option>`;
      }).join('');
    }

    hourEl.addEventListener('change', syncTransferTime);
    minuteEl.addEventListener('change', syncTransferTime);
  }

  function setDefaultTransferDateTime() {
    const dateEl = document.getElementById('creditTransferDate');
    const hourEl = document.getElementById('creditTransferHour');
    const minuteEl = document.getElementById('creditTransferMinute');
    if (!dateEl && !hourEl && !minuteEl) return;
    const now = new Date();
    if (dateEl) {
      dateEl.value = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
      dateEl.max = dateEl.value;
    }
    if (hourEl) hourEl.value = pad2(now.getHours());
    if (minuteEl) minuteEl.value = pad2(now.getMinutes());
    syncTransferTime();
  }

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    setMessage('');

    const amount = Number(form.amount.value);
    const note = form.note.value.trim();
    const bankAccountId = bankAccountInput?.value || '';
    const transferDate = form.transferDate?.value || '';
    const transferTime = syncTransferTime();
    const submitBtn = form.querySelector('button[type="submit"]');

    if (!amount || amount < 1000) {
      setMessage('กรุณาระบุจำนวนเงินขั้นต่ำ 1,000 บาท', 'error');
      return;
    }
    if (amount > 50000) {
      setMessage('จำนวนเงินสูงสุด 50,000 บาท', 'error');
      return;
    }
    if (!bankAccountId) {
      setMessage('กรุณาเลือกบัญชีธนาคารสำหรับโอนเงิน', 'error');
      return;
    }
    if (!transferDate) {
      setMessage('กรุณาระบุวันที่โอนเงิน', 'error');
      return;
    }
    if (!transferTime) {
      setMessage('กรุณาระบุเวลาที่โอน', 'error');
      return;
    }
    if (!selectedSlip?.dataUrl) {
      setMessage('กรุณาอัปโหลดหลักฐานการโอนเงิน', 'error');
      return;
    }

    try {
      await App.ButtonUI.withLoading(submitBtn, async () => {
        await App.CreditService.createRequest({
          amount,
          note,
          bankAccountId,
          transferDate,
          transferTime,
          slipFileName: selectedSlip.fileName,
          slipDataUrl: selectedSlip.dataUrl
        });
        setMessage('ส่งคำขอเติมวงเงินเรียบร้อย — รอแอดมินตรวจสอบยอดและสลิป', 'success');
        form.reset();
        clearSlip();
        updateNoteCounter();
        setDefaultTransferDateTime();
        await loadBanks();
        await loadRequests();
      }, { label: 'กำลังส่งคำขอ...' });
    } catch (err) {
      setMessage(err.message || 'ส่งคำขอไม่สำเร็จ', 'error');
    } finally {
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }
  });

  fillTimeSelects();
  setDefaultTransferDateTime();
  loadBalance();
  loadBanks();
  loadRequests();
  loadLedger();

  // ถ้าแอดมินปรับบัญชีธนาคารในแท็บอื่น (mock) ให้หน้า agent อัปเดตอัตโนมัติ
  window.addEventListener('storage', (event) => {
    if (event?.key !== App.Config?.CREDIT_BANK_ACCOUNTS_KEY) return;
    loadBanks();
  });
})();
