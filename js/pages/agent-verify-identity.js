(function () {
  document.addEventListener('DOMContentLoaded', async () => {
    const basePath = App.Paths.detectBasePath();
    App.RoleGuard.enforce('agent', { basePath });

    const user = App.AuthService.getCurrentUser();
    if (user?.identityStatus === 'approved') {
      window.location.replace(`${App.Paths.normalizeBasePath(basePath)}agent/`);
      return;
    }

    await App.Shell.init({ basePath, profilePath: App.Paths.agentProfile(basePath) });

    const form = document.getElementById('verifyIdentityForm');
    const pendingEl = document.getElementById('verifyPending');
    const rejectedEl = document.getElementById('verifyRejected');
    const rejectNoteEl = document.getElementById('verifyRejectNote');
    const refHintEl = document.getElementById('verifyRefHint');
    const submitBtn = document.getElementById('verifySubmit');
    const logoutBtn = document.getElementById('verifyLogout');

    logoutBtn?.addEventListener('click', async (e) => {
      e.preventDefault();
      await App.AuthService.logout();
      window.location.href = `${basePath}login.html`;
    });

    let statusData = null;
    try {
      statusData = await App.AgentIdentityService.getStatus(user.id);
    } catch (err) {
      alert(err.message || 'โหลดข้อมูลไม่สำเร็จ');
      return;
    }

    const identityStatus = statusData.identityStatus || user.identityStatus || 'none';
    const reference = statusData.reference;
    const latest = statusData.latest;

    if (reference?.name) {
      refHintEl.hidden = false;
      refHintEl.textContent = 'ข้อมูลต้องตรงกับที่ลงทะเบียน: ' + [reference.name, reference.email, reference.phone].filter(Boolean).join(' · ');
      if (!form.verifyName.value) form.verifyName.value = reference.name;
      if (!form.verifyEmail.value && reference.email) form.verifyEmail.value = reference.email;
      if (!form.verifyPhone.value && reference.phone) form.verifyPhone.value = reference.phone;
    } else if (user.name) {
      if (!form.verifyName.value) form.verifyName.value = user.name;
      if (!form.verifyEmail.value && user.email) form.verifyEmail.value = user.email;
      if (!form.verifyPhone.value && user.phone) form.verifyPhone.value = user.phone;
    }

    function showForm(show) {
      form.hidden = !show;
      pendingEl.hidden = true;
      rejectedEl.hidden = true;
    }

    if (identityStatus === 'pending') {
      form.hidden = true;
      pendingEl.hidden = false;
    } else if (identityStatus === 'rejected') {
      rejectedEl.hidden = false;
      if (latest?.adminNote) {
        rejectNoteEl.textContent = 'เหตุผล: ' + latest.adminNote;
      }
      showForm(true);
    } else {
      showForm(true);
    }

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const bankFile = document.getElementById('verifyBank')?.files?.[0];
      const idFile = document.getElementById('verifyIdCard')?.files?.[0];
      if (!bankFile || !idFile) {
        alert('กรุณาแนบเอกสารครบทั้ง 2 ไฟล์');
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'กำลังส่ง...';
      }

      try {
        const [bankAccount, idCard] = await Promise.all([
          App.CreditSlip.readFile(bankFile),
          App.CreditSlip.readFile(idFile)
        ]);

        await App.AgentIdentityService.submit(user.id, {
          name: form.verifyName.value.trim(),
          email: form.verifyEmail.value.trim(),
          phone: form.verifyPhone.value.trim(),
          bankAccount,
          idCard
        });

        const refreshed = await App.AuthService.refreshUser();
        App.Session.updateUser({ ...refreshed, identityStatus: 'pending' });

        form.hidden = true;
        pendingEl.hidden = false;
        rejectedEl.hidden = true;
      } catch (err) {
        alert(err.message || 'ส่งคำขอไม่สำเร็จ');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'ส่งคำขอยืนยันตัวตน';
        }
      }
    });

    if (typeof lucide !== 'undefined') lucide.createIcons();
  });
})();
