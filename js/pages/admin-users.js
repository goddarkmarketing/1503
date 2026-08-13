let usersCache = [];

document.addEventListener('DOMContentLoaded', async () => {
  const tbody = document.getElementById('usersTableBody');
  if (!tbody) return;

  document.getElementById('btnAddAdmin')?.addEventListener('click', openAddModal);
  document.getElementById('btnChangeMyPassword')?.addEventListener('click', openChangeOwnPasswordModal);

  try {
    await renderUsers();
  } catch (err) {
    console.error(err);
    App.TableUI?.showEmpty?.(
      tbody,
      5,
      `โหลดข้อมูลไม่สำเร็จ: ${err.message || 'เกิดข้อผิดพลาด'}`
    );
  }
});

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function renderUsers() {
  const tbody = document.getElementById('usersTableBody');
  App.TableUI?.showLoading?.(tbody, 5);
  usersCache = await App.AdminUserService.list();
  const meId = App.Session.getUser()?.id;

  if (!usersCache.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-muted)">ยังไม่มีผู้ดูแลระบบ</td></tr>';
    return;
  }

  tbody.innerHTML = usersCache.map((u) => {
    const isMe = u.id === meId;
    const statusClass = u.status === 'active' ? 'active' : 'inactive';
    const statusLabel = u.status === 'active' ? 'ใช้งาน' : 'ระงับ';
    return `
      <tr data-user-id="${escapeHtml(u.id)}">
        <td>${escapeHtml(u.username)}${isMe ? ' <em style="color:var(--text-muted)">(คุณ)</em>' : ''}</td>
        <td>${escapeHtml(u.name)}</td>
        <td>${escapeHtml(u.roleLabel || 'ผู้ดูแลระบบ')}</td>
        <td><span class="status-pill ${statusClass}">${statusLabel}</span></td>
        <td class="col-actions">
          <button type="button" class="btn-secondary btn-sm" data-action="edit">แก้ไข</button>
          <button type="button" class="btn-secondary btn-sm" data-action="password">รหัสผ่าน</button>
          ${isMe ? '' : `<button type="button" class="btn-secondary btn-sm" data-action="delete">ลบ</button>`}
        </td>
      </tr>
    `;
  }).join('');

  tbody.querySelectorAll('[data-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.closest('tr')?.dataset.userId;
      const user = usersCache.find((u) => u.id === id);
      if (!user) return;
      if (btn.dataset.action === 'edit') openEditModal(user);
      if (btn.dataset.action === 'password') openSetPasswordModal(user);
      if (btn.dataset.action === 'delete') confirmDelete(user);
    });
  });
}

function openAddModal() {
  const overlay = App.Modal.open({
    title: 'เพิ่มผู้ดูแลระบบ',
    body: `
      <form id="adminUserForm" class="admin-form-grid" style="max-width:none;grid-template-columns:1fr 1fr">
        <div class="form-field">
          <label for="adminUsername">Username <span class="form-req">*</span></label>
          <input id="adminUsername" name="username" required autocomplete="off" spellcheck="false">
        </div>
        <div class="form-field">
          <label for="adminPassword">รหัสผ่าน <span class="form-req">*</span></label>
          <input id="adminPassword" name="password" type="text" required value="demo" autocomplete="new-password" spellcheck="false">
        </div>
        <div class="form-field full">
          <label for="adminName">ชื่อ-นามสกุล <span class="form-req">*</span></label>
          <input id="adminName" name="name" required autocomplete="name">
        </div>
        <div class="form-field">
          <label for="adminEmail">อีเมล</label>
          <input id="adminEmail" name="email" type="email" autocomplete="email">
        </div>
        <div class="form-field">
          <label for="adminPhone">โทรศัพท์</label>
          <input id="adminPhone" name="phone" autocomplete="tel">
        </div>
      </form>
    `,
    footer: `
      <button type="button" class="btn-secondary" data-dismiss>ยกเลิก</button>
      <button type="button" class="btn-primary" id="confirmAdminSave">บันทึก</button>
    `
  });

  overlay.querySelector('[data-dismiss]')?.addEventListener('click', () => App.Modal.close());
  overlay.querySelector('#confirmAdminSave')?.addEventListener('click', async () => {
    const form = overlay.querySelector('#adminUserForm');
    const btn = overlay.querySelector('#confirmAdminSave');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    try {
      await App.ButtonUI.withLoading(btn, async () => {
        await App.AdminUserService.create({
          username: form.username.value.trim(),
          password: form.password.value,
          name: form.name.value.trim(),
          email: form.email.value.trim(),
          phone: form.phone.value.trim()
        });
        App.Modal.close();
        App.AdminUtils.showToast('เพิ่มผู้ดูแลระบบแล้ว');
        await renderUsers();
      });
    } catch (err) {
      App.AdminUtils.showToast(err.message || 'บันทึกไม่สำเร็จ', 'error');
    }
  });
}

