export function formatDosis(dosis: number, presentacion: string = 'tableta'): string {
  if (dosis === 0.5) return '1/2 ' + presentacion;
  if (dosis === 0.25) return '1/4 ' + presentacion;
  if (dosis === 0.75) return '3/4 ' + presentacion;
  if (dosis === 1) return '1 ' + presentacion;
  return dosis + ' ' + presentacion + (dosis > 1 ? 's' : '');
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(amount);
}

export function getStockStatus(actual: number, minimo: number): { label: string; color: string; badgeClass: string } {
  if (actual <= 0) {
    return { label: 'Agotado (0)', color: '#dc2626', badgeClass: 'badge-red' };
  }
  if (actual <= minimo) {
    return { label: 'Bajo stock (' + actual + ')', color: '#d97706', badgeClass: 'badge-yellow' };
  }
  return { label: 'Disponible (' + actual + ')', color: '#16a34a', badgeClass: 'badge-green' };
}