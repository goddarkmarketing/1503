(function () {
  const tbody = document.getElementById('wht50TableBody');
  if (!tbody) return;

  const yearSelect = document.getElementById('wht50Year');
  const monthSelect = document.getElementById('wht50Month');
  const statusSelect = document.getElementById('wht50PrintStatus');
  const searchInput = document.getElementById('wht50Search');
  const COLS = 7;

  let cache = [];
  let page = 1;

  function formatMoney(n) {
    return App.Shell.formatCurrency(n);
  }

  function printMeta(doc) {
    if (doc.printedAt) {
      return { key: 'printed', label: 'พิมพ์แล้ว', pill: 'wht50-printed' };
    }
    return { key: 'unprinted', label: 'ยังไม่พิมพ์', pill: 'wht50-unprinted' };
  }

  function issuedParts(doc) {
    const raw = String(doc.issuedAt || doc.paidAt || '');
    if (/^\d{4}-\d{2}/.test(raw)) {
      return {
        beYear: String(Number(raw.slice(0, 4)) + 543),
        month: raw.slice(5, 7)
      };
    }
    return { beYear: String(doc.bookNo || ''), month: '' };
  }

  function fillYears(list) {
    if (!yearSelect) return;
    const years = new Set();
    list.forEach((d) => {
      const p = issuedParts(d);
      if (p.beYear) years.add(p.beYear);
    });
    const nowBe = new Date().getFullYear() + 543;
    years.add(String(nowBe));
    const sorted = [...years].map(String).sort((a, b) => Number(b) - Number(a));
    const prev = yearSelect.value;
    yearSelect.innerHTML = '<option value="">ทุกปี</option>' + sorted.map((y) => `<option value="${y}">${y}</option>`).join('');
    if (prev && [...yearSelect.options].some((o) => o.value === prev)) yearSelect.value = prev;
  }

  function matchesFilters(doc) {
    const year = yearSelect?.value || '';
    const month = monthSelect?.value || '';
    const status = statusSelect?.value || '';
    const q = String(searchInput?.value || '').trim().toLowerCase();
    const parts = issuedParts(doc);

    if (year && parts.beYear !== year) return false;
    if (month && parts.month !== month) return false;
    if (status === 'printed' && !doc.printedAt) return false;
    if (status === 'unprinted' && doc.printedAt) return false;
    if (q) {
      const hay = [
        doc.docNo,
        doc.policyNo,
        doc.commissionId,
        doc.refNote,
        String(doc.paidAmount ?? ''),
        String(doc.taxAmount ?? '')
      ].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  }

  function updateStats(allList, filtered) {
    const el = (id) => document.getElementById(id);
    const printed = allList.filter((d) => d.printedAt).length;
    const paid = filtered.reduce((s, d) => s + (Number(d.paidAmount) || 0), 0);
    if (el('statWht50Total')) el('statWht50Total').textContent = String(allList.length);
    if (el('statWht50Printed')) el('statWht50Printed').textContent = String(printed);
    if (el('statWht50Unprinted')) el('statWht50Unprinted').textContent = String(allList.length - printed);
    if (el('statWht50PaidTotal')) el('statWht50PaidTotal').textContent = formatMoney(paid);
  }

  async function downloadDoc(id, btn) {
    const label = btn?.innerHTML;
    if (btn) {
      btn.disabled = true;
      btn.textContent = '...';
    }
    try {
      const doc = await App.Wht50Service.getById(id);
      await App.Wht50Service.downloadPdf(doc);
    } catch (err) {
      alert(err.message || 'ดาวน์โหลด PDF ไม่สำเร็จ');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = label || 'PDF';
      }
    }
  }

  function renderTable() {
    const filtered = cache.filter(matchesFilters);
    updateStats(cache, filtered);
    const pg = App.TableUI.paginate(filtered, page);
    if (!pg.items.length) {
      App.TableUI.showEmpty(tbody, COLS, 'ยังไม่มีหนังสือ 50 ทวิ');
      document.getElementById('wht50Pagination').innerHTML = '';
      return;
    }

    tbody.innerHTML = pg.items.map((d) => {
      const print = printMeta(d);
      const issued = d.issuedAt ? App.AdminUtils.formatThaiDate(d.issuedAt) : '-';
      return `
        <tr data-id="${d.id}">
          <td>${d.docNo || d.id}</td>
          <td>${d.policyNo || '-'}</td>
          <td class="col-center">${issued}</td>
          <td class="col-money">${formatMoney(d.paidAmount)}</td>
          <td class="col-money">${formatMoney(d.taxAmount)}</td>
          <td class="col-center"><span class="status-pill ${print.pill}">${print.label}</span></td>
          <td class="col-center">
            <div class="admin-row-actions">
              <button type="button" class="btn-success btn-sm" data-wht50="${d.id}">ดู/พิมพ์</button>
              <button type="button" class="btn-secondary btn-sm" data-wht50-pdf="${d.id}">PDF</button>
            </div>
          </td>
        </tr>`;
    }).join('');

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
    tbody.querySelectorAll('[data-wht50-pdf]').forEach((btn) => {
      btn.addEventListener('click', () => downloadDoc(btn.dataset.wht50Pdf, btn));
    });

    App.TableUI.renderPagination(document.getElementById('wht50Pagination'), {
      ...pg,
      onChange: (p) => { page = p; renderTable(); }
    });
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  async function load() {
    App.TableUI.showLoading(tbody, COLS);
    try {
      cache = await App.Wht50Service.listMine();
      fillYears(cache);
      page = 1;
      renderTable();
    } catch (err) {
      App.TableUI.showEmpty(tbody, COLS, err.message || 'โหลดรายการไม่สำเร็จ');
    }
  }

  document.getElementById('btnWht50Search')?.addEventListener('click', () => {
    page = 1;
    renderTable();
  });
  yearSelect?.addEventListener('change', () => { page = 1; renderTable(); });
  monthSelect?.addEventListener('change', () => { page = 1; renderTable(); });
  statusSelect?.addEventListener('change', () => { page = 1; renderTable(); });
  searchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      page = 1;
      renderTable();
    }
  });
  window.addEventListener('wht50:printed', () => { load(); });

  load();
})();