function openEditModal(user) {
  const overlay = App.Modal.open({
    title: `แก้ไข — ${user.username}`,
    body: `
      <form id="adminUserForm" class="admin-form-grid" style="max-width:none;grid-template-columns:1fr 1fr">
        <div class="form-field">
          <label>Username</label>
          <input value="${escapeHtml(user.username)}" disabled>
        </div>
        <div class="form-field">
          <label for="adminStatus">สถานะ</label>
          <select id="adminStatus" name="status">
            <option value="active"${user.status === 'active' ? ' selected' : ''}>ใช้งาน</option>
            <option value="inactive"${user.status === 'inactive' ? ' selected' : ''}>ระงับ</option>
          </select>
        </div>
        <div class="form-field full">
          <label for="adminName">ชื่อ-นามสกุล <span class="form-req">*</span></label>
          <input id="adminName" name="name" required value="${escapeHtml(user.name)}">
        </div>
        <div class="form-field">
          <label for="adminEmail">อีเมล</label>
          <input id="adminEmail" name="email" type="email" value="${escapeHtml(user.email || '')}">
        </div>
        <div class="form-field">
          <label for="adminPhone">โทรศัพท์</label>
          <input id="adminPhone" name="phone" value="${escapeHtml(user.phone || '')}">
        </div>
      </form>
    `,
    footer: `
      <button type="button" class="btn-secondary" data-dismiss>ยกเลิก</button>
      <button type="button" class="btn-primary" id="confirmAdminSave">บันทึก</button>
    `
  });

  overlay.querySelector('[data-dismiss]')?.addEventListener('click', () => App.Modal.close());
  overlay.querySelector('#confirmAdminSave')?.addEventListener('click', async () => {
    const form = overlay.querySelector('#adminUserForm');
    const btn = overlay.querySelector('#confirmAdminSave');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    try {
      await App.ButtonUI.withLoading(btn, async () => {
        await App.AdminUserService.update(user.id, {
          name: form.name.value.trim(),
          email: form.email.value.trim(),
          phone: form.phone.value.trim(),
          status: form.status.value
        });
        App.Modal.close();
        App.AdminUtils.showToast('บันทึกแล้ว');
        await renderUsers();
      });
    } catch (err) {
      App.AdminUtils.showToast(err.message || 'บันทึกไม่สำเร็จ', 'error');
    }
  });
}

