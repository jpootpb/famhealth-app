export function formatDose(dose: number, presentation: string = 'tablet'): string {
  if (dose === 0.5) return '1/2 ' + presentation;
  if (dose === 0.25) return '1/4 ' + presentation;
  if (dose === 0.75) return '3/4 ' + presentation;
  if (dose === 1) return '1 ' + presentation;
  return dose + ' ' + presentation + (dose > 1 ? 's' : '');
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(amount);
}

export function getStockStatus(current: number, minimum: number): { label: string; color: string; badgeClass: string } {
  if (current <= 0) {
    return { label: 'Out of Stock (0)', color: '#dc2626', badgeClass: 'badge-red' };
  }
  if (current <= minimum) {
    return { label: 'Low Stock (' + current + ')', color: '#d97706', badgeClass: 'badge-yellow' };
  }
  return { label: 'In Stock (' + current + ')', color: '#16a34a', badgeClass: 'badge-green' };
}
