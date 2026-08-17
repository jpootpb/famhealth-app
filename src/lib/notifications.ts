// Web Notifications API - Source: https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('Este navegador no soporta notificaciones de escritorio.');
    return false;
  }
  if (Notification.permission === 'granted') {
    return true;
  }
  if (Notification.permission !== 'denied') {
    const perm = await Notification.requestPermission();
    return perm === 'granted';
  }
  return false;
}

export function sendLocalNotification(title: string, body: string, icon: string = '/favicon.svg'): void {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon,
        badge: '/favicon.svg'
      });
    } catch (e) {
      console.error('Error creating Notification', e);
    }
  }
}