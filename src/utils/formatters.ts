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

export interface StockStatusResult {
  status: 'depleted' | 'low' | 'ok';
  label: string;
  color: string;
  badgeClass: string;
}

export function getStockStatus(current: number, minimum: number): StockStatusResult {
  if (current <= 0) {
    return { status: 'depleted', label: 'Out of Stock (0)', color: '#dc2626', badgeClass: 'badge-red' };
  }
  if (current <= minimum) {
    return { status: 'low', label: 'Low Stock (' + current + ')', color: '#d97706', badgeClass: 'badge-yellow' };
  }
  return { status: 'ok', label: 'In Stock (' + current + ')', color: '#16a34a', badgeClass: 'badge-green' };
}