function openSetPasswordModal(user) {
  const overlay = App.Modal.open({
    title: `ตั้งรหัสผ่าน — ${user.username}`,
    body: `
      <form id="adminPasswordForm" class="admin-form-grid" style="max-width:none;grid-template-columns:1fr">
        <p class="admin-hint" style="margin-top:0">แอดมินเป็นผู้กำหนดรหัสผ่าน — ผู้ใช้จะใช้รหัสนี้เข้าสู่ระบบ</p>
        <div class="form-field">
          <label for="adminNewPassword">รหัสผ่านใหม่ <span class="form-req">*</span></label>
          <input id="adminNewPassword" name="password" type="text" required minlength="4" autocomplete="new-password" spellcheck="false">
        </div>
      </form>
    `,
    footer: `
      <button type="button" class="btn-secondary" data-dismiss>ยกเลิก</button>
      <button type="button" class="btn-primary" id="confirmAdminSave">บันทึก</button>
    `
  });

  overlay.querySelector('[data-dismiss]')?.addEventListener('click', () => App.Modal.close());
  overlay.querySelector('#confirmAdminSave')?.addEventListener('click', async () => {
    const form = overlay.querySelector('#adminPasswordForm');
    const btn = overlay.querySelector('#confirmAdminSave');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    try {
      await App.ButtonUI.withLoading(btn, async () => {
        await App.AdminUserService.update(user.id, { password: form.password.value });
        App.Modal.close();
        App.AdminUtils.showToast('ตั้งรหัสผ่านแล้ว');
      });
    } catch (err) {
      App.AdminUtils.showToast(err.message || 'บันทึกไม่สำเร็จ', 'error');
    }
  });
}

function openChangeOwnPasswordModal() {
  const overlay = App.Modal.open({
    title: 'เปลี่ยนรหัสผ่านของฉัน',
    body: `
      <form id="ownPasswordForm" class="admin-form-grid" style="max-width:none;grid-template-columns:1fr">
        <div class="form-field">
          <label for="currentPassword">รหัสผ่านปัจจุบัน <span class="form-req">*</span></label>
          <input id="currentPassword" name="currentPassword" type="password" required autocomplete="current-password">
        </div>
        <div class="form-field">
          <label for="newPassword">รหัสผ่านใหม่ <span class="form-req">*</span></label>
          <input id="newPassword" name="newPassword" type="password" required minlength="4" autocomplete="new-password">
        </div>
        <div class="form-field">
          <label for="confirmPassword">ยืนยันรหัสผ่านใหม่ <span class="form-req">*</span></label>
          <input id="confirmPassword" name="confirmPassword" type="password" required minlength="4" autocomplete="new-password">
        </div>
      </form>
    `,
    footer: `
      <button type="button" class="btn-secondary" data-dismiss>ยกเลิก</button>
      <button type="button" class="btn-primary" id="confirmAdminSave">บันทึก</button>
    `
  });

  overlay.querySelector('[data-dismiss]')?.addEventListener('click', () => App.Modal.close());
  overlay.querySelector('#confirmAdminSave')?.addEventListener('click', async () => {
    const form = overlay.querySelector('#ownPasswordForm');
    const btn = overlay.querySelector('#confirmAdminSave');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    if (form.newPassword.value !== form.confirmPassword.value) {
      App.AdminUtils.showToast('รหัสผ่านใหม่ไม่ตรงกัน', 'error');
      return;
    }
    try {
      await App.ButtonUI.withLoading(btn, async () => {
        await App.AdminUserService.changeOwnPassword(
          form.currentPassword.value,
          form.newPassword.value
        );
        App.Modal.close();
        App.AdminUtils.showToast('เปลี่ยนรหัสผ่านแล้ว');
      });
    } catch (err) {
      App.AdminUtils.showToast(err.message || 'เปลี่ยนรหัสผ่านไม่สำเร็จ', 'error');
    }
  });
}

async function confirmDelete(user) {
  const ok = window.confirm(`ลบผู้ดูแลระบบ “${user.username}” ใช่หรือไม่?\nการลบไม่สามารถย้อนกลับได้`);
  if (!ok) return;
  try {
    await App.AdminUserService.remove(user.id);
    App.AdminUtils.showToast(`ลบ ${user.username} แล้ว`);
    await renderUsers();
  } catch (err) {
    App.AdminUtils.showToast(err.message || 'ลบไม่สำเร็จ', 'error');
  }
}
