(function () {
  const tbody = document.getElementById('adminCommissionBody');
  if (!tbody) return;

  const periodSelect = document.getElementById('commissionPeriod');
  const statusSelect = document.getElementById('commissionStatus');
  const wht50Select = document.getElementById('commissionWht50Status');
  const immediate = !!App.Config?.COMMISSION_PAY_THROUGH_WALLET;
  const COLS = 8;

  if (immediate && statusSelect) {
    // In wallet-clear mode: there is no "pending -> pay" workflow.
    statusSelect.querySelector('option[value="pending"]')?.remove();
  }

  function fillPeriods() {
    if (!periodSelect) return;
    const now = new Date();
    periodSelect.innerHTML = '<option value="">ทุกเดือน</option>';
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('th-TH', { year: 'numeric', month: 'long' });
      periodSelect.innerHTML += `<option value="${val}">${label}</option>`;
    }
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

  async function load() {
    App.TableUI.showLoading(tbody, COLS);
    const filters = {};
    if (periodSelect?.value) filters.period = periodSelect.value;
    if (statusSelect?.value) filters.status = statusSelect.value;
    let list = await App.CommissionService.getAllCommissions(filters);
    const whtFilter = wht50Select?.value || '';
    if (whtFilter) list = list.filter((c) => matchesWht50Filter(c, whtFilter));

    if (!list.length) {
      App.TableUI.showEmpty(tbody, COLS);
      return;
    }
    tbody.innerHTML = list.map((c) => {
      const wht = wht50Meta(c);
      const whtCell = c.wht50Id
        ? `<div class="admin-wht50-cell">
             <span class="status-pill ${wht.pill}">${wht.label}</span>
             <button type="button" class="btn-secondary btn-sm" data-wht50="${c.wht50Id}">ดู/พิมพ์</button>
           </div>`
        : `<span class="status-pill ${wht.pill}">${wht.label}</span>`;

      return `
      <tr data-id="${c.id}">
        <td>
          <div class="admin-agent-cell">
            <span class="admin-agent-cell__code">${c.agentCode || '-'}</span>
            <span class="admin-agent-cell__name">${c.agentName || '-'}</span>
          </div>
        </td>
        <td>${c.policyNo}</td>
        <td>${c.policyTypeLabel}</td>
        <td class="col-money">${App.Shell.formatCurrency(c.premium)}</td>
        <td class="col-money">${App.Shell.formatCurrency(c.amount)}</td>
        <td><span class="status-pill ${c.status}">${statusLabel(c.status)}</span></td>
        <td>${whtCell}</td>
        <td>${c.status === 'pending' ? '<button type="button" class="btn-primary btn-sm btn-pay">บันทึกจ่ายแล้ว</button>' : '-'}</td>
      </tr>`;
    }).join('');

    tbody.querySelectorAll('[data-wht50]').forEach((btn) => {
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

    tbody.querySelectorAll('.btn-pay').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.closest('tr').dataset.id;
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

  fillPeriods();
  periodSelect?.addEventListener('change', load);
  statusSelect?.addEventListener('change', load);
  wht50Select?.addEventListener('change', load);
  window.addEventListener('wht50:printed', () => { load(); });
  load();
})();
