(function () {
  const tbody = document.getElementById('wht50TableBody');
  if (!tbody || !window.App) return;

  const yearSelect = document.getElementById('wht50Year');
  const monthSelect = document.getElementById('wht50Month');
  const statusSelect = document.getElementById('wht50PrintStatus');
  const searchInput = document.getElementById('wht50Search');
  const COLS = 8;
  const THAI_MONTHS = ['', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

  let cache = [];
  let page = 1;

  const toast = (msg, type) => {
    if (App.AdminUtils?.showToast) App.AdminUtils.showToast(msg, type || 'success');
    else alert(msg);
  };

  function formatMoney(n) {
    return Number(n || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function issuedParts(doc) {
    const raw = String(doc.issuedAt || doc.paidAt || '');
    if (/^\d{4}-\d{2}/.test(raw)) {
      return {
        ceYear: Number(raw.slice(0, 4)),
        beYear: String(Number(raw.slice(0, 4)) + 543),
        month: raw.slice(5, 7)
      };
    }
    return {
      ceYear: null,
      beYear: String(doc.bookNo || ''),
      month: ''
    };
  }

  function printMeta(doc) {
    if (doc.printedAt) return { label: 'พิมพ์แล้ว', pill: 'wht50-printed' };
    return { label: 'ยังไม่พิมพ์', pill: 'wht50-unprinted' };
  }

  function agentLabel(doc) {
    return doc.payee?.name || doc.agentCode || doc.agentId || '-';
  }

  function fillYears(list) {
    if (!yearSelect) return;
    const years = new Set();
    list.forEach((d) => {
      const p = issuedParts(d);
      if (p.beYear) years.add(String(p.beYear));
    });
    years.add(String(new Date().getFullYear() + 543));
    const sorted = [...years].sort((a, b) => Number(b) - Number(a));
    const prev = yearSelect.value;
    yearSelect.innerHTML = '<option value="">ทุกปี</option>' + sorted.map((y) => `<option value="${y}">${y}</option>`).join('');
    if (prev && [...yearSelect.options].some((o) => o.value === prev)) yearSelect.value = prev;
    else yearSelect.value = String(new Date().getFullYear() + 543);
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
        doc.agentCode,
        agentLabel(doc),
        doc.refNote,
        String(doc.paidAmount ?? ''),
        String(doc.taxAmount ?? '')
      ].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  }

  function filteredList() {
    return cache.filter(matchesFilters);
  }

  function updateStats(list) {
    const paid = list.reduce((s, d) => s + (Number(d.paidAmount) || 0), 0);
    const tax = list.reduce((s, d) => s + (Number(d.taxAmount) || 0), 0);
    const unprinted = list.filter((d) => !d.printedAt).length;
    const set = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };
    set('statWht50Count', String(list.length));
    set('statWht50Paid', formatMoney(paid));
    set('statWht50Tax', formatMoney(tax));
    set('statWht50Unprinted', String(unprinted));
  }

  async function openDoc(id) {
    const doc = await App.Wht50Service.getById(id);
    App.Wht50Service.print(doc);
  }

  async function downloadDoc(id, btn) {
    const label = btn?.innerHTML;
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'PDF...';
    }
    try {
      const doc = await App.Wht50Service.getById(id);
      await App.Wht50Service.downloadPdf(doc);
      toast('ดาวน์โหลด PDF แล้ว');
    } catch (err) {
      console.error(err);
      toast(err.message || 'ดาวน์โหลด PDF ไม่สำเร็จ', 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = label || 'PDF';
        if (typeof lucide !== 'undefined') lucide.createIcons();
      }
    }
  }

  function renderTable() {
    const filtered = filteredList();
    updateStats(filtered);
    const pg = App.TableUI.paginate(filtered, page);
    if (!pg.items.length) {
      App.TableUI.showEmpty(tbody, COLS, 'ไม่พบเอกสาร 50 ทวิในช่วงที่เลือก');
      document.getElementById('wht50Pagination').innerHTML = '';
      return;
    }

    tbody.innerHTML = pg.items.map((d) => {
      const print = printMeta(d);
      const issued = d.issuedAt ? App.AdminUtils.formatThaiDate(d.issuedAt) : '-';
      return `
        <tr data-id="${d.id}">
          <td>${d.docNo || d.id}</td>
          <td>
            <div class="admin-cell-title">${agentLabel(d)}</div>
            <div class="admin-cell-sub">${d.agentCode || ''}</div>
          </td>
          <td>${d.policyNo || '-'}</td>
          <td class="col-center">${issued}</td>
          <td class="col-money">${formatMoney(d.paidAmount)}</td>
          <td class="col-money">${formatMoney(d.taxAmount)}</td>
          <td class="col-center"><span class="status-pill ${print.pill}">${print.label}</span></td>
          <td class="col-center">
            <div class="admin-row-actions">
              <button type="button" class="btn-secondary btn-sm" data-wht50-view="${d.id}" title="ดู/พิมพ์">ดู</button>
              <button type="button" class="btn-primary btn-sm" data-wht50-pdf="${d.id}" title="ดาวน์โหลด PDF">PDF</button>
            </div>
          </td>
        </tr>`;
    }).join('');

    tbody.querySelectorAll('[data-wht50-view]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        try {
          await openDoc(btn.dataset.wht50View);
        } catch (err) {
          toast(err.message || 'เปิดเอกสารไม่สำเร็จ', 'error');
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

  function periodLabel() {
    const year = yearSelect?.value || 'ทุกปี';
    const month = monthSelect?.value || '';
    if (!month) return `ปี ${year}`;
    const name = THAI_MONTHS[Number(month)] || month;
    return `${name} ${year}`;
  }

  async function exportSummaryPdf() {
    const list = filteredList();
    if (!list.length) {
      toast('ไม่มีข้อมูลให้ส่งออก', 'error');
      return;
    }
    const btn = document.getElementById('btnWht50ExportSummary');
    const htmlBtn = btn?.innerHTML;
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'กำลังสร้าง PDF...';
    }

    try {
      if (typeof html2pdf !== 'function') {
        const base = document.body.dataset.basePath || '../';
        await new Promise((resolve, reject) => {
          const s = document.createElement('script');
          s.src = `${base}js/vendor/html2pdf.bundle.min.js`;
          s.onload = resolve;
          s.onerror = () => reject(new Error('โหลดโมดูล PDF ไม่สำเร็จ'));
          document.head.appendChild(s);
        });
      }

      const paid = list.reduce((s, d) => s + (Number(d.paidAmount) || 0), 0);
      const tax = list.reduce((s, d) => s + (Number(d.taxAmount) || 0), 0);
      const rows = list.map((d, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${d.docNo || d.id}</td>
          <td>${agentLabel(d)}</td>
          <td>${d.policyNo || '-'}</td>
          <td>${d.issuedAt ? App.AdminUtils.formatThaiDate(d.issuedAt) : '-'}</td>
          <td style="text-align:right">${formatMoney(d.paidAmount)}</td>
          <td style="text-align:right">${formatMoney(d.taxAmount)}</td>
          <td>${printMeta(d).label}</td>
        </tr>`).join('');

      const host = document.createElement('div');
      host.style.cssText = 'position:fixed;left:-10000px;top:0;width:210mm;padding:16px;background:#fff;font-family:Sarabun,Tahoma,sans-serif;color:#0f172a;';
      host.innerHTML = `
        <h1 style="margin:0 0 4px;font-size:18px;">สรุปยอดหนังสือ 50 ทวิ</h1>
        <p style="margin:0 0 12px;font-size:12px;color:#64748b;">ช่วงเวลา: ${periodLabel()} · สร้างเมื่อ ${App.AdminUtils.formatThaiDate(new Date().toISOString().slice(0, 10))}</p>
        <div style="display:flex;gap:16px;margin-bottom:14px;font-size:13px;">
          <div>เอกสาร <strong>${list.length}</strong></div>
          <div>ยอดจ่ายรวม <strong>${formatMoney(paid)}</strong></div>
          <div>ภาษีรวม <strong>${formatMoney(tax)}</strong></div>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:11px;">
          <thead>
            <tr>
              <th style="border-bottom:1px solid #cbd5e1;text-align:left;padding:6px;">#</th>
              <th style="border-bottom:1px solid #cbd5e1;text-align:left;padding:6px;">เลขที่</th>
              <th style="border-bottom:1px solid #cbd5e1;text-align:left;padding:6px;">นายหน้า</th>
              <th style="border-bottom:1px solid #cbd5e1;text-align:left;padding:6px;">กรมธรรม์</th>
              <th style="border-bottom:1px solid #cbd5e1;text-align:left;padding:6px;">วันที่</th>
              <th style="border-bottom:1px solid #cbd5e1;text-align:right;padding:6px;">จ่าย</th>
              <th style="border-bottom:1px solid #cbd5e1;text-align:right;padding:6px;">ภาษี</th>
              <th style="border-bottom:1px solid #cbd5e1;text-align:left;padding:6px;">สถานะ</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>`;
      document.body.appendChild(host);

      await html2pdf().set({
        margin: 10,
        filename: `สรุป50ทวิ-${periodLabel().replace(/\s+/g, '-')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
      }).from(host).save();

      host.remove();
      toast('ส่งออกสรุป PDF แล้ว');
    } catch (err) {
      console.error(err);
      toast(err.message || 'ส่งออกสรุปไม่สำเร็จ', 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = htmlBtn || 'ส่งออกสรุป PDF';
        if (typeof lucide !== 'undefined') lucide.createIcons();
      }
    }
  }

  async function load() {
    App.TableUI.showLoading(tbody, COLS);
    try {
      cache = await App.Wht50Service.list();
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
  document.getElementById('btnWht50ExportSummary')?.addEventListener('click', exportSummaryPdf);
  [yearSelect, monthSelect, statusSelect].forEach((el) => {
    el?.addEventListener('change', () => { page = 1; renderTable(); });
  });
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
