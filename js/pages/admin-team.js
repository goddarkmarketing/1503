(function () {
  const root = document.getElementById('teamHierarchyRoot');
  if (!root) return;

  const searchInput = document.getElementById('teamSearch');
  const sortSelect = document.getElementById('teamSort');

  let teams = [];
  let selectedId = null;

  function money(n) {
    return App.Shell.formatCurrency(n || 0);
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function statusLabel(s) {
    return s === 'active' ? 'ใช้งาน' : 'ระงับ';
  }

  function statusClass(s) {
    return s === 'active' ? 'active' : 'inactive';
  }

  function share(part, total) {
    if (!total) return 0;
    return Math.max(0, Math.min(100, Math.round((Number(part) || 0) / total * 100)));
  }

  function matchesSearch(team, q) {
    if (!q) return true;
    const blob = [
      team.leaderCode,
      team.leaderName,
      team.leaderPhone,
      ...(team.members || []).map((m) => `${m.code} ${m.name} ${m.phone}`)
    ].join(' ').toLowerCase();
    return blob.includes(q);
  }

  function sortedTeams(list) {
    const key = sortSelect?.value || 'premium';
    const next = [...list];
    next.sort((a, b) => {
      if (key === 'members') return (b.totalMembers || 0) - (a.totalMembers || 0);
      if (key === 'policies') return (b.totalPolicies || 0) - (a.totalPolicies || 0);
      if (key === 'name') {
        return String(a.leaderName || '').localeCompare(String(b.leaderName || ''), 'th');
      }
      return (b.totalPremium || 0) - (a.totalPremium || 0);
    });
    return next;
  }

  function visibleTeams() {
    const q = String(searchInput?.value || '').trim().toLowerCase();
    return sortedTeams(teams.filter((t) => matchesSearch(t, q)));
  }

  function orgTotals() {
    return teams.reduce((acc, t) => {
      acc.members += t.totalMembers || 0;
      acc.policies += t.totalPolicies || 0;
      acc.premium += t.totalPremium || 0;
      return acc;
    }, { members: 0, policies: 0, premium: 0 });
  }

  function phoneLink(phone) {
    const raw = String(phone || '').trim();
    if (!raw || raw === '-') return '-';
    const href = raw.replace(/[^\d+]/g, '');
    return `<a href="tel:${escapeHtml(href)}">${escapeHtml(raw)}</a>`;
  }

  function render() {
    if (!teams.length) {
      root.innerHTML = `
        <div class="team-org-empty">
          <p>ยังไม่มีโครงสร้างทีม</p>
          <a class="btn-primary btn-sm" href="agents">ไปตั้งค่าทีมที่จัดการนายหน้า</a>
        </div>`;
      return;
    }

    const list = visibleTeams();
    const org = orgTotals();
    if (list.length && !list.some((t) => t.leaderId === selectedId)) {
      selectedId = list[0].leaderId;
    }
    const selected = list.find((t) => t.leaderId === selectedId) || null;
    const listEl = root.querySelector('.team-org__list');
    const listScroll = listEl ? listEl.scrollTop : 0;

    root.innerHTML = `
      <div class="team-org">
        <dl class="team-org__kpis">
          <div>
            <dt>จำนวนทีม</dt>
            <dd>${teams.length}</dd>
          </div>
          <div>
            <dt>สมาชิกรวม</dt>
            <dd>${org.members}</dd>
          </div>
          <div>
            <dt>กรมธรรม์รวม</dt>
            <dd>${org.policies}</dd>
          </div>
          <div>
            <dt>ยอดขายรวม</dt>
            <dd>${money(org.premium)}</dd>
          </div>
        </dl>

        <div class="team-org__workspace">
          <aside class="team-org__list" aria-label="รายการทีม">
            <div class="team-org__listHead">${list.length} ทีม</div>
            ${list.length
              ? list.map((t) => {
                const active = t.leaderId === selectedId ? ' is-active' : '';
                return `
                  <button type="button" class="team-org__item${active}" data-team-id="${t.leaderId}">
                    <span class="team-org__itemMeta">
                      <strong>${escapeHtml(t.leaderName || '-')}</strong>
                      <em>${escapeHtml(t.leaderCode)} · ${t.memberCount} ลูกทีม</em>
                    </span>
                    <span class="team-org__itemSales">${money(t.totalPremium)}</span>
                  </button>`;
              }).join('')
              : '<p class="team-org__none">ไม่พบทีมที่ตรงกับคำค้น</p>'}
          </aside>
          <section class="team-org__detail">
            ${selected ? renderDetail(selected, org) : '<p class="team-org__none">เลือกทีมจากรายการซ้าย</p>'}
          </section>
        </div>
      </div>
    `;

    root.querySelectorAll('[data-team-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        selectedId = btn.dataset.teamId;
        render();
      });
    });

    const nextList = root.querySelector('.team-org__list');
    if (nextList) nextList.scrollTop = listScroll;

    const active = root.querySelector('.team-org__item.is-active');
    if (active && nextList) {
      const top = active.offsetTop;
      const bottom = top + active.offsetHeight;
      if (top < nextList.scrollTop || bottom > nextList.scrollTop + nextList.clientHeight) {
        active.scrollIntoView({ block: 'nearest' });
      }
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  function renderDetail(t, org) {
    const orgShare = share(t.totalPremium, org.premium);
    const roster = [
      {
        id: t.leaderId,
        code: t.leaderCode,
        name: t.leaderName,
        phone: t.leaderPhone,
        status: t.leaderStatus,
        policies: t.leaderPolicies || 0,
        premium: t.leaderPremium || 0,
        role: 'หัวหน้าทีม'
      },
      ...(t.members || []).map((m) => ({ ...m, role: 'ลูกทีม' }))
    ];

    return `
      <header class="team-org__detailHead">
        <span class="team-org__avatar team-org__avatar--lg" aria-hidden="true"><i data-lucide="users"></i></span>
        <div>
          <h2>${escapeHtml(t.leaderName || '-')}</h2>
          <p>
            <span>${escapeHtml(t.leaderCode)}</span>
            <span>${phoneLink(t.leaderPhone)}</span>
            <span class="status-pill ${statusClass(t.leaderStatus)}">${statusLabel(t.leaderStatus)}</span>
          </p>
        </div>
        <a class="btn-secondary btn-sm" href="agents">จัดการบัญชีนี้</a>
      </header>

      <dl class="team-org__metrics">
        <div class="team-org__metric team-org__metric--members">
          <span class="team-org__metricIcon" aria-hidden="true"><i data-lucide="users"></i></span>
          <div class="team-org__metricBody">
            <dt>สมาชิกทั้งทีม</dt>
            <dd>${t.totalMembers}</dd>
            <small>${t.memberCount} ลูกทีม</small>
          </div>
        </div>
        <div class="team-org__metric team-org__metric--policies">
          <span class="team-org__metricIcon" aria-hidden="true"><i data-lucide="file-text"></i></span>
          <div class="team-org__metricBody">
            <dt>กรมธรรม์</dt>
            <dd>${t.totalPolicies}</dd>
            <small>หัวหน้า ${t.leaderPolicies || 0} · ลูกทีม ${t.memberPolicies || 0}</small>
          </div>
        </div>
        <div class="team-org__metric team-org__metric--sales">
          <span class="team-org__metricIcon" aria-hidden="true"><i data-lucide="coins"></i></span>
          <div class="team-org__metricBody">
            <dt>ยอดขายทีม</dt>
            <dd>${money(t.totalPremium)}</dd>
            <small>ลูกทีม ${money(t.memberPremium)}</small>
          </div>
        </div>
        <div class="team-org__metric team-org__metric--share">
          <span class="team-org__metricIcon" aria-hidden="true"><i data-lucide="pie-chart"></i></span>
          <div class="team-org__metricBody">
            <dt>สัดส่วนองค์กร</dt>
            <dd>${orgShare}%</dd>
            <small>เทียบยอดขายทั้งองค์กร</small>
          </div>
        </div>
      </dl>

      <div class="data-table-wrap team-org__table">
        <table class="data-table">
          <thead>
            <tr>
              <th>นายหน้า</th>
              <th>บทบาท</th>
              <th>โทรศัพท์</th>
              <th class="col-center">กรมธรรม์</th>
              <th>เบี้ยรวม</th>
              <th>สัดส่วนทีม</th>
              <th>สถานะ</th>
            </tr>
          </thead>
          <tbody>
            ${roster.map((m) => {
              const pct = share(m.premium, t.totalPremium);
              const isLeader = m.role === 'หัวหน้าทีม';
              return `
                <tr>
                  <td>
                    <span class="team-org__agent">
                      <strong>${escapeHtml(m.code)}</strong>
                      <span>${escapeHtml(m.name)}</span>
                    </span>
                  </td>
                  <td>
                    <span class="team-org__role${isLeader ? ' is-leader' : ''}">
                      ${isLeader ? '<i data-lucide="star" class="team-org__star"></i>' : ''}
                      ${escapeHtml(m.role)}
                    </span>
                  </td>
                  <td>${phoneLink(m.phone)}</td>
                  <td class="col-center">${m.policies || 0}</td>
                  <td class="col-money">${money(m.premium)}</td>
                  <td class="col-center">${pct}%</td>
                  <td><span class="status-pill ${statusClass(m.status)}">${statusLabel(m.status)}</span></td>
                </tr>`;
            }).join('')}
          </tbody>
          <tfoot>
            <tr class="team-total-row">
              <td colspan="3"><strong>รวมทั้งทีม</strong></td>
              <td class="col-center"><strong>${t.totalPolicies || 0}</strong></td>
              <td class="col-money"><strong>${money(t.totalPremium)}</strong></td>
              <td><strong>100%</strong></td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;
  }

  searchInput?.addEventListener('input', () => render());
  sortSelect?.addEventListener('change', () => render());

  async function load() {
    root.innerHTML = '<p class="admin-hint">กำลังโหลดโครงสร้างทีม...</p>';
    try {
      teams = await App.AdminReportService.getTeamHierarchy();
      selectedId = teams[0]?.leaderId || null;
      render();
    } catch (err) {
      root.innerHTML = `<p class="admin-hint">${escapeHtml(err.message || 'โหลดโครงสร้างทีมไม่สำเร็จ')}</p>`;
    }
  }

  load();
})();
