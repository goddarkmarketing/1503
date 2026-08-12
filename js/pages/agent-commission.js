(function () {
  let cache = [];
  let page = 1;

  const tbody = document.getElementById('commissionTableBody');
  if (!tbody) return;

  const periodInput = document.getElementById('commissionPeriod');
  const periodTypeSelect = document.getElementById('commissionPeriodType');
  const statusSelect = document.getElementById('commissionStatus');
  const immediate = !!App.Config?.COMMISSION_PAY_THROUGH_WALLET;

  if (immediate) {
    // In wallet-clear mode: no pending workflow.
    statusSelect?.querySelector('option[value="pending"]')?.remove();
    const pendingStatValue = document.getElementById('statCommissionPending');
    pendingStatValue?.closest('.finance-stat')?.classList.add('is-hidden-by-commission');
    pendingStatValue?.closest('.finance-stat')?.setAttribute('hidden', 'true');
  }

  function formatMoney(n) {
    return App.Shell.formatCurrency(n);
  }

  function statusLabel(status) {
    return { paid: 'จ่ายแล้ว', pending: 'ค้างจ่าย' }[status] || status;
  }

  function localDateValue(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function updatePeriodControl() {
    if (!periodInput) return;
    const now = new Date();
    const today = localDateValue(now);
    const type = periodTypeSelect?.value || 'month';

    periodInput.removeAttribute('min');
    periodInput.removeAttribute('max');
    periodInput.removeAttribute('step');

    if (type === 'day') {
      periodInput.type = 'date';
      periodInput.max = today;
      periodInput.value = today;
    } else if (type === 'year') {
      periodInput.type = 'number';
      periodInput.min = '2020';
      periodInput.max = String(now.getFullYear());
      periodInput.step = '1';
      periodInput.value = String(now.getFullYear());
    } else {
      periodInput.type = 'month';
      periodInput.max = today.slice(0, 7);
      periodInput.value = today.slice(0, 7);
    }
  }

  async function loadSummary(filters) {
    const summary = await App.CommissionService.getSummary(filters);
    const el = (id) => document.getElementById(id);
    if (el('statCommissionTotal')) el('statCommissionTotal').textContent = formatMoney(summary.total);
    if (el('statCommissionPaid')) el('statCommissionPaid').textContent = formatMoney(summary.paid);
    if (el('statCommissionPending')) el('statCommissionPending').textContent = formatMoney(summary.pending);
    if (el('statCommissionCount')) el('statCommissionCount').textContent = String(summary.count);
  }

  function renderTable() {
    const pg = App.TableUI.paginate(cache, page);
    if (!pg.items.length) {
      App.TableUI.showEmpty(tbody, 11, 'ไม่พบรายการค่าคอมมิชชัน');
      document.getElementById('commissionPagination').innerHTML = '';
      return;
    }
    tbody.innerHTML = pg.items.map((c) => `
      <tr>
        <td>${c.policyNo}</td>
        <td>${c.policyTypeLabel}</td>
        <td>${c.insurer}</td>
        <td>${c.plate}</td>
        <td class="col-center">${c.earnedAt ? App.AdminUtils.formatThaiDate(c.earnedAt) : '-'}</td>
        <td class="col-money">${formatMoney(c.premium)}</td>
        <td class="col-center">${c.rate}%</td>
        <td class="col-money">${formatMoney(c.amount)}</td>
        <td><span class="status-pill ${c.status}">${statusLabel(c.status)}</span></td>
        <td class="col-center">${c.paidAt ? App.AdminUtils.formatThaiDate(c.paidAt) : '-'}</td>
        <td class="col-center">
          ${c.wht50Id
            ? `<div class="admin-wht50-cell" style="justify-content:center">
                 <span class="status-pill ${c.wht50PrintedAt ? 'wht50-printed' : 'wht50-unprinted'}">${c.wht50PrintedAt ? 'พิมพ์แล้ว' : 'ยังไม่พิมพ์'}</span>
                 <button type="button" class="btn-success btn-sm" data-wht50="${c.wht50Id}">ดู/พิมพ์</button>
               </div>`
            : (c.issueForm50Tawi ? '<span class="admin-hint">รอออก</span>' : '-')}
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('[data-wht50]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        try {
          const doc = await App.Wht50Service.getById(btn.dataset.wht50);
          App.Wht50Service.print(doc);
        } catch (err) {
          alert(err.message || 'เปิดหนังสือ 50 ทวิไม่สำเร็จ');
        }
      });
    });

    App.TableUI.renderPagination(document.getElementById('commissionPagination'), {
      ...pg,
      onChange: (p) => { page = p; renderTable(); }
    });
  }

  async function search() {
    App.TableUI.showLoading(tbody, 11);
    const period = periodInput?.value || '';
    const periodType = periodTypeSelect?.value || 'month';
    const status = statusSelect?.value || '';
    const filters = { periodType };
    if (period) filters.period = period;
    if (status) filters.status = status;
    cache = await App.CommissionService.getCommissions(filters);
    page = 1;
    await loadSummary({ period, periodType });
    renderTable();
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  updatePeriodControl();
  document.getElementById('btnCommissionSearch')?.addEventListener('click', search);
  periodTypeSelect?.addEventListener('change', () => {
    updatePeriodControl();
    search();
  });
  periodInput?.addEventListener('change', search);
  statusSelect?.addEventListener('change', search);
  window.addEventListener('wht50:printed', () => { search(); });
  search();
})();
