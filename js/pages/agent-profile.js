document.addEventListener('DOMContentLoaded', async () => {
  const user = App.AuthService.getCurrentUser();
  const form = document.getElementById('profileForm');
  const msg = document.getElementById('profileMessage');
  const basePath = App.Paths.detectBasePath();

  if (!form || !user) return;

  form.name.value = user.name || '';
  form.email.value = user.email || '';
  form.phone.value = user.phone || '';
  form.agentCode.value = user.agentCode || '';
  form.agentCode.readOnly = true;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.textContent = '';
    msg.className = 'admin-hint';

    try {
      const updated = await App.AgentService.updateProfile({
        name: form.name.value.trim(),
        email: form.email.value.trim(),
        phone: form.phone.value.trim()
      });
      App.Session.updateUser(updated);
      App.Shell.init({ basePath, profilePath: App.Paths.agentProfile() });
      msg.textContent = 'บันทึกโปรไฟล์เรียบร้อย';
      msg.style.color = 'var(--accent-green)';
    } catch (err) {
      msg.textContent = err.message || 'บันทึกไม่สำเร็จ';
      msg.style.color = 'var(--accent-red)';
    }
  });
});
