(function () {
  const tbody = document.getElementById('creditBankAccountsTbody');
  const btnSave = document.getElementById('btnSaveBanks');
  const btnAdd = document.getElementById('btnAddBank');
  const selectRoot = document.getElementById('addBankSelect');
  const selectTrigger = document.getElementById('addBankSelectTrigger');
  const selectPreview = document.getElementById('addBankSelectPreview');
  const selectMenu = document.getElementById('addBankSelectMenu');

  if (!tbody || !btnSave || !btnAdd || !selectRoot || !selectTrigger || !selectMenu) return;

  const el = (id) => document.getElementById(id);

  const addBankShort = el('addBankShort');
  const addBankCode = el('addBankCode');
  const addBankColor = el('addBankColor');
  const addBankLogo = el('addBankLogo');
  const addBankName = el('addBankName');
  const addAccountNo = el('addAccountNo');
  const addAccountName = el('addAccountName');
  const addBranch = el('addBranch');
  const addEnabledStatus = el('addEnabledStatus');

  const BANK_PRESETS = (App.ThaiBanks?.list?.() || []).slice();

  let banksCache = [];
  let selectedPreset = null;
  let menuOpen = false;

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function normalizeColor(input, fallback) {
    const s = String(input || '').trim();
    if (!s) return fallback;
    if (s.startsWith('#')) return s;
    return `#${s}`;
  }

  function assetUrl(path) {
    const base = document.body?.dataset?.basePath || '';
    if (!path) return '';
    return path.startsWith('http') ? path : `${base}${path}`;
  }

  function logoUrl(bank) {
    const resolved = App.ThaiBanks?.resolveLogo?.(bank) || bank?.logo || '';
    return assetUrl(resolved);
  }

  function mark(bank) {
    const code = bank?.code || '';
    const short = bank?.short || bank?.bankShort || bank?.bankName || '';
    return code ? code.slice(0, 2).toUpperCase() : (short || '?').slice(0, 2);
  }

  function bankBadgeHtml(bank, opts = {}) {
    const color = normalizeColor(bank?.color, '#1f379d');
    const logo = logoUrl(bank);
    const label = mark(bank);
    const size = opts.size || 34;
    const fallbackStyle = logo ? 'display:none' : 'display:flex';
    return `
      <span class="credit-bank-badge" style="width:${size}px;height:${size}px">
        ${logo ? `<img src="${escapeHtml(logo)}" alt="" onerror="this.style.display='none'; var fb=this.nextElementSibling; if(fb) fb.style.display='flex';">` : ''}
        <span class="credit-bank-badge__fallback" style="background:${escapeHtml(color)};${fallbackStyle}">${escapeHtml(label)}</span>
      </span>
    `;
  }

  function genBankId(bankCode, banks) {
    const code = String(bankCode || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const base = code ? `bank-${code}` : `bank-${Date.now()}`;
    let id = base;
    let i = 1;
    while ((banks || []).some((b) => b.id === id)) {
      id = `${base}-${i++}`;
    }
    return id;
  }

  function setMenuOpen(open) {
    menuOpen = !!open;
    selectMenu.hidden = !menuOpen;
    selectTrigger.setAttribute('aria-expanded', menuOpen ? 'true' : 'false');
    selectRoot.classList.toggle('is-open', menuOpen);
  }

  function applyPreset(preset) {
    selectedPreset = preset || null;
    addBankCode.value = preset?.code || '';
    addBankShort.value = preset?.short || '';
    addBankColor.value = preset?.color || '#1f379d';
    addBankLogo.value = preset?.logo || '';
    addBankName.value = preset?.name || '';

    if (!preset) {
      selectPreview.innerHTML = '<span class="credit-bank-select__placeholder">เลือกธนาคาร</span>';
    } else {
      selectPreview.innerHTML = `
        ${bankBadgeHtml(preset, { size: 28 })}
        <span class="credit-bank-select__text">
          <strong>${escapeHtml(preset.short)}</strong>
          <span>${escapeHtml(preset.code)}</span>
        </span>
      `;
    }

    selectMenu.querySelectorAll('.credit-bank-select__option').forEach((btn) => {
      btn.classList.toggle('is-selected', btn.dataset.code === preset?.code);
      btn.setAttribute('aria-selected', btn.dataset.code === preset?.code ? 'true' : 'false');
    });
  }

  function renderBankSelect() {
    selectMenu.innerHTML = BANK_PRESETS.map((p) => `
      <button
        type="button"
        class="credit-bank-select__option"
        role="option"
        aria-selected="false"
        data-code="${escapeHtml(p.code)}"
      >
        ${bankBadgeHtml(p, { size: 30 })}
        <span class="credit-bank-select__option-text">
          <strong>${escapeHtml(p.short)}</strong>
          <span>${escapeHtml(p.name)} · ${escapeHtml(p.code)}</span>
        </span>
      </button>
    `).join('');

    selectMenu.querySelectorAll('.credit-bank-select__option').forEach((btn) => {
      btn.addEventListener('click', () => {
        const preset = BANK_PRESETS.find((p) => p.code === btn.dataset.code);
        applyPreset(preset || null);
        setMenuOpen(false);
      });
    });
  }

  function render() {
    if (!banksCache.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5">
            <p class="admin-hint" style="margin:0">ยังไม่มีบัญชีธนาคาร — เพิ่มได้จากฟอร์มด้านล่าง</p>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = banksCache.map((b) => {
      const enabled = b.enabled !== false;
      const short = b.bankShort || b.bankName || '';
      return `
        <tr data-bank-id="${escapeHtml(b.id)}" class="${enabled ? '' : 'is-disabled'}">
          <td>
            <label style="display:flex; align-items:center; justify-content:center" title="${enabled ? 'เปิดใช้' : 'ปิดใช้'}">
              <input type="checkbox" name="enabled" data-bank-enabled="${escapeHtml(b.id)}" ${enabled ? 'checked' : ''}>
            </label>
          </td>
          <td>
            <div style="display:flex; align-items:center; gap:12px; opacity:${enabled ? '1' : '0.55'}">
              ${bankBadgeHtml(b, { size: 34 })}
              <div style="line-height:1.3">
                <div style="font-weight:700">${escapeHtml(short || b.id)}</div>
                ${b.branch ? `<div style="font-size:0.78rem;color:var(--text-muted)">${escapeHtml(b.branch)}</div>` : ''}
                ${enabled ? '' : '<div style="font-size:0.75rem;color:#b45309">ปิดใช้งาน — นายหน้าจะไม่เห็นบัญชีนี้</div>'}
              </div>
            </div>
          </td>
          <td>${escapeHtml(b.accountNo || '-')}</td>
          <td>${escapeHtml(b.accountName || '-')}</td>
          <td>
            <button type="button" class="btn-danger btn-sm" data-delete-bank="${escapeHtml(b.id)}">ลบ</button>
          </td>
        </tr>
      `;
    }).join('');
  }

  function readDraftBanks() {
    return banksCache.map((b) => {
      const row = tbody.querySelector(`tr[data-bank-id="${CSS.escape(b.id)}"]`);
      const enabledInput = row?.querySelector('input[name="enabled"]');
      const enabled = enabledInput ? !!enabledInput.checked : b.enabled !== false;
      return {
        ...b,
        enabled,
        activeFrom: b.activeFrom || '00:00',
        activeTo: b.activeTo || '23:59'
      };
    });
  }

  async function saveBanks(draft, { silent = false } = {}) {
    const result = await App.CreditService.updateBankAccounts(draft);
    banksCache = result?.banks || draft;
    if (!silent) App.AdminUtils.showToast('บันทึกการตั้งค่าเรียบร้อยแล้ว');
    render();
    return banksCache;
  }

  async function load() {
    tbody.innerHTML = `
      <tr>
        <td colspan="5">
          <p class="admin-hint" style="margin:0">กำลังโหลดบัญชีธนาคาร...</p>
        </td>
      </tr>
    `;
    banksCache = await App.CreditService.getBankAccounts();
    render();
  }

  tbody.addEventListener('change', async (e) => {
    const input = e.target.closest('input[data-bank-enabled]');
    if (!input) return;
    const id = input.getAttribute('data-bank-enabled');
    const enabled = !!input.checked;
    banksCache = banksCache.map((b) => (b.id === id ? { ...b, enabled } : b));
    render();
    try {
      await saveBanks(banksCache, { silent: true });
      App.AdminUtils.showToast(
        enabled ? 'เปิดใช้งานบัญชีแล้ว — นายหน้าจะเห็นทันที' : 'ปิดใช้งานแล้ว — นายหน้าจะไม่เห็นบัญชีนี้',
        'success'
      );
    } catch (err) {
      // rollback
      banksCache = banksCache.map((b) => (b.id === id ? { ...b, enabled: !enabled } : b));
      render();
      App.AdminUtils.showToast(err.message || 'บันทึกไม่สำเร็จ', 'error');
    }
  });

  tbody.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-delete-bank]');
    if (!btn) return;
    const id = btn.getAttribute('data-delete-bank');
    if (!confirm('ต้องการลบบัญชีธนาคารรายการนี้ใช่ไหม?')) return;
    const prev = banksCache;
    banksCache = banksCache.filter((b) => b.id !== id);
    render();
    try {
      await saveBanks(banksCache, { silent: true });
      App.AdminUtils.showToast('ลบบัญชีเรียบร้อยแล้ว');
    } catch (err) {
      banksCache = prev;
      render();
      App.AdminUtils.showToast(err.message || 'ลบไม่สำเร็จ', 'error');
    }
  });

  selectTrigger.addEventListener('click', () => {
    setMenuOpen(!menuOpen);
  });

  document.addEventListener('click', (e) => {
    if (!menuOpen) return;
    if (selectRoot.contains(e.target)) return;
    setMenuOpen(false);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menuOpen) setMenuOpen(false);
  });

  btnAdd.addEventListener('click', async () => {
    const bankShort = (addBankShort?.value || '').trim();
    const bankCode = (addBankCode?.value || '').trim().toUpperCase();
    const bankColor = (addBankColor?.value || '').trim();
    const bankLogo = (addBankLogo?.value || '').trim();
    const bankName = (addBankName?.value || '').trim();
    const accountNo = (addAccountNo?.value || '').trim();
    const accountName = (addAccountName?.value || '').trim();
    const branch = (addBranch?.value || '').trim();
    const activeFrom = '00:00';
    const activeTo = '23:59';
    const enabled = String(addEnabledStatus?.value) === '1';

    if (!selectedPreset || !bankCode) {
      App.AdminUtils.showToast('กรุณาเลือกธนาคารจากดรอปดาวน์', 'error');
      return;
    }
    if (!accountNo || !accountName) {
      App.AdminUtils.showToast('กรุณากรอกเลขบัญชีและชื่อบัญชีให้ครบ', 'error');
      return;
    }

    const id = genBankId(bankCode, banksCache);
    const nextItem = {
      id,
      bankName: bankName || bankShort,
      bankShort,
      bankCode,
      color: normalizeColor(bankColor, selectedPreset.color || '#1f379d'),
      logo: bankLogo,
      accountNo,
      accountName,
      branch,
      enabled,
      activeFrom,
      activeTo
    };
    const prev = banksCache.slice();
    banksCache = [nextItem, ...banksCache];

    addAccountNo.value = '';
    addAccountName.value = '';
    addBranch.value = '';
    addEnabledStatus.value = '1';
    applyPreset(null);
    render();

    try {
      btnAdd.disabled = true;
      await saveBanks(banksCache, { silent: true });
      App.AdminUtils.showToast('เพิ่มและบันทึกบัญชีเรียบร้อยแล้ว');
    } catch (err) {
      banksCache = prev;
      render();
      App.AdminUtils.showToast(err.message || 'บันทึกไม่สำเร็จ', 'error');
    } finally {
      btnAdd.disabled = false;
    }
  });

  btnSave.addEventListener('click', async () => {
    const draft = readDraftBanks();
    try {
      btnSave.disabled = true;
      const prev = btnSave.textContent;
      btnSave.textContent = 'กำลังบันทึก...';
      await saveBanks(draft);
      btnSave.textContent = prev;
    } catch (err) {
      App.AdminUtils.showToast(err.message || 'บันทึกไม่สำเร็จ', 'error');
    } finally {
      btnSave.disabled = false;
    }
  });

  renderBankSelect();
  applyPreset(null);
  if (typeof lucide !== 'undefined') lucide.createIcons();
  load();
})();
