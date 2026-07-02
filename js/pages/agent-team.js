let teamCache = [];
let teamFiltered = [];
let teamPage = 1;
let teamSearchBy = 'code';
let teamKeyword = '';

document.addEventListener('DOMContentLoaded', async () => {
  const tbody = document.getElementById('teamTableBody');
  if (!tbody) return;

  document.getElementById('btnAddMember')?.addEventListener('click', () => openMemberModal());
  document.getElementById('btnTeamSearch')?.addEventListener('click', applySearch);
  document.getElementById('btnTeamShowAll')?.addEventListener('click', resetSearch);
  document.getElementById('searchKeyword')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') applySearch();
  });

  if (typeof lucide !== 'undefined') lucide.createIcons();
  await loadTeam();
});

async function loadTeam() {
  const tbody = document.getElementById('teamTableBody');
  App.TableUI.showLoading(tbody, 7);
  teamCache = await App.TeamService.getMembers();
  applySearch();
}

function applySearch() {
  teamSearchBy = document.getElementById('searchBy')?.value || 'code';
  teamKeyword = (document.getElementById('searchKeyword')?.value || '').trim().toLowerCase();
  if (!teamKeyword) {
    teamFiltered = [...teamCache];
  } else {
    teamFiltered = teamCache.filter((m) => {
      const val = String(m[teamSearchBy] || '').toLowerCase();
      return val.includes(teamKeyword);
    });
  }
  teamPage = 1;
  renderTeamTable();
}

function resetSearch() {
  const searchBy = document.getElementById('searchBy');
  const keyword = document.getElementById('searchKeyword');
  if (searchBy) searchBy.value = 'code';
  if (keyword) keyword.value = '';
  teamKeyword = '';
  teamFiltered = [...teamCache];
  teamPage = 1;
  renderTeamTable();
}

