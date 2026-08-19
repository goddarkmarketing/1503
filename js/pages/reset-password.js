document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token') || '';
  const form = document.getElementById('resetForm');
  const errorEl = document.getElementById('resetError');
  const successEl = document.getElementById('resetSuccess');
  const submitBtn = document.getElementById('resetSubmit');
  const passwordInput = document.getElementById('newPassword');
  const togglePass = document.getElementById('togglePassword');

  if (!token) {
    if (errorEl) {
      errorEl.textContent = 'ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้อง กรุณาขอลิงก์ใหม่จากหน้าเข้าสู่ระบบ';
      errorEl.classList.add('visible');
    }
    form?.remove();
    return;
  }

  togglePass?.addEventListener('click', () => {
    if (!passwordInput) return;
    const show = passwordInput.type === 'password';
    passwordInput.type = show ? 'text' : 'password';
    togglePass.textContent = show ? 'ซ่อน' : 'แสดง';
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl?.classList.remove('visible');
    if (successEl) {
      successEl.hidden = true;
      successEl.textContent = '';
    }

    const newPassword = form.newPassword.value;
    const confirmPassword = form.confirmPassword.value;
    if (newPassword.length < 4) {
      errorEl.textContent = 'รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร';
      errorEl.classList.add('visible');
      return;
    }
    if (newPassword !== confirmPassword) {
      errorEl.textContent = 'รหัสผ่านและการยืนยันไม่ตรงกัน';
      errorEl.classList.add('visible');
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'กำลังบันทึก...';
    }

    try {
      const result = await App.AuthService.resetPassword(token, newPassword);
      form.remove();
      if (successEl) {
        successEl.hidden = false;
        successEl.textContent = result.message || 'ตั้งรหัสผ่านใหม่เรียบร้อยแล้ว';
      }
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 2000);
    } catch (err) {
      if (errorEl) {
        errorEl.textContent = err.message || 'ตั้งรหัสผ่านไม่สำเร็จ';
        errorEl.classList.add('visible');
      }
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'บันทึกรหัสผ่านใหม่';
      }
    }
  });
});
