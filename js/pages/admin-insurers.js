document.addEventListener('DOMContentLoaded', async () => {
  const tbody = document.getElementById('insurersTableBody');
  if (!tbody) return;
  App.TableUI.showLoading(tbody, 5);
  const insurers = await App.InsurerService.getInsurers();
  tbody.innerHTML = insurers.map((ins) => `
    <tr data-insurer-id="${ins.id}">
      <td>${ins.name}</td>
      <td>${ins.apiProvider || '-'}</td>
      <td>${ins.products.join(', ')}</td>
      <td>
        <label class="toggle-switch" title="เปิด/ปิด API">
          <input type="checkbox" class="api-toggle" ${ins.apiEnabled ? 'checked' : ''}>
          <span class="toggle-slider"></span>
        </label>
      </td>
      <td>
        <div class="btn-group">
          <button type="button" class="btn-secondary btn-sm btn-config" data-id="${ins.id}">ตั้งค่า</button>
          <button type="button" class="btn-secondary btn-sm btn-test" data-id="${ins.id}">ทดสอบ</button>
        </div>
      </td>
    </tr>
  `).join('');

  document.querySelectorAll('.api-toggle').forEach((input) => {
    input.addEventListener('change', async (e) => {
      const id = e.target.closest('tr').dataset.insurerId;
      try {
        await App.InsurerService.updateInsurer(id, { apiEnabled: e.target.checked });
      } catch (err) {
        e.target.checked = !e.target.checked;
        alert(err.message);
      }
    });
  });

  document.querySelectorAll('.btn-config').forEach((btn) => {
    btn.addEventListener('click', () => openConfig(btn.dataset.id, insurers));
  });
  document.querySelectorAll('.btn-test').forEach((btn) => {
    btn.addEventListener('click', () => testApi(btn.dataset.id));
  });
});

function openConfig(insurerId, insurers) {
  const ins = insurers.find((i) => i.id === insurerId);
  if (!ins) return;
  const overlay = App.Modal.open({
    title: `ตั้งค่า API — ${ins.name}`,
    body: `
      <form id="insurerConfigForm" class="admin-form-grid" style="max-width:none;grid-template-columns:1fr">
        <div class="form-field"><label>API Provider</label><input name="apiProvider" value="${ins.apiProvider || ''}"></div>
        <div class="form-field"><label>Endpoint</label><input name="apiEndpoint" value="${ins.apiEndpoint || ''}"></div>
        <div class="form-field"><label>Timeout (วินาที)</label><input type="number" name="apiTimeout" value="${ins.apiTimeout || 30}"></div>
      </form>
    `,
    footer: `<button type="button" class="btn-secondary" data-dismiss>ยกเลิก</button><button type="button" class="btn-primary" id="saveInsurer">บันทึก</button>`
  });
  overlay.querySelector('[data-dismiss]')?.addEventListener('click', () => App.Modal.close());
  overlay.querySelector('#saveInsurer')?.addEventListener('click', async () => {
    const f = overlay.querySelector('#insurerConfigForm');
    await App.InsurerService.updateInsurer(insurerId, {
      apiProvider: f.apiProvider.value,
      apiEndpoint: f.apiEndpoint.value,
      apiTimeout: parseInt(f.apiTimeout.value, 10) || 30
    });
    App.Modal.close();
    location.reload();
  });
}

async function testApi(insurerId) {
  try {
    const res = await App.InsurerService.testConnection(insurerId);
    alert(res.success ? `✓ ${res.message}${res.latencyMs ? ` (${res.latencyMs}ms)` : ''}` : `✗ ${res.message}`);
  } catch (err) {
    alert(err.message);
  }
}