function renderTeamTable() {
  const tbody = document.getElementById('teamTableBody');
  const pg = App.TableUI.paginate(teamFiltered, teamPage);

  if (!pg.items.length) {
    App.TableUI.showEmpty(tbody, 7, teamKeyword ? 'ไม่พบข้อมูลที่ค้นหา' : 'ยังไม่มีลูกทีม');
    renderTeamPagination(pg);
    return;
  }

  tbody.innerHTML = pg.items.map((m) => `
    <tr data-member-id="${m.id}">
      <td>${escapeHtml(m.code)}</td>
      <td>${escapeHtml(m.userId || '-')}</td>
      <td>${escapeHtml(m.name)}</td>
      <td>${escapeHtml(m.phone || '-')}</td>
      <td class="col-money">${formatMoney(m.balance)}</td>
      <td class="col-status">
        <span class="status-pill ${m.status}">${m.status === 'active' ? 'ใช้งาน' : 'ระงับ'}</span>
      </td>
      <td>
        <button type="button" class="btn-secondary btn-sm btn-edit-member" data-id="${m.id}" title="แก้ไข">
          <i data-lucide="pencil"></i> Edit
        </button>
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('.btn-edit-member').forEach((btn) => {
    btn.addEventListener('click', () => openMemberModal(btn.dataset.id));
  });

  if (typeof lucide !== 'undefined') lucide.createIcons();
  renderTeamPagination(pg);
}

function renderTeamPagination(pg) {
  const container = document.getElementById('teamPagination');
  if (!container) return;

  if (!pg.total) {
    container.innerHTML = '';
    return;
  }

  const start = (pg.page - 1) * pg.perPage + 1;
  const end = Math.min(pg.page * pg.perPage, pg.total);

  container.innerHTML = `
    <div class="pagination-bar">
      <span class="pagination-info">Showing ${start} to ${end} of ${pg.total} entries</span>
      <div class="pagination-btns">
        <button type="button" data-page="prev" ${pg.page <= 1 ? 'disabled' : ''}>‹</button>
        ${App.TableUI._pageButtons(pg.page, pg.pages)}
        <button type="button" data-page="next" ${pg.page >= pg.pages ? 'disabled' : ''}>›</button>
      </div>
    </div>
  `;

  container.querySelectorAll('[data-page]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const val = btn.dataset.page;
      let next = pg.page;
      if (val === 'prev') next = pg.page - 1;
      else if (val === 'next') next = pg.page + 1;
      else next = parseInt(val, 10);
      if (next >= 1 && next <= pg.pages) {
        teamPage = next;
        renderTeamTable();
      }
    });
  });
}

function openMemberModal(memberId) {
  const isEdit = !!memberId;
  const member = isEdit ? teamCache.find((m) => m.id === memberId) : null;

  document.getElementById('teamMemberModal')?.remove();

  const overlay = document.createElement('div');
  overlay.className = 'team-modal-overlay';
  overlay.id = 'teamMemberModal';
  overlay.innerHTML = `
    <div class="team-modal" role="dialog" aria-modal="true" aria-labelledby="teamModalTitle">
      <header class="team-modal__header">
        <h2 class="team-modal__title" id="teamModalTitle">เพิ่มข้อมูลใหม่</h2>
        <button type="button" class="team-modal__close" aria-label="ปิด">&times;</button>
      </header>
      <div class="team-modal__tabs">
        <span class="team-modal__tab is-active">ข้อมูลทั่วไป</span>
      </div>
      <div class="team-modal__body">
        <form id="teamMemberForm" novalidate>
          <div class="team-form-row">
            <label for="memberName">ชื่อ-นามสกุล</label>
            <input type="text" id="memberName" name="name" value="${escapeAttr(member?.name || '')}" required>
          </div>
          <div class="team-form-row">
            <label for="memberPhone">เบอร์โทรศัพท์</label>
            <input type="text" id="memberPhone" name="phone" value="${escapeAttr(member?.phone || '-')}">
          </div>
          <div class="team-form-row">
            <label for="memberIdCard">เลขบัตรประชาชน</label>
            <input type="text" id="memberIdCard" name="idCard" value="${escapeAttr(member?.idCard || '-')}">
          </div>
          <div class="team-form-row">
            <label for="memberBirthDate">วันเกิด</label>
            <input type="text" id="memberBirthDate" name="birthDate" value="${escapeAttr(member?.birthDate || '-')}" placeholder="dd/mm/yyyy">
          </div>
          <div class="team-form-row">
            <label for="memberEmail">อีเมล์</label>
            <input type="email" id="memberEmail" name="email" value="${escapeAttr(member?.email || '-')}">
          </div>
          <div class="team-form-row team-form-row--textarea">
            <label for="memberAddress">ที่อยู่</label>
            <textarea id="memberAddress" name="address" rows="3">${escapeHtml(member?.address || '-')}</textarea>
          </div>
        </form>
      </div>
      <footer class="team-modal__footer">
        <button type="button" class="btn-primary" id="teamModalSubmit">บันทึก</button>
        <button type="button" class="btn-secondary" id="teamModalCancel">ยกเลิก</button>
      </footer>
    </div>
  `;

  const close = () => overlay.remove();

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
  overlay.querySelector('.team-modal__close')?.addEventListener('click', close);
  overlay.querySelector('#teamModalCancel')?.addEventListener('click', close);

  overlay.querySelector('#teamModalSubmit')?.addEventListener('click', async () => {
    const form = overlay.querySelector('#teamMemberForm');
    const name = form.name.value.trim();
    if (!name) {
      form.name.focus();
      return;
    }

    const payload = {
      name,
      phone: form.phone.value.trim() || '-',
      idCard: form.idCard.value.trim() || '-',
      birthDate: form.birthDate.value.trim() || '-',
      email: form.email.value.trim() || '-',
      address: form.address.value.trim() || '-'
    };

    try {
      if (isEdit) {
        await App.TeamService.updateMember(memberId, payload);
      } else {
        await App.TeamService.addMember(payload);
      }
      close();
      await loadTeam();
    } catch (err) {
      alert(err.message || 'บันทึกไม่สำเร็จ');
    }
  });

  document.body.appendChild(overlay);
  overlay.querySelector('#memberName')?.focus();
}

function formatMoney(value) {
  const num = Number(value) || 0;
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(str) {
  return escapeHtml(str).replace(/'/g, '&#39;');
}
