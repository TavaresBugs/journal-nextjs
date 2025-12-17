export function getStrategyIcon(strategy: string): string {
  const icons: Record<string, string> = {
    mmbm: '🧪',
    amd: '🧪',
    breaker: '🧪',
    silver_bullet: '🧪',
  };
  return icons[strategy?.toLowerCase()] || '🧪';
}

export function getStrategyLabel(strategy: string): string {
  if (!strategy) return '';
  const labels: Record<string, string> = {
    mmbm: 'MMBM',
    amd: 'AMD',
    breaker: 'Breaker',
    silver_bullet: 'Silver Bullet',
  };
  return labels[strategy.toLowerCase()] || strategy.toUpperCase();
}

export function getPDArrayIcon(pdArray: string): string {
  const icons: Record<string, string> = {
    fvg: '👑',
    ob: '📦',
    breaker: '💥',
    bb: '💥',
    mb: '🛡️',
    mitigation: '🛡️',
    pxh: '🔺',
    pxl: '🔻',
    pdh: '⬆️',
    pdl: '⬇️',
  };
  return icons[pdArray?.toLowerCase()] || '👑';
}

export function getPDArrayLabel(pdArray: string): string {
  if (!pdArray) return '';
  const labels: Record<string, string> = {
    fvg: 'FVG',
    ob: 'OB',
    breaker: 'Breaker',
    mitigation: 'Mitigation Block',
  };
  return labels[pdArray.toLowerCase()] || pdArray.toUpperCase();
}
