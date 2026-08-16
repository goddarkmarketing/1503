window.App = window.App || {};

App.CreditSlip = {
  MAX_BYTES: 5 * 1024 * 1024,
  ALLOWED: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],

  escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  },

  isPdf(name, src) {
    return /\.pdf$/i.test(name || '') || String(src || '').startsWith('data:application/pdf');
  },

  hasSlip(entry) {
    return !!(entry && (entry.hasSlip || entry.slipDataUrl || entry.slipUrl));
  },

  buttonHtml(entry) {
    if (!this.hasSlip(entry)) return '-';
    return `<button type="button" class="btn-text btn-view-ledger-slip" data-id="${this.escapeHtml(entry.id)}">ดูสลิป</button>`;
  },

  readFile(file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error('ไม่พบไฟล์'));
        return;
      }
      if (!this.ALLOWED.includes(file.type)) {
        reject(new Error('รองรับเฉพาะไฟล์ JPG, PNG, WEBP หรือ PDF'));
        return;
      }
      if (file.size > this.MAX_BYTES) {
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
  },

  async resolve(entry) {
    if (!entry) throw new Error('ไม่พบรายการ');
    if (entry.slipDataUrl) {
      return { url: entry.slipDataUrl, name: entry.slipFileName || 'slip', revoke: false };
    }
    const path = entry.slipUrl || (entry.id ? `/credit-ledger/${encodeURIComponent(entry.id)}/slip` : '');
    if (!path) throw new Error('ไม่มีหลักฐานการโอนเงิน');
    const blob = await App.API.requestBlob(path);
    return {
      url: URL.createObjectURL(blob),
      name: entry.slipFileName || 'slip',
      revoke: true
    };
  },

  async open(entry) {
    const resolved = await this.resolve(entry);
    const isPdf = this.isPdf(resolved.name, resolved.url);
    const titleName = resolved.name ? ` — ${this.escapeHtml(resolved.name)}` : '';
    const safeUrl = String(resolved.url).replace(/"/g, '&quot;');

    this.closeLightbox();
    this.ensureStyles();

    const overlay = document.createElement('div');
    overlay.className = 'credit-slip-lightbox';
    overlay.innerHTML = `
      <div class="credit-slip-lightbox__dialog" role="dialog" aria-modal="true" aria-label="หลักฐานการโอนเงิน">
        <div class="credit-slip-lightbox__head">
          <h2>หลักฐานการโอนเงิน${titleName}</h2>
          <button type="button" class="credit-slip-lightbox__close" aria-label="ปิด">&times;</button>
        </div>
        <div class="credit-slip-lightbox__body">
          ${isPdf
            ? `<embed src="${safeUrl}" type="application/pdf">`
            : `<img src="${safeUrl}" alt="สลิปโอนเงิน">`}
        </div>
      </div>
    `;

    const close = () => this.closeLightbox();
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });
    overlay.querySelector('.credit-slip-lightbox__close')?.addEventListener('click', close);
    this._onKey = (e) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', this._onKey);

    document.body.appendChild(overlay);
    this._lightbox = overlay;
    this._revokeUrl = resolved.revoke ? resolved.url : null;
  },

  closeLightbox() {
    if (this._onKey) {
      document.removeEventListener('keydown', this._onKey);
      this._onKey = null;
    }
    this._lightbox?.remove();
    this._lightbox = null;
    if (this._revokeUrl) {
      URL.revokeObjectURL(this._revokeUrl);
      this._revokeUrl = null;
    }
  },

  ensureStyles() {
    if (document.getElementById('credit-slip-lightbox-css')) return;
    const style = document.createElement('style');
    style.id = 'credit-slip-lightbox-css';
    style.textContent = `
      .credit-slip-lightbox{position:fixed;inset:0;z-index:12000;background:rgba(15,23,42,.72);display:flex;align-items:center;justify-content:center;padding:20px}
      .credit-slip-lightbox__dialog{width:min(720px,100%);max-height:92vh;background:#fff;border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 24px 64px rgba(15,23,42,.35)}
      .credit-slip-lightbox__head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 16px;border-bottom:1px solid #e5e7eb;flex-shrink:0}
      .credit-slip-lightbox__head h2{margin:0;font-size:1rem;font-weight:600;color:#0f172a}
      .credit-slip-lightbox__close{width:36px;height:36px;border:0;border-radius:10px;background:#f1f5f9;color:#64748b;font-size:1.4rem;line-height:1;cursor:pointer}
      .credit-slip-lightbox__close:hover{background:#e2e8f0;color:#0f172a}
      .credit-slip-lightbox__body{padding:16px;overflow:auto;text-align:center;background:#f8fafc}
      .credit-slip-lightbox__body img{display:block;margin:0 auto;max-width:100%;max-height:75vh;height:auto;border-radius:8px;background:#fff}
      .credit-slip-lightbox__body embed{width:100%;height:75vh;min-height:420px;border:0;background:#fff}
    `;
    document.head.appendChild(style);
  },

  bindButtons(root, entries) {
    if (!root) return;
    const map = {};
    (entries || []).forEach((e) => {
      if (e?.id) map[e.id] = e;
    });
    root.querySelectorAll('.btn-view-ledger-slip').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const entry = map[btn.dataset.id];
        if (!entry) return;
        try {
          await this.open(entry);
        } catch (err) {
          alert(err.message || 'เปิดสลิปไม่สำเร็จ');
        }
      });
    });
  }
};
