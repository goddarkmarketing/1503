document.addEventListener('DOMContentLoaded', async () => {
  const user = App.AuthService.getCurrentUser();
  const form = document.getElementById('profileForm');
  const msg = document.getElementById('profileMessage');
  const basePath = document.body.dataset.basePath || '../';

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
      App.Shell.init({ basePath, profilePath: `${basePath}agent/profile.html` });
      msg.textContent = 'บันทึกโปรไฟล์เรียบร้อย';
      msg.style.color = 'var(--accent-green)';
    } catch (err) {
      msg.textContent = err.message || 'บันทึกไม่สำเร็จ';
      msg.style.color = 'var(--accent-red)';
    }
  });

  const pwForm = document.getElementById('passwordForm');
  const pwMsg = document.getElementById('passwordMessage');
  pwForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (pwForm.newPass.value !== pwForm.confirm.value) {
      pwMsg.textContent = 'รหัสผ่านใหม่ไม่ตรงกัน';
      pwMsg.style.color = 'var(--accent-red)';
      return;
    }
    try {
      await App.AgentService.changePassword(pwForm.current.value, pwForm.newPass.value);
      pwMsg.textContent = 'เปลี่ยนรหัสผ่านเรียบร้อย';
      pwMsg.style.color = 'var(--accent-green)';
      pwForm.reset();
    } catch (err) {
      pwMsg.textContent = err.message;
      pwMsg.style.color = 'var(--accent-red)';
    }
  });
});
