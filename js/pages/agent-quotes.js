/**
 * Agent quote history — list / view / print / download BKI quotations.
 */
document.addEventListener('DOMContentLoaded', async () => {
  let page = 1;
  let cache = [];
  let activeQuote = null;

  const toast = (message, type = 'success') => {
    if (App.AdminUtils?.showToast) {
      App.AdminUtils.showToast(message, type);
      return;
    }
    if (App.TableUI?.showToast) {
      App.TableUI.showToast(message, type);
    }
  };

  const statusLabel = (status, validUntil) => {
    const today = new Date().toISOString().slice(0, 10);
    if (status === 'open' && validUntil && String(validUntil).slice(0, 10) < today) {
      return { key: 'expired', text: 'หมดอายุ' };
    }
    const map = {
      open: { key: 'open', text: 'เปิดอยู่' },
      expired: { key: 'expired', text: 'หมดอายุ' },
      converted: { key: 'converted', text: 'ออกกรมธรรม์แล้ว' },
      cancelled: { key: 'cancelled', text: 'ยกเลิก' }
    };
    return map[status] || { key: status || 'open', text: status || '—' };
  };

  const money = (n) => {
    if (App.Shell?.formatCurrency) return App.Shell.formatCurrency(n);
    return Number(n || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const thaiDate = (value) => {
    if (App.VoluntaryBkiQuote?.formatThaiDate) {
      return App.VoluntaryBkiQuote.formatThaiDate(value);
    }
    if (App.AdminUtils?.formatThaiDate) {
      return App.AdminUtils.formatThaiDate(value);
    }
    return value || '—';
  };

  const issuerLabel = (q) => {
    const name = q.agentName || q.snapshot?.agent?.label || '';
    const code = q.agentCode || q.snapshot?.agent?.code || '';
    if (name && code) return `${name} (${code})`;
    return name || code || '—';
  };

  const closePreview = () => {
    activeQuote = null;
    const card = document.getElementById('quotePreviewCard');
    const body = document.getElementById('quotePreviewBody');
    if (card) card.hidden = true;
    if (body) body.innerHTML = '';
  };

  const openPreview = async (quoteId) => {
    try {
      const quote = await App.MotorBkiService.getQuote(quoteId);
      activeQuote = quote;
      const card = document.getElementById('quotePreviewCard');
      const body = document.getElementById('quotePreviewBody');
      const meta = document.getElementById('quotePreviewMeta');
      if (!card || !body) return;
      meta.textContent = `เลขที่ ${quote.id || '—'} · ออกโดย ${issuerLabel(quote)} · ${thaiDate(quote.createdAt)}`;
      body.innerHTML = App.VoluntaryBkiQuote.buildQuoteDocHtml(quote);
      card.hidden = false;
      card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      toast(err.message || 'โหลดใบเสนอราคาไม่สำเร็จ', 'error');
    }
  };

  const render = () => {
    const tbody = document.getElementById('quoteTableBody');
    const pg = App.TableUI.paginate(cache, page, 10);
    if (!pg.items.length) {
      App.TableUI.showEmpty(tbody, 10, 'ยังไม่มีใบเสนอราคา');
      document.getElementById('quotePagination').innerHTML = '';
      return;
    }

    tbody.innerHTML = pg.items.map((q) => {
      const st = statusLabel(q.status, q.validUntil);
      return `
        <tr data-quote-id="${App.VoluntaryBkiQuote.escapeAttr(q.id)}">
          <td><strong>${App.VoluntaryBkiQuote.escapeHtml(q.id || '—')}</strong></td>
          <td>${App.VoluntaryBkiQuote.escapeHtml(thaiDate(q.createdAt))}</td>
          <td>${App.VoluntaryBkiQuote.escapeHtml(issuerLabel(q))}</td>
          <td>${App.VoluntaryBkiQuote.escapeHtml(q.customerName || '—')}</td>
          <td>${App.VoluntaryBkiQuote.escapeHtml(q.plate || q.licensePlate || '—')}</td>
          <td>${App.VoluntaryBkiQuote.escapeHtml(q.planLabel || q.planCode || '—')}</td>
          <td>${money(q.premiumTotal ?? q.premium)}</td>
          <td>${App.VoluntaryBkiQuote.escapeHtml(thaiDate(q.validUntil))}</td>
          <td><span class="status-pill ${st.key}">${st.text}</span></td>
          <td>
            <div class="bki-quote-history__row-actions">
              <button type="button" class="btn-secondary btn-sm" data-action="view">ดู</button>
              <button type="button" class="btn-secondary btn-sm" data-action="print">พิมพ์</button>
              <button type="button" class="btn-secondary btn-sm" data-action="download">ดาวน์โหลด</button>
            </div>
          </td>
        </tr>`;
    }).join('');

    App.TableUI.renderPagination(document.getElementById('quotePagination'), {
      ...pg,
      onChange: (p) => {
        page = p;
        render();
      }
    });
  };

  const search = async () => {
    const tbody = document.getElementById('quoteTableBody');
    App.TableUI.showLoading(tbody, 10);
    closePreview();
    try {
      const q = document.getElementById('quoteSearch')?.value.trim() || '';
      const status = document.getElementById('quoteStatus')?.value || '';
      cache = await App.MotorBkiService.listQuotes({ q, status });
      if (!Array.isArray(cache)) cache = [];
      page = 1;
      render();
    } catch (err) {
      App.TableUI.showEmpty(tbody, 10, err.message || 'โหลดรายการไม่สำเร็จ');
      document.getElementById('quotePagination').innerHTML = '';
      toast(err.message || 'โหลดรายการไม่สำเร็จ', 'error');
    }
  };

  document.getElementById('btnQuoteSearch')?.addEventListener('click', search);
  document.getElementById('quoteSearch')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') search();
  });
  document.getElementById('quoteStatus')?.addEventListener('change', search);

  document.getElementById('quoteTableBody')?.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action]');
    const row = e.target.closest('tr[data-quote-id]');
    if (!btn || !row) return;
    const id = row.dataset.quoteId;
    const action = btn.dataset.action;
    try {
      const quote = cache.find((item) => item.id === id) || await App.MotorBkiService.getQuote(id);
      if (action === 'view') {
        await openPreview(id);
        return;
      }
      if (action === 'print') {
        if (!App.VoluntaryBkiQuote.printQuoteDoc(quote)) {
          toast('กรุณาอนุญาตป๊อปอัปเพื่อพิมพ์', 'error');
        }
        return;
      }
      if (action === 'download') {
        if (App.VoluntaryBkiQuote.downloadQuoteDoc(quote)) {
          toast('ดาวน์โหลดใบเสนอราคาแล้ว');
        }
      }
    } catch (err) {
      toast(err.message || 'ดำเนินการไม่สำเร็จ', 'error');
    }
  });

  document.getElementById('btnQuotePreviewClose')?.addEventListener('click', closePreview);
  document.getElementById('btnQuotePreviewPrint')?.addEventListener('click', () => {
    if (!activeQuote) return;
    if (!App.VoluntaryBkiQuote.printQuoteDoc(activeQuote)) {
      toast('กรุณาอนุญาตป๊อปอัปเพื่อพิมพ์', 'error');
    }
  });
  document.getElementById('btnQuotePreviewDownload')?.addEventListener('click', () => {
    if (!activeQuote) return;
    if (App.VoluntaryBkiQuote.downloadQuoteDoc(activeQuote)) {
      toast('ดาวน์โหลดใบเสนอราคาแล้ว');
    }
  });

  await search();
});
