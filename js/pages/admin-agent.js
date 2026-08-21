document.addEventListener('DOMContentLoaded', async () => {
  const root = document.getElementById('agentPageRoot');
  if (!root) return;

  const params = new URLSearchParams(window.location.search);
  const agentId = String(params.get('id') || '').trim();
  const view = normalizeView(params.get('view'));

  if (!agentId) {
    root.innerHTML = notFoundHtml('ไม่ระบุนายหน้า');
    return;
  }

  let agents = [];
  try {
    agents = await App.AgentService.getAgents();
  } catch (err) {
    root.innerHTML = notFoundHtml(err.message || 'โหลดข้อมูลไม่สำเร็จ');
    return;
  }

  const agent = agents.find((a) => a.id === agentId);
  if (!agent) {
    root.innerHTML = notFoundHtml('ไม่พบนายหน้านี้');
    return;
  }

  function getTeamRoster(current) {
    if (!current.parentId) {
      return {
        leader: current,
        members: agents.filter((a) => a.parentId === current.id)
      };
    }
    const leader = agents.find((a) => a.id === current.parentId);
    if (!leader) {
      return { leader: current, members: [] };
    }
    return {
      leader,
      members: agents.filter((a) => a.parentId === leader.id)
    };
  }

  function teamCommissionBodyHtml(current) {
    if (!App.AgentCommissionRates) return '';
    const { leader, members } = getTeamRoster(current);
    const isLeader = !current.parentId;
    const parts = [
      App.AgentCommissionRates.renderTeamCommissionOverview(leader, members)
    ];
    if (isLeader) {
      parts.push(App.AgentCommissionRates.renderDetailedCommissionSections(current.commissionRates));
    } else {
      parts.push(App.AgentCommissionRates.renderQuickCommissionBlock(current.commissionRates, { hasParent: true }));
      parts.push(App.AgentCommissionRates.renderDetailedCommissionSections(current.commissionRates));
    }
    return parts.join('');
  }

  const teamTitle = agent.parentId ? 'ตั้งค่าคอม' : 'ทีมและค่าคอม';
  const titles = {
    perms: 'สิทธิ์ฟังก์ชัน',
    edit: 'แก้ไขข้อมูลบัญชี'
  };

  root.innerHTML = `
    <div class="admin-toolbar agent-page__toolbar">
      <div class="agent-page__toolbarHead">
        <a class="agent-page__back" href="agents"><i data-lucide="arrow-left"></i> กลับไปจัดการนายหน้า</a>
        <h1 class="admin-page-title">${escapeHtml(view === 'team' ? teamTitle : titles[view])} — ${escapeHtml(agent.name)}</h1>
        <p class="admin-hint">${escapeHtml(agent.code)} · ${agent.parentId ? 'ลูกทีม' : 'หัวทีม'} · ${agent.status === 'active' ? 'ใช้งาน' : 'ระงับ'}</p>
      </div>
      <nav class="agent-page__tabs" aria-label="ส่วนตั้งค่านายหน้า">
        <a class="agent-page__tab${view === 'team' ? ' is-active' : ''}" href="${pageHref(agent.id, 'team')}">${agent.parentId ? 'ตั้งค่าคอม' : 'ทีม/คอม'}</a>
        <a class="agent-page__tab${view === 'perms' ? ' is-active' : ''}" href="${pageHref(agent.id, 'perms')}">สิทธิ์</a>
        <a class="agent-page__tab${view === 'edit' ? ' is-active' : ''}" href="${pageHref(agent.id, 'edit')}">แก้ไข</a>
      </nav>
    </div>
    <div class="agent-page__body" id="agentPageBody"></div>
  `;

  const body = root.querySelector('#agentPageBody');
  if (view === 'edit') renderEdit(body, agent);
  else if (view === 'perms') renderPerms(body, agent);
  else renderTeam(body, agent);

  if (typeof lucide !== 'undefined') lucide.createIcons();

  function renderEdit(host, current) {
    host.innerHTML = `
      <form id="editAgentForm" class="agent-form" novalidate>
        <p class="agent-form__intro">อัปเดตข้อมูลติดต่อ วงเงินสูงสุด และรหัสผ่านของบัญชี <strong>${escapeHtml(current.code)}</strong></p>
        <section class="agent-form__section">
          <div class="agent-form__sectionHead">
            <h3 class="agent-form__sectionTitle">ข้อมูลติดต่อ</h3>
          </div>
          <div class="agent-form__grid">
            <div class="form-field full">
              <label for="editName">ชื่อ-นามสกุล <span class="form-req" aria-hidden="true">*</span></label>
              <input id="editName" name="name" value="${escapeHtml(current.name)}" required autocomplete="name">
            </div>
            <div class="form-field">
              <label for="editEmail">อีเมล</label>
              <input id="editEmail" name="email" type="email" value="${escapeHtml(current.email || '')}" autocomplete="email">
            </div>
            <div class="form-field">
              <label for="editPhone">โทรศัพท์</label>
              <input id="editPhone" name="phone" value="${escapeHtml(current.phone || '')}" inputmode="tel" autocomplete="tel">
            </div>
          </div>
        </section>
        <section class="agent-form__section">
          <div class="agent-form__sectionHead">
            <h3 class="agent-form__sectionTitle">วงเงิน</h3>
          </div>
          <div class="agent-form__grid">
            <div class="form-field">
              <label for="editCreditLimit">วงเงินสูงสุด (บาท)</label>
              <input id="editCreditLimit" name="creditLimit" type="number" min="0" step="0.01" value="${current.creditLimit || 0}">
            </div>
            <div class="form-field">
              <label>วงเงินคงเหลือ</label>
              <div class="agent-form__readonly">${App.Shell.formatCurrency(current.balance)}</div>
              <span class="form-field__hint">ปรับได้จากเมนู “ตั้งค่าคอม/ปรับวงเงิน”</span>
            </div>
          </div>
        </section>
        <section class="agent-form__section">
          <div class="agent-form__sectionHead">
            <h3 class="agent-form__sectionTitle">รหัสผ่าน</h3>
          </div>
          <div class="agent-form__grid">
            <div class="form-field">
              <label for="editPassword">ตั้งรหัสผ่านใหม่</label>
              <input id="editPassword" name="password" type="text" autocomplete="new-password" spellcheck="false" placeholder="เว้นว่างหากไม่เปลี่ยน">
              <span class="form-field__hint">แอดมินเป็นผู้ตั้งรหัสผ่านทั้งหมด นายหน้าเปลี่ยนเองไม่ได้</span>
            </div>
          </div>
        </section>
        <div class="agent-page__actions">
          <a class="btn-secondary" href="agents">ยกเลิก</a>
          <button type="button" class="btn-primary" id="confirmEdit">บันทึกการแก้ไข</button>
        </div>
      </form>
    `;

    host.querySelector('#confirmEdit')?.addEventListener('click', async () => {
      const form = host.querySelector('#editAgentForm');
      const btn = host.querySelector('#confirmEdit');
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      try {
        await App.ButtonUI.withLoading(btn, async () => {
          const payload = {
            name: form.name.value.trim(),
            email: form.email.value.trim(),
            phone: form.phone.value.trim(),
            creditLimit: parseFloat(form.creditLimit.value) || 0
          };
          const nextPassword = String(form.password?.value || '').trim();
          if (nextPassword) payload.password = nextPassword;
          await App.AgentService.updateAgent(current.id, payload);
          App.AdminUtils.showToast(`อัปเดต ${current.code} เรียบร้อยแล้ว`);
        }, { label: 'กำลังบันทึก...' });
      } catch (err) {
        App.AdminUtils.showToast(err.message || 'บันทึกไม่สำเร็จ', 'error');
      }
    });
  }

  function renderPerms(host, current) {
    if (!App.AgentFeatures) {
      host.innerHTML = '<p class="admin-hint">ระบบสิทธิ์ยังไม่พร้อม กรุณารีเฟรชหน้า (Ctrl+F5)</p>';
      return;
    }
    host.innerHTML = `
      <form id="agentPermForm" novalidate>
        ${App.AgentFeatures.renderPermissionsTable(current.featurePermissions)}
        <div class="agent-page__actions">
          <a class="btn-secondary" href="agents">ยกเลิก</a>
          <button type="button" class="btn-primary" id="confirmPerms">บันทึกสิทธิ์</button>
        </div>
      </form>
    `;
    const form = host.querySelector('#agentPermForm');
    form.addEventListener('submit', (e) => e.preventDefault());
    try {
      App.AgentFeatures.bindPermissionsForm(form);
    } catch (err) {
      console.error(err);
    }

    host.querySelector('#confirmPerms')?.addEventListener('click', async () => {
      const saveBtn = host.querySelector('#confirmPerms');
      try {
        await App.ButtonUI.withLoading(saveBtn, async () => {
          const featurePermissions = App.AgentFeatures.readPermissionsFromForm(form);
          const noneEnabled = App.AgentFeatures.countEnabled(featurePermissions) === 0;
          await App.AgentService.updateAgent(current.id, { featurePermissions });
          App.AdminUtils.showToast(
            noneEnabled
              ? `บันทึกสิทธิ์ของ ${current.code} แล้ว (ปิดทุกฟังก์ชัน — นายหน้าเข้าระบบไม่ได้)`
              : `บันทึกสิทธิ์ของ ${current.code} เรียบร้อยแล้ว`
          );
        }, { label: 'กำลังบันทึก...', minMs: 350 });
      } catch (err) {
        App.AdminUtils.showToast(err?.message || 'บันทึกไม่สำเร็จ', 'error');
      }
    });
  }

  function renderTeam(host, current) {
    const { leader, members } = getTeamRoster(current);
    host.innerHTML = `
      <form id="teamSettingsForm" class="agent-form" novalidate>
        ${teamCommissionBodyHtml(current)}
        <div class="agent-page__actions">
          <a class="btn-secondary" href="agents">ยกเลิก</a>
          <button type="button" class="btn-primary" id="confirmTeamSettings">บันทึก</button>
        </div>
      </form>
    `;
    App.AgentCommissionRates?.bindForm(host);

    host.querySelector('#confirmTeamSettings')?.addEventListener('click', async () => {
      const form = host.querySelector('#teamSettingsForm');
      const btn = host.querySelector('#confirmTeamSettings');
      try {
        await App.ButtonUI.withLoading(btn, async () => {
          const overview = form.querySelector('[data-team-commission-overview]');
          if (overview) {
            const updates = App.AgentCommissionRates.buildTeamOverviewUpdates(form, leader, members);
            const selfUpdate = updates.find((u) => u.id === current.id);
            if (selfUpdate && form.querySelector('[name^="commissionProduct_"]')) {
              selfUpdate.commissionRates = App.AgentCommissionRates.mergeLeaderAdvancedRates(
                selfUpdate.commissionRates,
                App.AgentCommissionRates.readFromForm(form)
              );
            }
            for (const update of updates) {
              await App.AgentService.updateAgent(update.id, {
                parentId: update.parentId,
                commissionRates: update.commissionRates
              });
            }
            App.AdminUtils.showToast(
              members.length
                ? `บันทึกคอมทั้งทีมของ ${leader.code} (${members.length + 1} คน) แล้ว`
                : `บันทึกทีม/คอมของ ${leader.code} แล้ว`
            );
          } else {
            App.AgentCommissionRates?.applyQuickRatesFromForm(form);
            await App.AgentService.updateAgent(current.id, {
              commissionRates: App.AgentCommissionRates?.readFromForm(form)
            });
            App.AdminUtils.showToast(`บันทึกทีม/คอมของ ${current.code} แล้ว`);
          }
        }, { label: 'กำลังบันทึก...' });
      } catch (err) {
        App.AdminUtils.showToast(err.message || 'บันทึกไม่สำเร็จ', 'error');
      }
    });
  }
});

function normalizeView(value) {
  const view = String(value || 'team').toLowerCase();
  if (view === 'perms' || view === 'permissions') return 'perms';
  if (view === 'edit') return 'edit';
  return 'team';
}

function pageHref(id, view) {
  return `agent?id=${encodeURIComponent(id)}&view=${encodeURIComponent(view)}`;
}

function notFoundHtml(message) {
  return `
    <p class="admin-hint">${escapeHtml(message)}</p>
    <a class="btn-secondary" href="agents">กลับไปจัดการนายหน้า</a>
  `;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
