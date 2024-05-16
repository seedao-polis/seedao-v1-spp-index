// current UTC+0 timestamp, unit is seconds
export function currentUTC0Timestamp(): number {
  // UTC+0 timestamp
  const now = new Date();
  return (
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      now.getUTCHours(),
      now.getUTCMinutes(),
      now.getUTCSeconds(),
    ) / 1000
  ); // div 1000 to convert from milliseconds to seconds
}
