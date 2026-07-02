document.addEventListener('DOMContentLoaded', async () => {
  const tbody = document.getElementById('usersTableBody');
  const users = await App.AgentService.getAdminUsers();
  tbody.innerHTML = users.map((u) => `
    <tr><td>${u.username}</td><td>${u.name}</td><td>${u.roleLabel}</td>
    <td><span class="status-pill active">${u.status === 'active' ? 'ใช้งาน' : 'ระงับ'}</span></td></tr>
  `).join('');
});
