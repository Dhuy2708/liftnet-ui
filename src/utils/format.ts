export const formatCurrency = (amount: number, currency: 'LIFT' | 'VND' = 'LIFT'): string => {
  if (currency === 'LIFT') {
    return `${amount.toLocaleString('en-US')} LiftCoin`;
  }
  
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
}; 