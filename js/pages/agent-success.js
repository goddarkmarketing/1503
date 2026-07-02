document.addEventListener('DOMContentLoaded', () => {
  if (window.App) App.RoleGuard.enforce('agent', { basePath: '../' });

  const raw = sessionStorage.getItem('lastIssuedPolicy');
  const meta = document.getElementById('successMeta');
  if (!raw) {
    if (meta) meta.textContent = 'ไม่พบข้อมูลกรมธรรม์';
    return;
  }
  const p = JSON.parse(raw);
  if (meta) {
    meta.innerHTML = `
      เลขที่ <strong>${p.id}</strong><br>
      ทะเบียน ${p.plate} · ${p.insurer}<br>
      เบี้ยรวม ${Number(p.premium).toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท
    `;
  }
  if (typeof lucide !== 'undefined') lucide.createIcons();
});
