export function calculateLeadScore(
  sessions: number,
  totalDurationMs: number,
  completionRate: number
): number {
  const sessionScore = Math.min(40, sessions * 5);
  const durationScore = Math.min(30, Math.floor(totalDurationMs / 1000));
  const completionScore = Math.min(30, Math.floor(completionRate * 30));
  return Math.min(100, sessionScore + durationScore + completionScore);
}
