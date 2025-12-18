/**
 * Calcula a sessão de trading baseada no horário de New York.
 * @param timeStr Horário no formato HH:mm:ss
 * @returns Nome da sessão (Asian, London, Overlap, New-York)
 */
export const calculateSession = (timeStr: string): string => {
  if (!timeStr) return "N/A";

  // Parse hours/minutes
  const [hoursStr, minutesStr] = timeStr.split(":");
  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);

  if (isNaN(hours)) return "N/A";

  const timeValue = hours + minutes / 60;

  // Asian: 17:00 - 03:00 (Requires checking wrap around)
  // London: 03:00 - 08:00
  // Overlap: 08:00 - 12:00
  // NY: 12:00 - 17:00

  if (timeValue >= 17 || timeValue < 3) {
    return "Asian";
  } else if (timeValue >= 3 && timeValue < 8) {
    return "London";
  } else if (timeValue >= 8 && timeValue < 12) {
    return "Overlap";
  } else if (timeValue >= 12 && timeValue < 17) {
    return "New-York";
  }

  return "Asian"; // Fallback
};
