/**
 * Mock API — implements the same contract as the future REST backend.
 */
window.App = window.App || {};

App.MockAPI = {
  _permissionsHydrated: false,
  _commissionRatesHydrated: false,
  _wht50SettingsHydrated: false,

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

  _teamHydrated: false,

  _hydrateAgentTeam() {
    if (this._teamHydrated) return;
    this._teamHydrated = true;
    try {
      const raw = localStorage.getItem(App.Config.AGENT_TEAM_KEY);
      if (raw) {
        const map = JSON.parse(raw);
        if (map && typeof map === 'object') {
          App.MockData.agents.forEach((agent) => {
            if (Object.prototype.hasOwnProperty.call(map, agent.id)) {
              agent.parentId = map[agent.id] || null;
            }
          });
        }
      }
    } catch (e) {
      console.warn('hydrateAgentTeam failed', e);
    }
    this._rebuildTeamMembersFromParents();
  },

  _persistAgentTeam() {
    try {
      const map = {};
      App.MockData.agents.forEach((a) => {
        map[a.id] = a.parentId || null;
      });
      localStorage.setItem(App.Config.AGENT_TEAM_KEY, JSON.stringify(map));
    } catch (e) {
      console.warn('persistAgentTeam failed', e);
    }
  },

  _wouldCreateTeamCycle(agentId, parentId) {
    let cur = parentId || null;
    const seen = new Set();
    while (cur) {
      if (cur === agentId) return true;
      if (seen.has(cur)) return true;
      seen.add(cur);
      const parent = App.MockData.agents.find((a) => a.id === cur);
      cur = parent?.parentId || null;
    }
    return false;
  },

  _rebuildTeamMembersFromParents() {
    const map = {};
    App.MockData.agents.forEach((a) => {
      if (!a.parentId) return;
      if (!App.MockData.agents.some((p) => p.id === a.parentId)) {
        a.parentId = null;
        return;
      }
      if (!map[a.parentId]) map[a.parentId] = [];
      map[a.parentId].push({
        id: a.id,
        code: a.code,
        userId: a.code,
        name: a.name,
        phone: a.phone || '-',
        balance: a.balance,
        status: a.status,
        email: a.email || '-',
        policies: 0,
        premium: 0
      });
    });
    App.MockData.teamMembers = map;
  },

  _setAgentParent(agentId, parentId) {
    const agent = App.MockData.agents.find((a) => a.id === agentId);
    if (!agent) throw new Error('Agent not found');
    const nextParent = parentId || null;
    if (nextParent === agentId) throw new Error('ไม่สามารถตั้งตัวเองเป็นหัวหน้าทีมได้');
    if (nextParent && !App.MockData.agents.some((a) => a.id === nextParent)) {
      throw new Error('ไม่พบหัวหน้าทีมที่เลือก');
    }
    if (nextParent && this._wouldCreateTeamCycle(agentId, nextParent)) {
      throw new Error('ไม่สามารถตั้งหัวหน้าทีมแบบวนลูปได้');
    }
    agent.parentId = nextParent;
    this._rebuildTeamMembersFromParents();
    this._persistAgentTeam();
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
      let withdrawMigrated = false;
      if (Array.isArray(data.withdrawRequests)) {
        const next = data.withdrawRequests.filter((r) => !(
          r.id === 'WD-001'
          && Number(r.amount) === 3500
          && r.status === 'pending'
        ));
        withdrawMigrated = next.length !== data.withdrawRequests.length;
        App.MockData.withdrawRequests = next;
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
      if (withdrawMigrated) this._persistCreditData();
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
        withdrawRequests: App.MockData.withdrawRequests || [],
        balances
      }));
    } catch (e) {
      console.warn('persistCreditData failed', e);
    }
  },

  _hydrateCreditBankAccounts() {
    try {
      const raw = localStorage.getItem(App.Config.CREDIT_BANK_ACCOUNTS_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (!Array.isArray(data)) return;
      App.MockData.creditBankAccounts = data.map((b) => {
        const enabled = !(b.enabled === false || b.enabled === 0 || b.enabled === '0' || b.enabled === 'false');
        return {
          ...b,
          enabled,
          activeFrom: b.activeFrom || '00:00',
          activeTo: b.activeTo || '23:59'
        };
      });
    } catch (e) {
      console.warn('hydrateCreditBankAccounts failed', e);
    }
  },

  _persistCreditBankAccounts() {
    try {
      localStorage.setItem(App.Config.CREDIT_BANK_ACCOUNTS_KEY, JSON.stringify(App.MockData.creditBankAccounts || []));
    } catch (e) {
      console.warn('persistCreditBankAccounts failed', e);
    }
  },

  _hydrateWht50Documents() {
    try {
      const raw = localStorage.getItem(App.Config.WHT50_DATA_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (!Array.isArray(data)) return;
      // Keep seeded demo docs when localStorage is still empty
      if (data.length === 0 && (App.MockData.wht50Documents || []).length) return;
      const byId = new Map((App.MockData.wht50Documents || []).map((d) => [d.id, d]));
      data.forEach((d) => byId.set(d.id, d));
      App.MockData.wht50Documents = [...byId.values()];
    } catch (e) {
      console.warn('hydrateWht50Documents failed', e);
    }
  },

  _hydrateWht50Settings() {
    if (this._wht50SettingsHydrated) return;
    this._wht50SettingsHydrated = true;
    try {
      const company = App.Config?.COMPANY || {};
      const raw = localStorage.getItem(App.Config.WHT50_SETTINGS_KEY);
      if (!raw) {
        App.MockData.wht50Settings = {
          payer: {
            name: company.name || '',
            address: company.address || '',
            taxId: company.taxId || ''
          },
          signatureUrlData: null,
          stampUrlData: null
        };
        return;
      }
      const parsed = JSON.parse(raw);
      const payer = parsed?.payer || {};
      App.MockData.wht50Settings = {
        payer: {
          name: payer.name ?? (company.name || ''),
          address: payer.address ?? (company.address || ''),
          taxId: payer.taxId ?? (company.taxId || '')
        },
        signatureUrlData: parsed?.signatureUrlData || null,
        stampUrlData: parsed?.stampUrlData || null
      };
    } catch (e) {
      console.warn('hydrateWht50Settings failed', e);
      const company = App.Config?.COMPANY || {};
      App.MockData.wht50Settings = {
        payer: {
          name: company.name || '',
          address: company.address || '',
          taxId: company.taxId || ''
        },
        signatureUrlData: null,
        stampUrlData: null
      };
    }
  },

  async getWht50Settings() {
    await this._delay();
    this._hydrateWht50Settings();
    return JSON.parse(JSON.stringify(App.MockData.wht50Settings || {}));
  },

  async updateWht50Settings(payload = {}) {
    await this._delay();
    this._hydrateWht50Settings();

    const company = App.Config?.COMPANY || {};
    const payer = payload.payer || {};
    const next = {
      payer: {
        name: payer.name ?? company.name ?? '',
        address: payer.address ?? company.address ?? '',
        taxId: payer.taxId ?? company.taxId ?? ''
      },
      signatureUrlData: payload.signatureUrlData || null,
      stampUrlData: payload.stampUrlData || null
    };

    App.MockData.wht50Settings = next;
    try {
      localStorage.setItem(App.Config.WHT50_SETTINGS_KEY, JSON.stringify(next));
    } catch (e) {
      console.warn('persistWht50Settings failed', e);
    }

    const applyToUnprinted = !!payload.applyToUnprinted;
    if (applyToUnprinted) {
      this._hydrateWht50Documents();
      (App.MockData.wht50Documents || []).forEach((d) => {
        if (d.printedAt) return;
        d.payer = {
          ...(d.payer || {}),
          ...next.payer,
          signatureUrl: next.signatureUrlData || undefined,
          stampUrl: next.stampUrlData || undefined
        };
      });
      this._persistWht50Documents();
    }

    this._logAudit?.('wht50_settings', 'ตั้งค่า 50 ทวิ', `applyToUnprinted=${applyToUnprinted}`);
    return JSON.parse(JSON.stringify(next));
  },

  _persistWht50Documents() {
    // Append-only archive: documents are never deleted from localStorage.
    try {
      localStorage.setItem(App.Config.WHT50_DATA_KEY, JSON.stringify(App.MockData.wht50Documents || []));
    } catch (e) {
      console.warn('persistWht50Documents failed', e);
    }
  },

  _nextWht50DocNo() {
    this._hydrateWht50Documents();
    const list = App.MockData.wht50Documents || [];
    const now = new Date();
    const ym = `${now.getFullYear() + 543}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const seq = list.filter((d) => String(d.docNo || '').startsWith(ym)).length + 1;
    return `${ym}-${String(seq).padStart(4, '0')}`;
  },

  _mapPolicyToProductKey(policy) {
    const type = String(policy.type || policy.typeLabel || '').toLowerCase();
    let category = 'compulsory';
    if (type.includes('voluntary') || type.includes('2+') || type.includes('3+')) category = 'voluntary';
    else if (type.includes('pa') || type.includes('อุบัติเหตุ')) category = 'pa';
    else if (type.includes('travel') || type.includes('เดินทาง')) category = 'travel';
    else if (type.includes('prb') || type.includes('พ.ร.บ') || type.includes('compulsory')) category = 'compulsory';

    const insurerCode = String(policy.insurerCode || '').toLowerCase()
      || (String(policy.insurer || '').includes('เออร์โก') ? 'ergo'
        : String(policy.insurer || '').includes('อินทร') ? 'indara'
          : String(policy.insurer || '').toLowerCase().includes('axa') ? 'axa'
            : String(policy.insurer || '').includes('กรุงเทพ') ? 'bki'
              : String(policy.insurer || '').toLowerCase().includes('chubb') ? 'chubb'
                : 'indara');
    return `${category}-${insurerCode}`;
  },

  _postCommissionRecord(agent, policy, payload, settlement, extra = {}) {
    if (!App.MockData.commissions[agent.id]) App.MockData.commissions[agent.id] = [];
    const immediate = !!App.Config?.COMMISSION_PAY_THROUGH_WALLET;
    const earnedAt = policy.issuedAt || new Date().toISOString().slice(0, 10);
    const grossPremium = Number(payload.premiumTotal ?? policy.premium) || 0;
    const netPremium = Number(payload.netPremium ?? payload.premiumNet ?? grossPremium) || 0;
    const commission = {
      id: `COM-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      policyNo: policy.id,
      policyType: policy.type,
      policyTypeLabel: policy.typeLabel,
      insurer: policy.insurer,
      insurerCode: policy.insurerCode,
      productKey: extra.productKey || this._mapPolicyToProductKey(policy),
      plate: policy.plate,
      premium: grossPremium,
      netPremium,
      rate: settlement.rate,
      amount: settlement.netCommission,
      commissionGross: settlement.commission,
      taxWithhold: settlement.taxWithhold,
      taxEnabled: settlement.taxEnabled,
      status: immediate ? 'paid' : 'pending',
      period: earnedAt.slice(0, 7),
      earnedAt,
      paidAt: immediate ? earnedAt : null,
      issueForm50Tawi: settlement.issueForm50Tawi,
      wht50Id: null,
      ...extra.fields
    };
    App.MockData.commissions[agent.id].unshift(commission);

    if (settlement.issueForm50Tawi) {
      const wht = this._createWht50Document({
        agent,
        commission,
        policy,
        settlement
      });
      commission.wht50Id = wht.id;
    }
    return commission;
  },

  _clearCommissionForPolicy(agent, policy, payload = {}) {
    if (!agent || !App.AgentCommissionRates) return null;
    this._hydrateAgentCommissionRates();
    const rates = App.AgentCommissionRates.normalize(agent.commissionRates);
    const productKey = this._mapPolicyToProductKey(policy);
    const grossPremium = Number(payload.premiumTotal ?? policy.premium) || 0;
    const netPremium = Number(payload.netPremium ?? payload.premiumNet ?? grossPremium) || 0;
    const settlement = App.AgentCommissionRates.calcSettlement({
      netPremium,
      grossPremium,
      rates,
      productKey
    });

    const commission = this._postCommissionRecord(agent, policy, payload, settlement, { productKey });

    let overrideCommission = null;
    if (agent.parentId && rates.overrideEnabled) {
      const parent = App.MockData.agents.find((a) => a.id === agent.parentId);
      if (parent) {
        const overrideRates = App.AgentCommissionRates.overrideAsRates(rates);
        const overrideSettlement = App.AgentCommissionRates.calcSettlement({
          netPremium,
          grossPremium,
          rates: overrideRates,
          productKey
        });
        if (overrideSettlement.rate > 0) {
          overrideCommission = this._postCommissionRecord(parent, policy, payload, overrideSettlement, {
            productKey,
            fields: {
              kind: 'team-override',
              sourceAgentId: agent.id,
              sourceAgentCode: agent.code,
              sourceAgentName: agent.name
            }
          });
        }
      }
    }

    return { commission, settlement, overrideCommission };
  },

  _createWht50Document({ agent, commission, policy, settlement }) {
    this._hydrateWht50Documents();
    if (!App.MockData.wht50Documents) App.MockData.wht50Documents = [];
    const company = App.Config?.COMPANY || {};
    this._hydrateWht50Settings();
    const whtSettings = App.MockData.wht50Settings || {};
    const payerSettings = whtSettings.payer || {};
    const doc = {
      id: `WHT50-${Date.now()}`,
      docNo: this._nextWht50DocNo(),
      bookNo: String(new Date().getFullYear() + 543),
      seqNo: String((App.MockData.wht50Documents.length % 99) + 1),
      commissionId: commission.id,
      policyNo: policy?.id || commission.policyNo,
      agentId: agent.id,
      agentCode: agent.code,
      payer: {
        name: payerSettings.name || company.name || 'บริษัท กล้าดีโบรคเกอร์ จำกัด',
        address: payerSettings.address || company.address || '',
        taxId: payerSettings.taxId || company.taxId || '',
        signatureUrl: whtSettings.signatureUrlData || undefined,
        stampUrl: whtSettings.stampUrlData || undefined
      },
      payee: {
        name: agent.name,
        address: agent.address || '-',
        taxId: agent.taxId || agent.idCard || '',
        idCard: agent.idCard || ''
      },
      // Business rule: tax withhold OFF → issue Form 50 ทวิ.
      // paidAmount = commission (gross before tax, which equals netCommission when tax off)
      paidAmount: settlement.commission,
      taxAmount: settlement.taxWithhold || 0,
      incomeType: '2',
      formType: '4',
      payMethod: '1',
      issuedAt: commission.paidAt || commission.earnedAt || new Date().toISOString().slice(0, 10),
      paidAt: commission.paidAt || commission.earnedAt,
      printedAt: null,
      refNote: `กรมธรรม์ ${policy?.id || '-'} / คอมมิชชัน ${commission.id} / ทะเบียน ${policy?.plate || '-'}`
    };
    App.MockData.wht50Documents.unshift(doc);
    this._persistWht50Documents();
    this._logAudit('wht50_issue', 'ออกหนังสือ 50 ทวิ', `${doc.docNo} สำหรับ ${agent.code}`);
    return { ...doc };
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

  _pushCreditLedger({ agentId, amount, balanceAfter, note, type, slipFileName, slipDataUrl }) {
    const agent = App.MockData.agents.find((a) => a.id === agentId);
    const actor = this._actor();
    const hasSlip = !!slipDataUrl;
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
      createdAt: new Date().toISOString(),
      hasSlip,
      slipFileName: hasSlip ? (slipFileName || 'slip.jpg') : null,
      slipDataUrl: slipDataUrl || null
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
    this._hydrateAgentTeam();
    return [...App.MockData.agents];
  },

  async getAgent(agentId) {
    await this._delay();
    this._hydrateAgentPermissions();
    this._hydrateAgentCommissionRates();
    this._hydrateAgentTeam();
    const agent = App.MockData.agents.find((a) => a.id === agentId);
    if (!agent) throw new Error('Agent not found');
    return { ...agent };
  },

  async updateAgent(agentId, payload) {
    await this._delay();
    this._hydrateAgentTeam();
    const idx = App.MockData.agents.findIndex((a) => a.id === agentId);
    if (idx === -1) throw new Error('Agent not found');

    const nextPayload = { ...payload };
    const hasParentChange = Object.prototype.hasOwnProperty.call(nextPayload, 'parentId');
    if (hasParentChange) {
      this._setAgentParent(agentId, nextPayload.parentId || null);
      delete nextPayload.parentId;
    }
    if (nextPayload.featurePermissions && App.AgentFeatures) {
      nextPayload.featurePermissions = App.AgentFeatures.explicitPermissions(nextPayload.featurePermissions);
    }
    if (nextPayload.commissionRates && App.AgentCommissionRates) {
      nextPayload.commissionRates = App.AgentCommissionRates.normalize(nextPayload.commissionRates);
    }

    const nextPassword = String(nextPayload.password || '').trim();
    delete nextPayload.password;

    App.MockData.agents[idx] = { ...App.MockData.agents[idx], ...nextPayload };
    const user = App.MockData.users.find((u) => u.id === agentId);
    if (user) {
      if (nextPayload.name) user.name = nextPayload.name;
      if (nextPayload.email) user.email = nextPayload.email;
      if (nextPayload.phone) user.phone = nextPayload.phone;
      if (nextPayload.balance != null) user.balance = nextPayload.balance;
      if (nextPayload.featurePermissions) user.featurePermissions = nextPayload.featurePermissions;
      if (nextPassword) {
        user.password = nextPassword;
        this._logAudit('password_reset', 'ตั้งรหัสผ่านนายหน้า', `แอดมินตั้งรหัสผ่าน ${user.username}`);
      }
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

    if (hasParentChange) {
      const parent = App.MockData.agents.find((a) => a.id === App.MockData.agents[idx].parentId);
      this._logAudit(
        'agent_team',
        'ตั้งค่าทีม',
        `${App.MockData.agents[idx].code} → หัวหน้า ${parent ? parent.code : 'ไม่มี (หัวทีม)'}`
      );
    }

    return { ...App.MockData.agents[idx] };
  },

  async adjustAgentBalance(agentId, amount, note, extra = {}) {
    await this._delay();
    if (!extra.skipHydrate) this._hydrateCreditData();
    const agent = App.MockData.agents.find((a) => a.id === agentId);
    if (!agent) throw new Error('Agent not found');
    const slipDataUrl = extra.slipDataUrl || extra.slip?.dataUrl || '';
    const slipFileName = extra.slipFileName || extra.slip?.fileName || '';
    if (amount < 0 && !slipDataUrl) {
      throw new Error('กรุณาแนบหลักฐานการโอนเงิน');
    }
    const prev = agent.balance;
    agent.balance = Math.max(0, Math.round((agent.balance + amount) * 100) / 100);
    const user = App.MockData.users.find((u) => u.id === agentId);
    if (user) user.balance = agent.balance;
    const payoutNote = amount < 0 && !String(note || '').trim() ? 'โอนเงินให้นายหน้า' : note;

    this._pushCreditLedger({
      agentId,
      amount,
      balanceAfter: agent.balance,
      note: payoutNote,
      type: amount >= 0 ? 'credit' : 'debit',
      slipFileName,
      slipDataUrl
    });
    if (!extra.skipAudit) {
      this._logAudit(
        'balance_adjust',
        amount >= 0 ? 'ปรับวงเงิน' : 'โอนเงินให้นายหน้า',
        `${amount >= 0 ? 'เติม' : 'หัก'} ${agent.code} ${amount >= 0 ? '+' : ''}${amount.toLocaleString('th-TH')} บาท (ยอดก่อน ${prev.toLocaleString('th-TH')})`
      );
    }
    this._persistCreditData();

    return {
      agentId,
      balance: agent.balance,
      adjustment: amount,
      note: payoutNote || '',
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
        : undefined,
      parentId: null
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
    if (Object.prototype.hasOwnProperty.call(payload, 'parentId')) {
      this._setAgentParent(id, payload.parentId || null);
    } else {
      this._rebuildTeamMembersFromParents();
      this._persistAgentTeam();
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
    const pendingWithdrawRequests = (App.MockData.withdrawRequests || []).filter((r) => r.status === 'pending').length;
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
      pendingWithdrawRequests,
      expiringPolicies
    };
  },

  async getAdminNavBadgeCounts() {
    await this._delay();
    this._hydrateCreditData();
    const pendingPolicies = App.MockData.policies.filter((p) => p.status === 'pending').length;
    const pendingCreditRequests = App.MockData.creditRequests.filter((r) => r.status === 'pending').length;
    const pendingWithdrawRequests = (App.MockData.withdrawRequests || []).filter((r) => r.status === 'pending').length;
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
    if (App.Config?.COMMISSION_PAY_THROUGH_WALLET) pendingCommissions = 0;
    return {
      pending: pendingPolicies,
      renew: expiringPolicies,
      'credit-requests': pendingCreditRequests,
      'withdraw-requests': pendingWithdrawRequests,
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

  async createPolicy(payload) {
    await this._delay();
    this._hydrateAgentCommissionRates();
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

    let commissionResult = null;
    if (agent && App.Config?.COMMISSION_PAY_THROUGH_WALLET) {
      commissionResult = this._clearCommissionForPolicy(agent, policy, payload);
    }

    this._logAudit('policy_issue', 'ออกกรมธรรม์', `ออก ${id} ทะเบียน ${policy.plate}`);
    return {
      ...policy,
      commission: commissionResult?.commission || null,
      wht50Id: commissionResult?.commission?.wht50Id || null,
      issueForm50Tawi: !!commissionResult?.settlement?.issueForm50Tawi
    };
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
    this._hydrateAgentTeam();
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
    const immediate = !!App.Config?.COMMISSION_PAY_THROUGH_WALLET;
    if (status && !immediate) list = list.filter((c) => c.status === status);

    // If commission is cleared via wallet immediately, treat all as paid (no pending workflow).
    if (immediate) {
      list = list.map((c) => ({
        ...c,
        status: 'paid',
        paidAt: c.paidAt || c.earnedAt || new Date().toISOString().slice(0, 10)
      }));
    }

    this._hydrateWht50Documents();
    const whtById = new Map((App.MockData.wht50Documents || []).map((d) => [d.id, d]));
    list = list.map((c) => {
      const wht = c.wht50Id ? whtById.get(c.wht50Id) : null;
      return {
        ...c,
        wht50PrintedAt: wht?.printedAt || null,
        wht50DocNo: wht?.docNo || null
      };
    });

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

  async getCreditBankAccounts({ enabledOnly = false } = {}) {
    await this._delay(80);
    this._hydrateCreditBankAccounts();
    let list = (App.MockData.creditBankAccounts || []).map((a) => ({ ...a }));
    if (enabledOnly) {
      list = list.filter((b) => b.enabled !== false);
    }
    return list;
  },

  async updateCreditBankAccounts(banks) {
    await this._delay();
    if (!Array.isArray(banks)) throw new Error('ข้อมูลบัญชีธนาคารไม่ถูกต้อง');
    // Minimal sanitize to avoid breaking agent-credit rendering.
    const next = banks.map((b) => {
      const enabled = !(
        b.enabled === false
        || b.enabled === 0
        || b.enabled === '0'
        || b.enabled === 'false'
      );
      return {
        ...b,
        enabled,
        activeFrom: b.activeFrom || '00:00',
        activeTo: b.activeTo || '23:59'
      };
    });
    App.MockData.creditBankAccounts = next;
    this._persistCreditBankAccounts();
    this._logAudit?.('credit_bank_accounts_update', 'อัปเดตบัญชีธนาคาร', `${next.length} รายการ`);
    return { banks: next.map((a) => ({ ...a })) };
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

    this._hydrateCreditBankAccounts();
    const allBanks = App.MockData.creditBankAccounts || [];
    const banks = allBanks.filter((b) => b.enabled !== false);
    if (payload.bankAccountId) {
      const selected = allBanks.find((b) => b.id === payload.bankAccountId);
      if (!selected) throw new Error('ไม่พบบัญชีธนาคารที่เลือก');
      if (selected.enabled === false) {
        throw new Error('บัญชีธนาคารที่เลือกถูกปิดใช้งานแล้ว กรุณาเลือกบัญชีอื่น');
      }
    }
    const bank =
      banks.find((b) => b.id === payload.bankAccountId) ||
      banks[0] ||
      null;
    if (!bank) throw new Error('ไม่พบบัญชีธนาคารสำหรับรับโอน (หรือบัญชีถูกปิดใช้งาน)');

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

  _readPayoutBank(agentId) {
    try {
      const raw = localStorage.getItem(App.Config.AGENT_PAYOUT_BANK_KEY);
      const map = raw ? JSON.parse(raw) : {};
      return map[agentId] || null;
    } catch {
      return null;
    }
  },

  _writePayoutBank(agentId, bank) {
    try {
      const raw = localStorage.getItem(App.Config.AGENT_PAYOUT_BANK_KEY);
      const map = raw ? JSON.parse(raw) : {};
      map[agentId] = bank;
      localStorage.setItem(App.Config.AGENT_PAYOUT_BANK_KEY, JSON.stringify(map));
    } catch (e) {
      console.warn('persist payout bank failed', e);
    }
  },

  _roundMoney(n) {
    return Math.round((Number(n) || 0) * 100) / 100;
  },

  _getWithdrawBalance(agentId, { ignoreRequestId } = {}) {
    const earned = this._roundMoney(
      (App.MockData.commissions[agentId] || []).reduce((s, c) => s + (Number(c.amount) || 0), 0)
    );
    const requests = (App.MockData.withdrawRequests || []).filter((r) => (
      r.agentId === agentId && r.id !== ignoreRequestId
    ));
    const sumBy = (status) => this._roundMoney(
      requests.filter((r) => r.status === status).reduce((s, r) => s + (Number(r.amount) || 0), 0)
    );
    const pending = sumBy('pending');
    const paid = sumBy('paid');
    const available = this._roundMoney(Math.max(0, earned - pending - paid));
    return { earned, pending, paid, available };
  },

  async getWithdrawBalance(agentId) {
    await this._delay(40);
    this._hydrateCreditData();
    return this._getWithdrawBalance(agentId);
  },

  async getPayoutBank(agentId) {
    await this._delay(40);
    return this._readPayoutBank(agentId);
  },

  async getWithdrawRequests(agentId, { status } = {}) {
    await this._delay();
    this._hydrateCreditData();
    let list = (App.MockData.withdrawRequests || []).filter((r) => r.agentId === agentId);
    if (status) list = list.filter((r) => r.status === status);
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async createWithdrawRequest(agentId, payload = {}) {
    await this._delay();
    this._hydrateCreditData();
    if (!Array.isArray(App.MockData.withdrawRequests)) App.MockData.withdrawRequests = [];
    const agent = App.MockData.agents.find((a) => a.id === agentId);
    if (!agent) throw new Error('ไม่พบนายหน้า');
    const num = this._roundMoney(payload.amount);
    if (!num || num < 100) throw new Error('กรุณาระบุจำนวนเงินขั้นต่ำ 100 บาท');
    const bankCode = String(payload.bankCode || '').trim();
    const accountNo = String(payload.accountNo || '').replace(/\s+/g, '');
    const accountName = String(payload.accountName || '').trim();
    if (!bankCode) throw new Error('กรุณาเลือกธนาคาร');
    if (!accountNo) throw new Error('กรุณากรอกเลขบัญชี');
    if (!accountName) throw new Error('กรุณากรอกชื่อบัญชี');
    const pending = App.MockData.withdrawRequests.some(
      (r) => r.agentId === agentId && r.status === 'pending'
    );
    if (pending) throw new Error('มีคำขอถอนเงินที่รอโอนอยู่แล้ว กรุณารอแอดมินดำเนินการก่อน');
    const balance = this._getWithdrawBalance(agentId);
    if (balance.available < 100) {
      throw new Error('ยอดค่าคอมที่ถอนได้ไม่ถึงขั้นต่ำ 100 บาท');
    }
    if (num > balance.available) {
      throw new Error(`ถอนได้ไม่เกิน ${balance.available.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท (ยอดค่าคอมคงเหลือ)`);
    }

    const bank = App.ThaiBanks?.findByCode(bankCode);
    const entry = {
      id: `WD-${String(App.MockData.withdrawRequests.length + 1).padStart(3, '0')}`,
      agentId,
      agentCode: agent.code,
      agentName: agent.name,
      amount: Math.round(num * 100) / 100,
      bankCode: bank?.code || bankCode,
      bankName: bank?.name || bankCode,
      accountNo,
      accountName,
      note: String(payload.note || '').trim(),
      status: 'pending',
      slipFileName: null,
      slipDataUrl: null,
      createdAt: new Date().toISOString(),
      reviewedAt: null,
      reviewedByName: null
    };
    App.MockData.withdrawRequests.unshift(entry);
    this._writePayoutBank(agentId, {
      bankCode: entry.bankCode,
      accountNo: entry.accountNo,
      accountName: entry.accountName
    });
    this._persistCreditData();
    this._logAudit('withdraw_request', 'แจ้งถอนเงิน', `${agent.code} ขอถอน ${entry.amount.toLocaleString('th-TH')} บาท`);
    return { ...entry };
  },

  async getAllWithdrawRequests({ status } = {}) {
    await this._delay();
    this._hydrateCreditData();
    let list = [...(App.MockData.withdrawRequests || [])];
    if (status) list = list.filter((r) => r.status === status);
    return list
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((r) => {
        const balance = this._getWithdrawBalance(r.agentId, {
          ignoreRequestId: r.status === 'pending' ? r.id : null
        });
        return {
          ...r,
          commissionEarned: balance.earned,
          commissionAvailable: balance.available
        };
      });
  },

  async reviewWithdrawRequest(requestId, action, extra = {}) {
    await this._delay();
    this._hydrateCreditData();
    const req = (App.MockData.withdrawRequests || []).find((r) => r.id === requestId);
    if (!req) throw new Error('ไม่พบคำขอถอนเงิน');
    if (req.status !== 'pending') throw new Error('คำขอนี้ดำเนินการแล้ว');
    const actor = this._actor();
    if (action === 'pay') {
      const slipDataUrl = extra.slipDataUrl || extra.slip?.dataUrl || '';
      if (!slipDataUrl) throw new Error('กรุณาแนบหลักฐานการโอนเงิน');
      const balance = this._getWithdrawBalance(req.agentId, { ignoreRequestId: req.id });
      if (req.amount > balance.available) {
        throw new Error(`ยอดนี้เกินค่าคอมที่ถอนได้ (${balance.available.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท)`);
      }
      req.status = 'paid';
      req.slipFileName = extra.slipFileName || extra.slip?.fileName || 'slip.jpg';
      req.slipDataUrl = slipDataUrl;
      req.hasSlip = true;
    } else if (action === 'reject') {
      req.status = 'rejected';
    } else {
      throw new Error('การดำเนินการไม่ถูกต้อง');
    }
    req.reviewedAt = new Date().toISOString();
    req.reviewedByName = actor.name;
    this._persistCreditData();
    this._logAudit(
      'withdraw_review',
      action === 'pay' ? 'โอนเงินให้นายหน้า' : 'ปฏิเสธถอนเงิน',
      `${req.agentCode} ${req.amount.toLocaleString('th-TH')} บาท`
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
    const immediate = !!App.Config?.COMMISSION_PAY_THROUGH_WALLET;
    if (status && !immediate) list = list.filter((c) => c.status === status);

    if (immediate) {
      list = list.map((c) => ({
        ...c,
        status: 'paid',
        paidAt: c.paidAt || c.earnedAt || new Date().toISOString().slice(0, 10)
      }));
    }

    this._hydrateWht50Documents();
    const whtById = new Map((App.MockData.wht50Documents || []).map((d) => [d.id, d]));
    list = list.map((c) => {
      const wht = c.wht50Id ? whtById.get(c.wht50Id) : null;
      return {
        ...c,
        wht50PrintedAt: wht?.printedAt || null,
        wht50DocNo: wht?.docNo || null
      };
    });

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
          const commission = App.MockData.commissions[aid][idx];
          // When clearing commission with tax withhold OFF → auto issue Form 50 ทวิ
          if (commission.issueForm50Tawi && !commission.wht50Id) {
            const agent = App.MockData.agents.find((a) => a.id === aid);
            if (agent && App.AgentCommissionRates) {
              this._hydrateAgentCommissionRates();
              const sourceAgent = commission.sourceAgentId
                ? App.MockData.agents.find((a) => a.id === commission.sourceAgentId)
                : null;
              const rates = (commission.kind === 'team-override' && sourceAgent)
                ? App.AgentCommissionRates.overrideAsRates(sourceAgent.commissionRates)
                : App.AgentCommissionRates.normalize(agent.commissionRates);
              const settlement = App.AgentCommissionRates.calcSettlement({
                netPremium: commission.netPremium ?? commission.premium,
                grossPremium: commission.premium,
                rates,
                productKey: commission.productKey
              });
              const wht = this._createWht50Document({
                agent,
                commission,
                policy: { id: commission.policyNo, plate: commission.plate },
                settlement
              });
              commission.wht50Id = wht.id;
            }
          }
        }
        this._logAudit('commission_update', 'อัปเดตค่าคอม', `${commissionId} → ${status}`);
        return { ...App.MockData.commissions[aid][idx] };
      }
    }
    throw new Error('ไม่พบรายการค่าคอม');
  },

  async getWht50Documents({ agentId, commissionId } = {}) {
    await this._delay(80);
    this._hydrateWht50Documents();
    let list = [...(App.MockData.wht50Documents || [])];
    if (agentId) list = list.filter((d) => d.agentId === agentId);
    if (commissionId) list = list.filter((d) => d.commissionId === commissionId);
    return list.sort((a, b) => String(b.issuedAt || '').localeCompare(String(a.issuedAt || '')));
  },

  async getWht50Document(id) {
    await this._delay(80);
    this._hydrateWht50Documents();
    const doc = (App.MockData.wht50Documents || []).find((d) => d.id === id);
    if (!doc) throw new Error('ไม่พบหนังสือ 50 ทวิ');
    return { ...doc };
  },

  async markWht50Printed(id) {
    await this._delay(40);
    this._hydrateWht50Documents();
    const doc = (App.MockData.wht50Documents || []).find((d) => d.id === id);
    if (!doc) throw new Error('ไม่พบหนังสือ 50 ทวิ');
    if (!doc.printedAt) {
      doc.printedAt = new Date().toISOString();
      this._persistWht50Documents();
      this._logAudit('wht50_print', 'พิมพ์หนังสือ 50 ทวิ', `${doc.docNo || doc.id}`);
    }
    return { ...doc };
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
    this._hydrateAgentTeam();
    const policies = App.MockData.policies || [];
    const agents = App.MockData.agents || [];

    const salesByAgentId = {};
    policies.forEach((p) => {
      if (!p.agentId) return;
      if (!salesByAgentId[p.agentId]) {
        salesByAgentId[p.agentId] = { policies: 0, premium: 0 };
      }
      salesByAgentId[p.agentId].policies += 1;
      salesByAgentId[p.agentId].premium += Number(p.premium) || 0;
    });

    const childrenByParent = {};
    agents.forEach((a) => {
      if (!a.parentId) return;
      if (!childrenByParent[a.parentId]) childrenByParent[a.parentId] = [];
      childrenByParent[a.parentId].push(a);
    });

    const leaderIds = [...new Set([
      ...agents.filter((a) => !a.parentId).map((a) => a.id),
      ...Object.keys(childrenByParent)
    ])];

    return leaderIds.map((leaderId) => {
      const leader = agents.find((a) => a.id === leaderId);
      const members = (childrenByParent[leaderId] || []).map((m) => {
        const live = salesByAgentId[m.id];
        return {
          id: m.id,
          code: m.code,
          name: m.name,
          phone: m.phone || '-',
          status: m.status,
          email: m.email || '-',
          policies: live ? live.policies : 0,
          premium: live ? Math.round(live.premium * 100) / 100 : 0
        };
      });

      const leaderSales = salesByAgentId[leaderId] || { policies: 0, premium: 0 };
      const memberPolicies = members.reduce((s, m) => s + (Number(m.policies) || 0), 0);
      const memberPremium = members.reduce((s, m) => s + (Number(m.premium) || 0), 0);
      const totalPolicies = memberPolicies + (leaderSales.policies || 0);
      const totalPremium = Math.round((memberPremium + (leaderSales.premium || 0)) * 100) / 100;

      return {
        leaderId,
        leaderCode: leader?.code || '',
        leaderName: leader?.name || '',
        leaderPhone: leader?.phone || '',
        leaderStatus: leader?.status || 'active',
        leaderPolicies: leaderSales.policies || 0,
        leaderPremium: Math.round((leaderSales.premium || 0) * 100) / 100,
        memberCount: members.length,
        totalMembers: members.length + 1,
        memberPolicies,
        memberPremium: Math.round(memberPremium * 100) / 100,
        totalPolicies,
        totalPremium,
        members
      };
    }).sort((a, b) => b.totalPremium - a.totalPremium);
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
App.MockAPI._hydrateAgentTeam();
App.MockAPI._hydrateReceiptPaperSettings();
App.MockAPI._hydrateWht50Settings();
App.MockAPI._hydrateCreditData();
