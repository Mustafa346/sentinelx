/**
 * Checks whether a triggered detection should be suppressed because of a
 * configured false-positive exclusion on the rule. Pure function - no DB
 * or other side effects - so it can be unit tested directly.
 */
export function isExcluded(rule, { sourceIP, username, timestamp }) {
  if (!rule.exclusions || rule.exclusions.length === 0) return false;

  const hour = new Date(timestamp).getHours();

  return rule.exclusions.some((ex) => {
    if (ex.sourceIP && ex.sourceIP !== sourceIP) return false;
    if (ex.username && ex.username !== username) return false;
    if (ex.startHour != null && ex.endHour != null) {
      // supports overnight windows like 00:00-03:00
      if (ex.startHour <= ex.endHour) {
        if (hour < ex.startHour || hour >= ex.endHour) return false;
      } else {
        if (hour < ex.startHour && hour >= ex.endHour) return false;
      }
    }
    return true;
  });
}
