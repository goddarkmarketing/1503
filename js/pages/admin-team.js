(function () {
  const root = document.getElementById('teamHierarchyRoot');
  if (!root) return;

  async function load() {
    root.innerHTML = '<p class="admin-hint">กำลังโหลด...</p>';
    const teams = await App.AdminReportService.getTeamHierarchy();
    if (!teams.length) {
      root.innerHTML = '<p class="admin-hint">ไม่มีข้อมูลทีม</p>';
      return;
    }
    root.innerHTML = teams.map((t) => `
      <div class="admin-section team-hierarchy-block">
        <h2 class="admin-section-title">${t.leaderCode} — ${t.leaderName} <span class="admin-hint">(${t.memberCount} ลูกทีม)</span></h2>
        <div class="data-table-wrap">
          <table class="data-table">
            <thead><tr><th>รหัส</th><th>ชื่อ</th><th>โทรศัพท์</th><th>กรมธรรม์</th><th>เบี้ยรวม</th><th>สถานะ</th></tr></thead>
            <tbody>
              ${t.members.map((m) => `
                <tr>
                  <td>${m.code}</td>
                  <td>${m.name}</td>
                  <td>${m.phone || '-'}</td>
                  <td class="col-center">${m.policies || 0}</td>
                  <td class="col-money">${App.Shell.formatCurrency(m.premium || 0)}</td>
                  <td><span class="status-pill ${m.status}">${m.status === 'active' ? 'ใช้งาน' : 'ระงับ'}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `).join('');
  }

  load();
})();
