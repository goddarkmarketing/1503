(function () {
  const tbody = document.getElementById('adminCommissionBody');
  if (!tbody) return;

  const dateFromInput = document.getElementById('commissionDateFrom');
  const dateToInput = document.getElementById('commissionDateTo');
  const dateFromThai = document.getElementById('commissionDateFromThai');
  const dateToThai = document.getElementById('commissionDateToThai');
  const statusSelect = document.getElementById('commissionStatus');
  const wht50Select = document.getElementById('commissionWht50Status');
  const searchInput = document.getElementById('commissionSearch');
  const paginationEl = document.getElementById('commissionPagination');
  const btnSearch = document.getElementById('btnCommissionSearch');
  const btnClear = document.getElementById('btnCommissionClear');
  const btnExport = document.getElementById('btnCommissionExport');

  const immediate = !!App.Config?.COMMISSION_PAY_THROUGH_WALLET;
  const COLS = 9;
  let cache = [];
  let page = 1;

  if (immediate && statusSelect) {
    statusSelect.querySelector('option[value="pending"]')?.remove();
  }

  function money(n) {
    return App.Shell.formatCurrency(n);
  }

  function toDateOnly(value) {
    if (!value) return '';
    const raw = String(value).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function thaiDate(value) {
    const iso = toDateOnly(value);
    if (!iso) return '-';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${Number(y) + 543}`;
  }

  function thaiDateLabel(value, emptyText) {
    const iso = toDateOnly(value);
    if (!iso) return emptyText || 'เลือกวัน';
    const [y, m, d] = iso.split('-');
    // แสดงเป็น วว/ดด/พ.ศ. (แค่วัน ไม่มีเวลา)
    return `${d}/${m}/${Number(y) + 543}`;
  }

  function syncThaiDateLabels() {
    if (dateFromThai) {
      dateFromThai.textContent = thaiDateLabel(dateFromInput?.value, 'เลือกวัน');
      dateFromThai.classList.toggle('has-value', !!dateFromInput?.value);
    }
    if (dateToThai) {
      dateToThai.textContent = thaiDateLabel(dateToInput?.value, 'เลือกวัน');
      dateToThai.classList.toggle('has-value', !!dateToInput?.value);
    }
  }

  function localDateValue(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function statusLabel(s) {
    return { paid: 'จ่ายแล้ว', pending: 'ค้างจ่าย' }[s] || s;
  }

  function wht50Meta(c) {
    if (!c.issueForm50Tawi && !c.wht50Id) {
      return { key: 'none', label: 'ไม่ต้องออก', pill: 'wht50-none' };
    }
    if (c.issueForm50Tawi && !c.wht50Id) {
      return { key: 'waiting', label: 'รอออก', pill: 'wht50-waiting' };
    }
    if (c.wht50PrintedAt) {
      return { key: 'printed', label: 'พิมพ์แล้ว', pill: 'wht50-printed' };
    }
    return { key: 'unprinted', label: 'ยังไม่พิมพ์', pill: 'wht50-unprinted' };
  }

  function matchesWht50Filter(c, filter) {
    if (!filter) return true;
    return wht50Meta(c).key === filter;
  }

  function initDateDefaults() {
    const today = localDateValue(new Date());
    const start = localDateValue(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    if (dateFromInput) {
      dateFromInput.max = today;
      dateFromInput.value = start;
    }
    if (dateToInput) {
      dateToInput.max = today;
      dateToInput.value = today;
    }
    syncThaiDateLabels();
  }

  function readFilters() {
    let from = toDateOnly(dateFromInput?.value);
    let to = toDateOnly(dateToInput?.value);
    if (from && to && from > to) {
      const tmp = from;
      from = to;
      to = tmp;
    }
    return {
      dateFrom: from,
      dateTo: to,
      status: statusSelect?.value || '',
      wht50: wht50Select?.value || '',
      q: (searchInput?.value || '').trim().toLowerCase()
    };
  }

  function agentLabel(c) {
    const name = c.agentName || '-';
    const extra = c.kind === 'team-override'
      ? ` · คอมแม่ทีมจาก ${c.sourceAgentCode || '-'}`
      : '';
    return { code: c.agentCode || '-', name: `${name}${extra}` };
  }

  function whtCellHtml(c) {
    const wht = wht50Meta(c);
    if (c.wht50Id) {
      return `<div class="admin-wht50-cell">
        <span class="status-pill ${wht.pill}">${wht.label}</span>
        <button type="button" class="btn-secondary btn-sm" data-wht50="${c.wht50Id}">ดู/พิมพ์</button>
      </div>`;
    }
    return `<span class="status-pill ${wht.pill}">${wht.label}</span>`;
  }

  function actionHtml(c) {
    return c.status === 'pending'
      ? '<button type="button" class="btn-primary btn-sm btn-pay">บันทึกจ่ายแล้ว</button>'
      : '<span class="commission-action-muted">—</span>';
  }

  function bindRowActions(root) {
    root.querySelectorAll('[data-wht50]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        try {
          if (!App.Wht50Service) throw new Error('ระบบ 50 ทวิยังไม่พร้อม');
          const doc = await App.Wht50Service.getById(btn.dataset.wht50);
          if (!doc) throw new Error('ไม่พบหนังสือ 50 ทวิ');
          App.Wht50Service.print(doc);
        } catch (err) {
          console.error('[admin-commission] wht50 preview failed', err);
          const msg = err?.message || 'เปิดหนังสือ 50 ทวิไม่สำเร็จ';
          if (App.AdminUtils?.showToast) App.AdminUtils.showToast(msg, 'error');
          else alert(msg);
        }
      });
    });

    root.querySelectorAll('.btn-pay').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.closest('[data-id]')?.dataset?.id;
        if (!id) return;
        if (!confirm('ยืนยันบันทึกว่าจ่ายคอมมิชชันแล้ว?')) return;
        try {
          await App.ButtonUI.withLoading(btn, async () => {
            await App.CommissionService.updateStatus(id, 'paid');
            await load();
            App.Shell.refreshNotifications?.();
            App.AdminUtils.showToast('บันทึกจ่ายคอมมิชชันเรียบร้อยแล้ว');
          }, { label: 'กำลังบันทึก...' });
        } catch (err) {
          App.AdminUtils.showToast(err.message || 'บันทึกไม่สำเร็จ', 'error');
        }
      });
    });
  }

  function renderTable(items) {
    if (!items.length) {
      App.TableUI.showEmpty(tbody, COLS, 'ไม่พบรายการค่าคอมมิชชัน');
      return;
    }
    tbody.innerHTML = items.map((c) => {
      const agent = agentLabel(c);
      return `
      <tr data-id="${c.id}">
        <td>
          <div class="admin-agent-cell">
            <span class="admin-agent-cell__code">${agent.code}</span>
            <span class="admin-agent-cell__name">${agent.name}</span>
          </div>
        </td>
        <td>${c.policyNo || '-'}</td>
        <td>${c.policyTypeLabel || '-'}</td>
        <td class="col-center">${thaiDate(c.earnedAt)}</td>
        <td class="col-money">${money(c.premium)}</td>
        <td class="col-money"><strong>${money(c.amount)}</strong></td>
        <td><span class="status-pill ${c.status}">${statusLabel(c.status)}</span></td>
        <td>${whtCellHtml(c)}</td>
        <td>${actionHtml(c)}</td>
      </tr>`;
    }).join('');
    bindRowActions(tbody);
  }

  function render() {
    const pg = App.TableUI.paginate(cache, page, 20);
    renderTable(pg.items);
    if (paginationEl) {
      App.TableUI.renderPagination(paginationEl, {
        ...pg,
        onChange: (p) => {
          page = p;
          render();
        }
      });
    }
  }

  async function load() {
    App.TableUI.showLoading(tbody, COLS);

    const f = readFilters();
    const filters = {};
    if (f.status) filters.status = f.status;

    let list = await App.CommissionService.getAllCommissions(filters);

    if (f.dateFrom || f.dateTo) {
      list = list.filter((c) => {
        const day = toDateOnly(c.earnedAt || (c.period ? `${c.period}-01` : ''));
        if (!day) return false;
        if (f.dateFrom && day < f.dateFrom) return false;
        if (f.dateTo && day > f.dateTo) return false;
        return true;
      });
    }

    if (f.wht50) list = list.filter((c) => matchesWht50Filter(c, f.wht50));
    if (f.q) {
      list = list.filter((c) => {
        const hay = [
          c.agentCode, c.agentName, c.policyNo, c.plate, c.policyTypeLabel, c.insurer, c.wht50DocNo
        ].join(' ').toLowerCase();
        return hay.includes(f.q);
      });
    }

    cache = list;
    page = 1;
    render();
  }

  function exportExcel() {
    if (!cache.length) {
      App.AdminUtils?.showToast?.('ไม่มีข้อมูลให้ส่งออก', 'error');
      return;
    }
    const headers = [
      'รหัสนายหน้า', 'ชื่อนายหน้า', 'เลขกรมธรรม์', 'ประเภท', 'บริษัท', 'ทะเบียน',
      'วันที่', 'เบี้ย', 'อัตรา(%)', 'ค่าคอม', 'สถานะ', '50 ทวิ', 'เลขที่ 50 ทวิ', 'จ่ายเมื่อ'
    ];
    const rows = cache.map((c) => {
      const wht = wht50Meta(c);
      return [
        c.agentCode || '',
        c.agentName || '',
        c.policyNo || '',
        c.policyTypeLabel || '',
        c.insurer || '',
        c.plate || '',
        toDateOnly(c.earnedAt) || '',
        Number(c.premium) || 0,
        c.rate ?? '',
        Number(c.amount) || 0,
        statusLabel(c.status),
        wht.label,
        c.wht50DocNo || '',
        toDateOnly(c.paidAt) || ''
      ];
    });
    const csv = [headers, ...rows]
      .map((r) => r.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const stamp = localDateValue(new Date()).replace(/-/g, '');
    link.href = URL.createObjectURL(blob);
    link.download = `commission-${stamp}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    App.AdminUtils?.showToast?.('ส่งออกไฟล์เรียบร้อย (เปิดด้วย Excel ได้)');
  }

  function clearFilters() {
    if (dateFromInput) dateFromInput.value = '';
    if (dateToInput) dateToInput.value = '';
    if (statusSelect) statusSelect.value = '';
    if (wht50Select) wht50Select.value = '';
    if (searchInput) searchInput.value = '';
    syncThaiDateLabels();
    load();
  }

  function onDateChange() {
    const from = toDateOnly(dateFromInput?.value);
    const to = toDateOnly(dateToInput?.value);
    if (from && to && from > to && dateToInput) dateToInput.value = from;
    syncThaiDateLabels();
    load();
  }

  dateFromInput?.addEventListener('change', onDateChange);
  dateToInput?.addEventListener('change', onDateChange);
  dateFromInput?.addEventListener('input', syncThaiDateLabels);
  dateToInput?.addEventListener('input', syncThaiDateLabels);
  statusSelect?.addEventListener('change', load);
  wht50Select?.addEventListener('change', load);
  searchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      load();
    }
  });
  btnSearch?.addEventListener('click', load);
  btnClear?.addEventListener('click', clearFilters);
  btnExport?.addEventListener('click', exportExcel);

  window.addEventListener('wht50:printed', () => { load(); });

  initDateDefaults();
  load();
  if (typeof lucide !== 'undefined') lucide.createIcons();
})();
