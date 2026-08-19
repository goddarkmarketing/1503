window.App = window.App || {};

App.Modal = {
  _overlay: null,

  open({ title, body, footer, size }) {
    this.close();

    const overlay = document.createElement('div');
    overlay.className = 'admin-modal-overlay';
    overlay.innerHTML = `
      <div class="admin-modal ${size || ''}" role="dialog" aria-modal="true">
        <div class="admin-modal-header">
          <h2 class="admin-modal-title">${title || ''}</h2>
          <button type="button" class="admin-modal-close" aria-label="ปิด">&times;</button>
        </div>
        <div class="admin-modal-body">${body || ''}</div>
        ${footer ? `<div class="admin-modal-footer">${footer}</div>` : ''}
      </div>
    `;

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.close();
    });
    overlay.querySelector('.admin-modal-close')?.addEventListener('click', () => this.close());
    overlay.querySelectorAll('[data-modal-close]').forEach((btn) => {
      btn.addEventListener('click', () => this.close());
    });

    document.body.appendChild(overlay);
    document.body.classList.add('modal-open');
    this._overlay = overlay;
    return overlay;
  },

  close() {
    this._overlay?.remove();
    this._overlay = null;
    document.body.classList.remove('modal-open');
  },

  getEl() {
    return this._overlay;
  }
};
