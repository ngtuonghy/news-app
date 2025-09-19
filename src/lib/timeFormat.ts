import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import relativeTime from "dayjs/plugin/relativeTime.js";
import "dayjs/locale/vi";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);

export function timeFormat(
  date: string | Date,
  tz: string = Intl.DateTimeFormat().resolvedOptions().timeZone,
  locale: string = "vi",
): string {
  dayjs.locale(locale);

  const time = dayjs.utc(date).tz(tz);
  const now = dayjs().tz(tz);

  const diffMinutes = now.diff(time, "minute");
  const diffDays = now.diff(time, "day");

  if (diffMinutes < 1) {
    return "vừa xong";
  }

  if (diffDays < 2) {
    return time.fromNow(); // "5 giờ trước"
  }

  if (diffDays < 7) {
    return time.format("dddd, HH:mm"); // "Thứ Ba, 14:30"
  }

  return time.format("DD/MM/YYYY HH:mm");
}


