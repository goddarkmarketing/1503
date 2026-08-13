window.App = window.App || {};

App.AdminUserService = {
  _useReal() {
    return !!App.Config.USE_REAL_ADMIN_USERS || !App.Config.USE_MOCK_API;
  },

  async list() {
    if (this._useReal()) {
      return App.API.request('/admin/users');
    }
    return App.MockAPI.getAdminUsers();
  },

  async create(payload) {
    if (this._useReal()) {
      return App.API.request('/admin/users', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    }
    throw new Error('Mock ยังไม่รองรับการสร้างผู้ดูแล — เปิด USE_REAL_ADMIN_USERS');
  },

  async update(userId, payload) {
    if (this._useReal()) {
      return App.API.request(`/admin/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
    }
    throw new Error('Mock ยังไม่รองรับการแก้ไขผู้ดูแล — เปิด USE_REAL_ADMIN_USERS');
  },

  async remove(userId) {
    if (this._useReal()) {
      return App.API.request(`/admin/users/${userId}`, { method: 'DELETE' });
    }
    throw new Error('Mock ยังไม่รองรับการลบผู้ดูแล — เปิด USE_REAL_ADMIN_USERS');
  },

  async changeOwnPassword(currentPassword, newPassword) {
    if (this._useReal() || App.Config.USE_REAL_AUTH) {
      return App.API.request('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword })
      });
    }
    throw new Error('ต้องเปิด USE_REAL_AUTH เพื่อเปลี่ยนรหัสผ่าน');
  }
};
