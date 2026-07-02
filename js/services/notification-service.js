window.App = window.App || {};

App.NotificationService = {
  async getNotifications() {
    const user = App.Session.getUser();
    if (!user) return [];
    if (user.role === 'admin' && App.AdminNotificationService) {
      return App.AdminNotificationService.getList(user.id);
    }
    if (App.Config.USE_MOCK_API) return App.MockAPI.getNotifications(user.id);
    return App.API.request('/notifications');
  },

  async markRead(notifId) {
    const user = App.Session.getUser();
    if (!user) return null;
    if (user.role === 'admin' && App.AdminNotificationService) {
      return App.AdminNotificationService.markRead(user.id, notifId);
    }
    if (App.Config.USE_MOCK_API) return App.MockAPI.markNotificationRead(user.id, notifId);
    return App.API.request(`/notifications/${notifId}/read`, { method: 'POST' });
  },

  async getUnreadCount() {
    const user = App.Session.getUser();
    if (!user) return 0;
    if (user.role === 'admin' && App.AdminNotificationService) {
      return App.AdminNotificationService.getUnreadCount(user.id);
    }
    const list = await this.getNotifications();
    return list.filter((n) => !n.read).length;
  }
};
