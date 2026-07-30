/**
 * Mock API — implements the same contract as the future REST backend.
 */
window.App = window.App || {};

App.MockAPI = {
  _permissionsHydrated: false,
  _commissionRatesHydrated: false,

  _hydrateAgentPermissions() {
    if (this._permissionsHydrated) return;
    this._permissionsHydrated = true;
    try {
      const key = App.Config.AGENT_PERMISSIONS_KEY;
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const map = JSON.parse(raw);
      if (!map || typeof map !== 'object') return;
      App.MockData.agents.forEach((agent) => {
        if (!map[agent.id]) return;
        const stored = map[agent.id];
        agent.featurePermissions = App.AgentFeatures
          ? (App.AgentFeatures.hasFullPermissions(stored)
            ? App.AgentFeatures.explicitPermissions(stored)
            : App.AgentFeatures.normalize(stored))
          : stored;
      });
    } catch (e) {
      console.warn('hydrateAgentPermissions failed', e);
    }
  },

  _hydrateAgentCommissionRates() {
    if (this._commissionRatesHydrated) return;
    this._commissionRatesHydrated = true;
    if (!App.AgentCommissionRates) return;
    try {
      const raw = localStorage.getItem(App.Config.AGENT_COMMISSION_RATES_KEY);
      if (!raw) return;
      const map = JSON.parse(raw);
      if (!map || typeof map !== 'object') return;
      App.MockData.agents.forEach((agent) => {
        if (!map[agent.id]) return;
        agent.commissionRates = App.AgentCommissionRates.normalize(map[agent.id]);
      });
    } catch (e) {
      console.warn('hydrateAgentCommissionRates failed', e);
    }
  },

  _persistAgentCommissionRates(agentId, rates) {
    if (!App.AgentCommissionRates) return;
    try {
      const raw = localStorage.getItem(App.Config.AGENT_COMMISSION_RATES_KEY);
      const map = raw ? JSON.parse(raw) : {};
      map[agentId] = App.AgentCommissionRates.normalize(rates);
      localStorage.setItem(App.Config.AGENT_COMMISSION_RATES_KEY, JSON.stringify(map));
    } catch (e) {
      console.warn('persistAgentCommissionRates failed', e);
    }
  },

  _hydrateCreditData() {
    try {
      const raw = localStorage.getItem(App.Config.CREDIT_DATA_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (!data || typeof data !== 'object') return;

      if (Array.isArray(data.creditRequests)) {
        App.MockData.creditRequests = data.creditRequests;
      }
      if (Array.isArray(data.creditLedger)) {
        App.MockData.creditLedger = data.creditLedger;
      }
      if (data.balances && typeof data.balances === 'object') {
        Object.keys(data.balances).forEach((agentId) => {
          const balance = Number(data.balances[agentId]);
          if (!Number.isFinite(balance)) return;
          const agent = App.MockData.agents.find((a) => a.id === agentId);
          if (agent) agent.balance = balance;
          const user = App.MockData.users.find((u) => u.id === agentId);
          if (user) user.balance = balance;
        });
      }
    } catch (e) {
      console.warn('hydrateCreditData failed', e);
    }
  },

  _persistCreditData() {
    try {
      const balances = {};
      (App.MockData.agents || []).forEach((a) => {
        balances[a.id] = a.balance;
      });
      localStorage.setItem(App.Config.CREDIT_DATA_KEY, JSON.stringify({
        creditRequests: App.MockData.creditRequests || [],
        creditLedger: App.MockData.creditLedger || [],
        balances
      }));
    } catch (e) {
      console.warn('persistCreditData failed', e);
    }
  },

  _persistAgentPermissions(agentId, perms) {
    try {
      const key = App.Config.AGENT_PERMISSIONS_KEY;
      const raw = localStorage.getItem(key);
      const map = raw ? JSON.parse(raw) : {};
      map[agentId] = perms;
      localStorage.setItem(key, JSON.stringify(map));
    } catch (e) {
      console.warn('persistAgentPermissions failed', e);
    }
  },

  _delay() {
    return new Promise((resolve) => {
      setTimeout(resolve, App.Config.MOCK_DELAY_MS || 0);
    });
  },

  _actor() {
    const user = App.Session?.getUser?.();
    return {
      id: user?.id || 'system',
      name: user?.name || 'ระบบ'
    };
  },

  _logAudit(action, actionLabel, detail) {
    const actor = this._actor();
    const entry = {
      id: `AUD-${String(App.MockData.auditLogs.length + 1).padStart(3, '0')}`,
      action,
      actionLabel,
      actorId: actor.id,
      actorName: actor.name,
      detail,
      createdAt: new Date().toISOString()
    };
    App.MockData.auditLogs.unshift(entry);
    return entry;
  },

  _pushCreditLedger({ agentId, amount, balanceAfter, note, type }) {
    const agent = App.MockData.agents.find((a) => a.id === agentId);
    const actor = this._actor();
    const entry = {
      id: `CL-${String(App.MockData.creditLedger.length + 1).padStart(3, '0')}`,
      agentId,
      agentCode: agent?.code || '',
      agentName: agent?.name || '',
      type: type || (amount >= 0 ? 'credit' : 'debit'),
      amount,
      balanceAfter,
      note: note || '',
      createdBy: actor.id,
      createdByName: actor.name,
      createdAt: new Date().toISOString()
    };
    App.MockData.creditLedger.unshift(entry);
    return entry;
  },

  _agentUserPayload(user) {
    if (!user || user.role !== 'agent') return user;
    const agent = App.MockData.agents.find((a) => a.id === user.id);
    if (!App.AgentFeatures) return user;
    const featurePermissions = App.AgentFeatures.getUserPermissions({
      role: 'agent',
      featurePermissions: agent?.featurePermissions
    });
    return { ...user, featurePermissions };
  },

  async login(username, password) {
    await this._delay();
    this._hydrateAgentPermissions();
    const user = App.MockData.users.find(
      (u) => u.username === username && u.password === password
    );
    if (!user) {
      const err = new Error('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      err.code = 'AUTH_FAILED';
      throw err;
    }
    const { password: _, ...safeUser } = user;
    const enrichedUser = this._agentUserPayload(safeUser);
    App.MockData.auditLogs.unshift({
      id: `AUD-${String(App.MockData.auditLogs.length + 1).padStart(3, '0')}`,
      action: 'login',
      actionLabel: 'เข้าสู่ระบบ',
      actorId: user.id,
      actorName: user.name,
      detail: `${user.role === 'admin' ? 'Admin' : 'Agent'} login: ${user.username}`,
      createdAt: new Date().toISOString()
    });
    return { user: enrichedUser, token: `mock-token-${user.id}` };
  },

  async getCurrentUser(userId) {
    await this._delay();
    this._hydrateAgentPermissions();
    const user = App.MockData.users.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');
    const { password: _, ...safeUser } = user;
    return this._agentUserPayload(safeUser);
  },

  async getBalance(agentId) {
    await this._delay();
    this._hydrateCreditData();
    const agent = App.MockData.agents.find((a) => a.id === agentId);
    if (!agent) throw new Error('Agent not found');
    return { balance: agent.balance, currency: 'THB' };
  },

  async refreshBalance(agentId) {
    await this._delay();
    const agent = App.MockData.agents.find((a) => a.id === agentId);
    if (!agent) throw new Error('Agent not found');
    const delta = (Math.random() - 0.5) * 200;
    agent.balance = Math.max(0, Math.round((agent.balance + delta) * 100) / 100);
    const user = App.MockData.users.find((u) => u.id === agentId);
    if (user) user.balance = agent.balance;
    return { balance: agent.balance, currency: 'THB' };
  },

  async getAgents() {
    await this._delay();
    this._hydrateAgentPermissions();
    this._hydrateAgentCommissionRates();
    return [...App.MockData.agents];
  },

  async getAgent(agentId) {
    await this._delay();
    this._hydrateAgentPermissions();
    this._hydrateAgentCommissionRates();
    const agent = App.MockData.agents.find((a) => a.id === agentId);
    if (!agent) throw new Error('Agent not found');
    return { ...agent };
  },

  async updateAgent(agentId, payload) {
    await this._delay();
    const idx = App.MockData.agents.findIndex((a) => a.id === agentId);
    if (idx === -1) throw new Error('Agent not found');

    const nextPayload = { ...payload };
    if (nextPayload.featurePermissions && App.AgentFeatures) {
      nextPayload.featurePermissions = App.AgentFeatures.explicitPermissions(nextPayload.featurePermissions);
    }
    if (nextPayload.commissionRates && App.AgentCommissionRates) {
      nextPayload.commissionRates = App.AgentCommissionRates.normalize(nextPayload.commissionRates);
    }

    App.MockData.agents[idx] = { ...App.MockData.agents[idx], ...nextPayload };
    const user = App.MockData.users.find((u) => u.id === agentId);
    if (user) {
      if (nextPayload.name) user.name = nextPayload.name;
      if (nextPayload.email) user.email = nextPayload.email;
      if (nextPayload.phone) user.phone = nextPayload.phone;
      if (nextPayload.balance != null) user.balance = nextPayload.balance;
      if (nextPayload.featurePermissions) user.featurePermissions = nextPayload.featurePermissions;
    }

    if (nextPayload.featurePermissions) {
      this._persistAgentPermissions(agentId, nextPayload.featurePermissions);
      this._logAudit(
        'agent_permissions',
        'กำหนดสิทธิ์นายหน้า',
        `อัปเดตสิทธิ์ฟังก์ชัน ${App.MockData.agents[idx].code}`
      );
    }

    if (nextPayload.commissionRates) {
      this._persistAgentCommissionRates(agentId, nextPayload.commissionRates);
      this._logAudit(
        'agent_commission_rates',
        'กำหนดอัตราคอมมิชชัน',
        `อัปเดต % คอมมิชชันของ ${App.MockData.agents[idx].code}`
      );
    }

    return { ...App.MockData.agents[idx] };
  },

  async adjustAgentBalance(agentId, amount, note, { skipAudit = false, skipHydrate = false } = {}) {
    await this._delay();
    if (!skipHydrate) this._hydrateCreditData();
    const agent = App.MockData.agents.find((a) => a.id === agentId);
    if (!agent) throw new Error('Agent not found');
    const prev = agent.balance;
    agent.balance = Math.max(0, Math.round((agent.balance + amount) * 100) / 100);
    const user = App.MockData.users.find((u) => u.id === agentId);
    if (user) user.balance = agent.balance;

    this._pushCreditLedger({
      agentId,
      amount,
      balanceAfter: agent.balance,
      note,
      type: amount >= 0 ? 'credit' : 'debit'
    });
    if (!skipAudit) {
      this._logAudit(
        'balance_adjust',
        'ปรับวงเงิน',
        `${amount >= 0 ? 'เติม' : 'หัก'} ${agent.code} ${amount >= 0 ? '+' : ''}${amount.toLocaleString('th-TH')} บาท (ยอดก่อน ${prev.toLocaleString('th-TH')})`
      );
    }
    this._persistCreditData();

    return {
      agentId,
      balance: agent.balance,
      adjustment: amount,
      note: note || '',
      currency: 'THB'
    };
  },

  async createAgent(payload) {
    await this._delay();
    const exists = App.MockData.agents.some((a) => a.code === payload.code);
    if (exists) throw new Error('รหัสนายหน้านี้มีอยู่แล้ว');

    const id = `agent-${String(App.MockData.agents.length + 1).padStart(3, '0')}`;
    const agent = {
      id,
      code: payload.code,
      name: payload.name,
      email: payload.email || '',
      phone: payload.phone || '',
      balance: payload.initialBalance || 0,
      creditLimit: payload.creditLimit || 50000,
      status: 'active',
      createdAt: new Date().toISOString().slice(0, 10),
      featurePermissions: App.AgentFeatures
        ? App.AgentFeatures.normalize(payload.featurePermissions)
        : undefined,
      commissionRates: App.AgentCommissionRates
        ? App.AgentCommissionRates.normalize(payload.commissionRates)
        : undefined
    };
    App.MockData.agents.push(agent);
    App.MockData.users.push({
      id,
      username: payload.code,
      password: payload.password || 'demo',
      role: 'agent',
      name: payload.name,
      agentCode: payload.code,
      email: payload.email || '',
      phone: payload.phone || '',
      initials: payload.name?.slice(0, 2).toUpperCase() || 'AG',
      balance: agent.balance,
      featurePermissions: agent.featurePermissions
    });

    if (agent.balance > 0) {
      this._pushCreditLedger({
        agentId: id,
        amount: agent.balance,
        balanceAfter: agent.balance,
        note: 'วงเงินเริ่มต้น',
        type: 'credit'
      });
    }
    this._logAudit('agent_create', 'เพิ่มนายหน้า', `สร้างบัญชี ${agent.code} — ${agent.name}`);
    if (agent.featurePermissions) {
      this._persistAgentPermissions(id, agent.featurePermissions);
    }
    if (agent.commissionRates) {
      this._persistAgentCommissionRates(id, agent.commissionRates);
    }
    return { ...agent };
  },

  async setAgentStatus(agentId, status) {
    await this._delay();
    const agent = App.MockData.agents.find((a) => a.id === agentId);
    if (!agent) throw new Error('Agent not found');
    agent.status = status;
    this._logAudit(
      'agent_status',
      'เปลี่ยนสถานะนายหน้า',
      `${status === 'active' ? 'เปิดใช้' : 'ระงับ'}บัญชี ${agent.code}`
    );
    return { ...agent };
  },

  async getCreditLedger({ agentId, dateFrom, dateTo } = {}) {
    await this._delay();
    this._hydrateCreditData();
    let list = [...App.MockData.creditLedger];
    if (agentId) list = list.filter((e) => e.agentId === agentId);
    if (dateFrom) list = list.filter((e) => e.createdAt.slice(0, 10) >= dateFrom);
    if (dateTo) list = list.filter((e) => e.createdAt.slice(0, 10) <= dateTo);
    return list;
  },

  async getAuditLogs({ action, dateFrom, dateTo } = {}) {
    await this._delay();
    let list = [...App.MockData.auditLogs];
    if (action) list = list.filter((e) => e.action === action);
    if (dateFrom) list = list.filter((e) => e.createdAt.slice(0, 10) >= dateFrom);
    if (dateTo) list = list.filter((e) => e.createdAt.slice(0, 10) <= dateTo);
    return list;
  },

  async getAdminStats() {
    await this._delay();
    this._hydrateCreditData();
    const agents = App.MockData.agents;
    const activeAgents = agents.filter((a) => a.status === 'active').length;
    const totalBalance = agents.reduce((sum, a) => sum + a.balance, 0);
    const today = new Date().toISOString().slice(0, 10);
    const policiesToday = App.MockData.policies.filter((p) => p.issuedAt === today).length;
    const pendingPolicies = App.MockData.policies.filter((p) => p.status === 'pending').length;
    const pendingCreditRequests = App.MockData.creditRequests.filter((r) => r.status === 'pending').length;
    const todayStr = new Date().toISOString().slice(0, 10);
    const expiringPolicies = App.MockData.policies.filter((p) => {
      if (!p.expiresAt) return false;
      const diff = (new Date(p.expiresAt) - new Date(todayStr)) / 86400000;
      return diff >= 0 && diff <= 60;
    }).length;
    return {
      activeAgents,
      totalAgents: agents.length,
      totalBalance,
      policiesToday,
      pendingPolicies,
      pendingCreditRequests,
      expiringPolicies
    };
  },

  async getAdminNavBadgeCounts() {
    await this._delay();
    this._hydrateCreditData();
    const pendingPolicies = App.MockData.policies.filter((p) => p.status === 'pending').length;
    const pendingCreditRequests = App.MockData.creditRequests.filter((r) => r.status === 'pending').length;
    const todayStr = new Date().toISOString().slice(0, 10);
    const expiringPolicies = App.MockData.policies.filter((p) => {
      if (!p.expiresAt) return false;
      const diff = (new Date(p.expiresAt) - new Date(todayStr)) / 86400000;
      return diff >= 0 && diff <= 60;
    }).length;
    let pendingCommissions = 0;
    Object.keys(App.MockData.commissions).forEach((aid) => {
      pendingCommissions += (App.MockData.commissions[aid] || []).filter((c) => c.status === 'pending').length;
    });
    return {
      pending: pendingPolicies,
      renew: expiringPolicies,
      'credit-requests': pendingCreditRequests,
      commission: pendingCommissions
    };
  },

  async getPolicies({ agentId, date, q, type, status, insurerCode, dateFrom, dateTo } = {}) {
    await this._delay();
    let list = [...App.MockData.policies];
    if (agentId) list = list.filter((p) => p.agentId === agentId);
    if (date) list = list.filter((p) => p.issuedAt === date);
    if (dateFrom) list = list.filter((p) => p.issuedAt >= dateFrom);
    if (dateTo) list = list.filter((p) => p.issuedAt <= dateTo);
    if (type) list = list.filter((p) => p.type === type);
    if (status) list = list.filter((p) => p.status === status);
    if (insurerCode) list = list.filter((p) => p.insurerCode === insurerCode);
    if (q) {
      const term = q.toLowerCase();
      list = list.filter((p) =>
        p.id.toLowerCase().includes(term) ||
        p.plate.toLowerCase().includes(term) ||
        p.agentCode.toLowerCase().includes(term) ||
        (p.insuredName && p.insuredName.toLowerCase().includes(term))
      );
    }
    return list;
  },

  async getPolicy(policyId) {
    await this._delay();
    const policy = App.MockData.policies.find((p) => p.id === policyId);
    if (!policy) throw new Error('Policy not found');
    return { ...policy };
  },

  async getDailySummary({ agentId, date } = {}) {
    await this._delay();
    const key = agentId || 'all';
    const summary = App.MockData.dailySummary[key] || { prb: 0, voluntary: 0, total: 0 };
    return { ...summary, date: date || new Date().toISOString().slice(0, 10) };
  },

  async getMonthlyRevenue({ agentId, type } = {}) {
    await this._delay();
    const key = agentId || 'all';
    const bucket = App.MockData.monthlyRevenue[key] || App.MockData.monthlyRevenue.all;
    const chartType = type || 'prb';
    return bucket[chartType] || bucket.prb;
  },

  async getInsurers() {
    await this._delay();
    return [...App.MockData.insurers];
  },

  async updateInsurer(insurerId, payload) {
    await this._delay();
    const idx = App.MockData.insurers.findIndex((i) => i.id === insurerId);
    if (idx === -1) throw new Error('Insurer not found');
    App.MockData.insurers[idx] = { ...App.MockData.insurers[idx], ...payload };
    this._logAudit(
      'insurer_update',
      'ตั้งค่า API',
      `${payload.apiEnabled ? 'เปิด' : 'ปิด'} API ${App.MockData.insurers[idx].name}`
    );
    return { ...App.MockData.insurers[idx] };
  },

  async updateProfile(userId, payload) {
    await this._delay();
    const user = App.MockData.users.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');
    const allowed = ['name', 'email', 'phone'];
    allowed.forEach((key) => {
      if (payload[key] != null) user[key] = payload[key];
    });
    if (user.role === 'agent') {
      const agent = App.MockData.agents.find((a) => a.id === userId);
      if (agent) {
        if (payload.name) agent.name = payload.name;
        if (payload.email) agent.email = payload.email;
        if (payload.phone) agent.phone = payload.phone;
      }
    }
    const { password: _, ...safeUser } = user;
    return safeUser;
  },

  async changePassword(userId, currentPassword, newPassword) {
    await this._delay();
    const user = App.MockData.users.find((u) => u.id === userId);
    if (!user) throw new Error('ไม่พบผู้ใช้');
    if (user.password !== currentPassword) {
      const err = new Error('รหัสผ่านปัจจุบันไม่ถูกต้อง');
      err.code = 'WRONG_PASSWORD';
      throw err;
    }
    user.password = newPassword;
    this._logAudit('password_change', 'เปลี่ยนรหัสผ่าน', `เปลี่ยนรหัสผ่าน ${user.username}`);
    return { success: true };
  },

  async createPolicy(payload) {
    await this._delay();
    const agentId = App.Session?.getAgentId?.() || payload.agentId;
    const agent = App.MockData.agents.find((a) => a.id === agentId);
    const num = String(App.MockData.policies.length + 1).padStart(3, '0');
    const id = `POL-${new Date().getFullYear()}-${num}`;
    const premium = parseFloat(payload.premiumTotal) || 0;

    if (agent && premium > 0) {
      agent.balance = Math.max(0, Math.round((agent.balance - premium) * 100) / 100);
      const user = App.MockData.users.find((u) => u.id === agentId);
      if (user) user.balance = agent.balance;
    }

    const policy = {
      id,
      agentId,
      agentCode: agent?.code || payload.agentCode || '',
      type: payload.type || 'prb',
      typeLabel: payload.typeLabel || 'พ.ร.บ.',
      insurer: payload.insurer || 'อินทรประกันภัย',
      insurerCode: payload.insurerCode || 'indara',
      productName: payload.productName || '',
      plate: payload.licensePlate || '-',
      premium,
      status: 'active',
      issuedAt: new Date().toISOString().slice(0, 10),
      expiresAt: payload.coverageEnd || null,
      insuredName: `${payload.firstName || ''} ${payload.lastName || ''}`.trim() || payload.insuredName || '-',
      vehicleBrand: payload.carBrand || '',
      vehicleModel: payload.carModel || ''
    };
    App.MockData.policies.unshift(policy);
    this._logAudit('policy_issue', 'ออกกรมธรรม์', `ออก ${id} ทะเบียน ${policy.plate}`);
    return { ...policy };
  },

  async getNotifications(userId) {
    await this._delay();
    return [...(App.MockData.notifications[userId] || [])];
  },

  async markNotificationRead(userId, notifId) {
    await this._delay();
    const list = App.MockData.notifications[userId] || [];
    const item = list.find((n) => n.id === notifId);
    if (item) item.read = true;
    return item;
  },

  async getTeamMembers(agentId) {
    await this._delay();
    return [...(App.MockData.teamMembers[agentId] || [])];
  },

  async updateTeamMember(agentId, memberId, data) {
    await this._delay();
    const list = App.MockData.teamMembers[agentId];
    if (!list) throw new Error('ไม่พบทีม');
    const idx = list.findIndex((m) => m.id === memberId);
    if (idx < 0) throw new Error('ไม่พบตัวแทน');
    list[idx] = { ...list[idx], ...data };
    return { ...list[idx] };
  },

  async addTeamMember(agentId, data) {
    await this._delay();
    if (!App.MockData.teamMembers[agentId]) {
      App.MockData.teamMembers[agentId] = [];
    }
    const list = App.MockData.teamMembers[agentId];
    const seq = String(list.length + 1).padStart(2, '0');
    const member = {
      id: `sub-${Date.now()}`,
      code: data.code || `Ck${seq}-new`,
      userId: data.userId || data.code || `U${seq}`,
      name: data.name,
      phone: data.phone || '-',
      balance: data.balance ?? 0,
      status: 'active',
      idCard: data.idCard || '-',
      birthDate: data.birthDate || '-',
      email: data.email || '-',
      address: data.address || '-',
      policies: 0,
      premium: 0
    };
    list.push(member);
    return { ...member };
  },

  async getRenewals(agentId) {
    await this._delay();
    const today = new Date();
    const limit = new Date();
    limit.setDate(limit.getDate() + 60);
    const fmt = (d) => d.toISOString().slice(0, 10);
    let list = App.MockData.policies.filter((p) => {
      if (!p.expiresAt) return false;
      if (agentId && p.agentId !== agentId) return false;
      return p.expiresAt >= fmt(today) && p.expiresAt <= fmt(limit);
    });
    return list.sort((a, b) => a.expiresAt.localeCompare(b.expiresAt));
  },

  async retryPolicy(policyId) {
    await this._delay();
    const policy = App.MockData.policies.find((p) => p.id === policyId);
    if (!policy) throw new Error('ไม่พบกรมธรรม์');
    if (policy.status !== 'failed' && policy.status !== 'pending') {
      throw new Error('กรมธรรม์นี้ไม่สามารถ retry ได้');
    }
    policy.status = Math.random() > 0.3 ? 'active' : 'pending';
    policy.apiError = policy.status === 'active' ? null : 'รอตรวจสอบจากบริษัทประกัน';
    this._logAudit('policy_retry', 'Retry กรมธรรม์', `Retry ${policyId} → ${policy.status}`);
    return { ...policy };
  },

  async cancelPolicy(policyId) {
    await this._delay();
    const policy = App.MockData.policies.find((p) => p.id === policyId);
    if (!policy) throw new Error('ไม่พบกรมธรรม์');
    policy.status = 'cancelled';
    this._logAudit('policy_cancel', 'ยกเลิกกรมธรรม์', `ยกเลิก ${policyId}`);
    return { ...policy };
  },

  async testInsurerConnection(insurerId) {
    await this._delay();
    const ins = App.MockData.insurers.find((i) => i.id === insurerId);
    if (!ins) throw new Error('ไม่พบบริษัทประกัน');
    if (!ins.apiEnabled) throw new Error('API ถูกปิดใช้งาน');
    const ok = Math.random() > 0.15;
    return {
      success: ok,
      message: ok ? `เชื่อมต่อ ${ins.apiProvider} สำเร็จ (${ins.apiTimeout}s)` : 'Connection timeout',
      latencyMs: ok ? Math.floor(Math.random() * 400) + 80 : null
    };
  },

  async getAdminUsers() {
    await this._delay();
    return [...App.MockData.adminUsers];
  },

  async getAgentComparison() {
    await this._delay();
    return App.MockData.agents.map((a) => {
      const policies = App.MockData.policies.filter((p) => p.agentId === a.id && p.status === 'active');
      const premium = policies.reduce((s, p) => s + p.premium, 0);
      return {
        id: a.id,
        code: a.code,
        name: a.name,
        policyCount: policies.length,
        totalPremium: Math.round(premium * 100) / 100,
        balance: a.balance,
        creditLimit: a.creditLimit || 0
      };
    }).sort((a, b) => b.totalPremium - a.totalPremium);
  },

  async getCommissions(agentId, { period, periodType = 'month', status } = {}) {
    await this._delay();
    let list = [...(App.MockData.commissions[agentId] || [])];
    if (period) {
      list = list.filter((c) => {
        const earnedAt = c.earnedAt || `${c.period || ''}-01`;
        if (periodType === 'day') return earnedAt === period;
        if (periodType === 'year') return earnedAt.startsWith(`${period}-`);
        return c.period === period;
      });
    }
    if (status) list = list.filter((c) => c.status === status);
    return list.sort((a, b) => (b.earnedAt || '').localeCompare(a.earnedAt || ''));
  },

  async getCommissionSummary(agentId, filters = {}) {
    await this._delay();
    if (typeof filters === 'string') filters = { period: filters, periodType: 'month' };
    const list = await this.getCommissions(agentId, filters);
    const paid = list.filter((c) => c.status === 'paid');
    const pending = list.filter((c) => c.status === 'pending');
    const sum = (arr) => arr.reduce((s, c) => s + c.amount, 0);
    return {
      period: filters.period || 'ทั้งหมด',
      total: Math.round(sum(list) * 100) / 100,
      paid: Math.round(sum(paid) * 100) / 100,
      pending: Math.round(sum(pending) * 100) / 100,
      count: list.length
    };
  },

  async getCreditBankAccounts() {
    await this._delay(80);
    return (App.MockData.creditBankAccounts || []).map((a) => ({ ...a }));
  },

  async getCreditRequests(agentId, { period, periodType = 'month', status } = {}) {
    await this._delay();
    this._hydrateCreditData();
    let list = App.MockData.creditRequests.filter((r) => r.agentId === agentId);
    if (period) {
      list = list.filter((r) => {
        const createdDate = String(r.createdAt || '').slice(0, 10);
        if (periodType === 'day') return createdDate === period;
        if (periodType === 'year') return createdDate.startsWith(`${period}-`);
        return createdDate.startsWith(`${period}-`);
      });
    }
    if (status) list = list.filter((r) => r.status === status);
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async createCreditRequest(agentId, payload = {}) {
    await this._delay();
    this._hydrateCreditData();
    const agent = App.MockData.agents.find((a) => a.id === agentId);
    if (!agent) throw new Error('ไม่พบนายหน้า');
    const num = Number(payload.amount);
    if (!num || num < 1000) throw new Error('กรุณาระบุจำนวนเงินขั้นต่ำ 1,000 บาท');
    if (num > 50000) throw new Error('จำนวนเงินสูงสุด 50,000 บาท');
    if (!payload.slipDataUrl) throw new Error('กรุณาอัปโหลดหลักฐานการโอนเงิน');
    if (!payload.transferDate) throw new Error('กรุณาระบุวันที่โอนเงิน');
    if (!payload.transferTime) throw new Error('กรุณาระบุเวลาที่โอน');

    const banks = App.MockData.creditBankAccounts || [];
    const bank =
      banks.find((b) => b.id === payload.bankAccountId) ||
      banks[0] ||
      null;
    if (!bank) throw new Error('ไม่พบบัญชีธนาคารสำหรับรับโอน');

    const entry = {
      id: `CR-${String(App.MockData.creditRequests.length + 1).padStart(3, '0')}`,
      agentId,
      agentCode: agent.code,
      amount: num,
      note: payload.note || '',
      paymentMethod: 'bank_transfer',
      bankAccountId: bank.id,
      bankName: bank.bankName,
      accountNo: bank.accountNo,
      accountName: bank.accountName,
      transferDate: payload.transferDate,
      transferTime: payload.transferTime,
      slipFileName: payload.slipFileName || 'slip.jpg',
      slipDataUrl: payload.slipDataUrl,
      status: 'pending',
      createdAt: new Date().toISOString(),
      reviewedAt: null,
      reviewedByName: null
    };
    App.MockData.creditRequests.unshift(entry);
    this._persistCreditData();
    this._logAudit(
      'credit_request',
      'ขอเติมวงเงิน',
      `${agent.code} ขอเติม ${num.toLocaleString('th-TH')} บาท ผ่าน ${bank.bankName}`
    );
    return { ...entry };
  },

  async getOwnCreditLedger(agentId) {
    await this._delay();
    this._hydrateCreditData();
    return App.MockData.creditLedger
      .filter((e) => e.agentId === agentId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async getMonthlySalesReport(agentId, yearMonth) {
    await this._delay();
    const bucket = App.MockData.monthlySalesDetail[agentId] || {};
    const key = yearMonth || Object.keys(bucket).sort().reverse()[0] || '';
    const data = bucket[key];
    if (!data) {
      return {
        period: key,
        summary: { prb: { count: 0, premium: 0 }, voluntary: { count: 0, premium: 0 }, total: { count: 0, premium: 0 } },
        byInsurer: [],
        byDay: []
      };
    }
    return { period: key, ...data };
  },

  async getTeamSalesReport(agentId, yearMonth) {
    await this._delay();
    const bucket = App.MockData.teamSalesReport[agentId] || {};
    const key = yearMonth || Object.keys(bucket).sort().reverse()[0] || '';
    const rows = bucket[key] || [];
    const totals = rows.reduce(
      (acc, r) => ({
        policyCount: acc.policyCount + r.policyCount,
        premium: acc.premium + r.premium,
        commission: acc.commission + r.commission
      }),
      { policyCount: 0, premium: 0, commission: 0 }
    );
    return { period: key, rows, totals };
  },

  async getAllCreditRequests({ status } = {}) {
    await this._delay();
    this._hydrateCreditData();
    let list = [...App.MockData.creditRequests];
    if (status) list = list.filter((r) => r.status === status);
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async reviewCreditRequest(requestId, action) {
    await this._delay();
    this._hydrateCreditData();
    const req = App.MockData.creditRequests.find((r) => r.id === requestId);
    if (!req) throw new Error('ไม่พบคำขอ');
    if (req.status !== 'pending') throw new Error('คำขอนี้ดำเนินการแล้ว');
    const actor = this._actor();
    if (action === 'approve') {
      req.status = 'approved';
      await this.adjustAgentBalance(req.agentId, req.amount, `อนุมัติคำขอ ${req.id}`, {
        skipAudit: true,
        skipHydrate: true
      });
    } else if (action === 'reject') {
      req.status = 'rejected';
    } else {
      throw new Error('การดำเนินการไม่ถูกต้อง');
    }
    req.reviewedAt = new Date().toISOString();
    req.reviewedByName = actor.name;
    this._persistCreditData();
    this._logAudit(
      'credit_review',
      action === 'approve' ? 'อนุมัติเติมวงเงิน' : 'ปฏิเสธเติมวงเงิน',
      `${req.agentCode} ${action === 'approve' ? '+' : ''}${req.amount.toLocaleString('th-TH')} บาท`
    );
    return { ...req };
  },

  async getAllCommissions({ period, status, agentId } = {}) {
    await this._delay();
    let list = [];
    Object.keys(App.MockData.commissions).forEach((aid) => {
      const agent = App.MockData.agents.find((a) => a.id === aid);
      (App.MockData.commissions[aid] || []).forEach((c) => {
        list.push({
          ...c,
          agentId: aid,
          agentCode: agent?.code || '',
          agentName: agent?.name || ''
        });
      });
    });
    if (agentId) list = list.filter((c) => c.agentId === agentId);
    if (period) list = list.filter((c) => c.period === period);
    if (status) list = list.filter((c) => c.status === status);
    return list.sort((a, b) => (b.period || '').localeCompare(a.period || ''));
  },

  async updateCommissionStatus(commissionId, status) {
    await this._delay();
    for (const aid of Object.keys(App.MockData.commissions)) {
      const idx = App.MockData.commissions[aid].findIndex((c) => c.id === commissionId);
      if (idx >= 0) {
        App.MockData.commissions[aid][idx].status = status;
        if (status === 'paid') {
          App.MockData.commissions[aid][idx].paidAt = new Date().toISOString().slice(0, 10);
        }
        this._logAudit('commission_update', 'อัปเดตค่าคอม', `${commissionId} → ${status}`);
        return { ...App.MockData.commissions[aid][idx] };
      }
    }
    throw new Error('ไม่พบรายการค่าคอม');
  },

  async getAllRenewals({ days = 60 } = {}) {
    await this._delay();
    const today = new Date();
    const limit = new Date();
    limit.setDate(limit.getDate() + days);
    const fmt = (d) => d.toISOString().slice(0, 10);
    return App.MockData.policies
      .filter((p) => p.expiresAt && p.expiresAt >= fmt(today) && p.expiresAt <= fmt(limit))
      .map((p) => {
        const agent = App.MockData.agents.find((a) => a.id === p.agentId);
        return {
          ...p,
          policyNo: p.id,
          agentName: agent?.name || '',
          totalPremium: p.premium
        };
      })
      .sort((a, b) => a.expiresAt.localeCompare(b.expiresAt));
  },

  async getTeamHierarchy() {
    await this._delay();
    return Object.keys(App.MockData.teamMembers).map((leaderId) => {
      const leader = App.MockData.agents.find((a) => a.id === leaderId);
      const members = App.MockData.teamMembers[leaderId] || [];
      return {
        leaderId,
        leaderCode: leader?.code || '',
        leaderName: leader?.name || '',
        memberCount: members.length,
        members
      };
    });
  },

  async getAdminMonthlySalesReport(yearMonth) {
    await this._delay();
    return this.getMonthlySalesReport('all', yearMonth);
  },

  async getAdminTeamSalesReport(yearMonth) {
    await this._delay();
    return this.getTeamSalesReport('all', yearMonth);
  },

  async getReceipts({ agentId, date, q } = {}) {
    await this._delay();
    let list = [...App.MockData.receipts];
    if (agentId) list = list.filter((r) => r.agentId === agentId);
    if (date) list = list.filter((r) => r.issuedAt.slice(0, 10) === date);
    if (q) {
      const term = q.toLowerCase();
      list = list.filter((r) =>
        r.receiptNo.toLowerCase().includes(term) ||
        r.customerName.toLowerCase().includes(term) ||
        r.policyNo.toLowerCase().includes(term) ||
        r.agentCode.toLowerCase().includes(term)
      );
    }
    return list.sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
  },

  async getProductSettings() {
    await this._delay();
    return { ...App.MockData.productSettings };
  },

  async updateProductSettings(code, payload) {
    await this._delay();
    if (!App.MockData.productSettings[code]) {
      App.MockData.productSettings[code] = { prb: false, voluntary: false, accident: false, travel: false };
    }
    App.MockData.productSettings[code] = { ...App.MockData.productSettings[code], ...payload };
    this._logAudit('product_update', 'ตั้งค่าผลิตภัณฑ์', `${code}: ${JSON.stringify(payload)}`);
    return { code, ...App.MockData.productSettings[code] };
  },

  _hydrateReceiptPaperSettings() {
    if (this._receiptPaperHydrated) return;
    this._receiptPaperHydrated = true;
    try {
      const key = App.Config.RECEIPT_PAPER_KEY;
      const raw = localStorage.getItem(key);
      if (!raw) {
        App.MockData.receiptPaperByOwner = App.MockData.receiptPaperByOwner || {};
        return;
      }
      const stored = JSON.parse(raw);
      if (!stored || typeof stored !== 'object') return;

      // Legacy flat settings → treat as company default
      if (stored.name || stored.address || stored.logoUrl) {
        App.MockData.receiptPaperByOwner = { default: { ...stored } };
        return;
      }

      if (stored.byOwner && typeof stored.byOwner === 'object') {
        App.MockData.receiptPaperByOwner = { ...stored.byOwner };
      }
    } catch (e) {
      console.warn('hydrateReceiptPaperSettings failed', e);
    }
  },

  _persistReceiptPaperSettings() {
    try {
      localStorage.setItem(
        App.Config.RECEIPT_PAPER_KEY,
        JSON.stringify({ byOwner: App.MockData.receiptPaperByOwner || {} })
      );
    } catch (e) {
      console.warn('persistReceiptPaperSettings failed', e);
    }
  },

  _paperOwnerId(explicitId) {
    if (explicitId) return explicitId;
    const user = App.AuthService?.getCurrentUser?.() || App.Session?.getUser?.();
    if (!user || user.role === 'admin') return 'default';
    return user.id || 'default';
  },

  _resolvePaperSettings(ownerId) {
    const seed = App.MockData.receiptPaperSettings || {};
    const map = App.MockData.receiptPaperByOwner || {};
    const company = map.default || {};
    if (ownerId === 'default') {
      return { ...seed, ...company };
    }
    const own = map[ownerId] || {};
    return { ...seed, ...company, ...own };
  },

  async getReceiptPaperSettings(ownerId) {
    await this._delay();
    this._hydrateReceiptPaperSettings();
    const id = this._paperOwnerId(ownerId);
    return this._resolvePaperSettings(id);
  },

  async updateReceiptPaperSettings(payload, ownerId) {
    await this._delay();
    this._hydrateReceiptPaperSettings();
    const id = this._paperOwnerId(ownerId);
    const next = {
      ...this._resolvePaperSettings(id),
      ...payload
    };
    if (!App.MockData.receiptPaperByOwner) App.MockData.receiptPaperByOwner = {};
    App.MockData.receiptPaperByOwner[id] = next;
    this._persistReceiptPaperSettings();
    const who = id === 'default' ? 'ค่ากลางระบบ' : id;
    this._logAudit('receipt_paper', 'ตั้งค่าใบเสร็จ', `อัปเดตหัวกระดาษ (${who}) — ${next.name}`);
    return { ...next };
  }
};

App.MockAPI._hydrateAgentPermissions();
App.MockAPI._hydrateReceiptPaperSettings();
App.MockAPI._hydrateCreditData();
