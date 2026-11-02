import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";
import { differenceInMinutes, getISOWeek, parse } from "date-fns";
import { TIMEZONE } from "./constants";

export function nowInMadrid(): Date {
  return toZonedTime(new Date(), TIMEZONE);
}

export function formatTime(date: Date): string {
  return formatInTimeZone(date, TIMEZONE, "HH:mm");
}

export function formatDate(date: Date): string {
  return formatInTimeZone(date, TIMEZONE, "yyyy-MM-dd");
}

export function formatDay(date: Date): string {
  return formatInTimeZone(date, TIMEZONE, "EEEE");
}

export function formatMonth(date: Date): string {
  return formatInTimeZone(date, TIMEZONE, "MMMM yyyy");
}

export function getWeekNumber(date: Date): number {
  const zoned = toZonedTime(date, TIMEZONE);
  return getISOWeek(zoned);
}

export function getMonthKey(date: Date): string {
  return formatInTimeZone(date, TIMEZONE, "yyyy-MM");
}

export function calculateHours(clockIn: string, clockOut: string): number {
  const today = formatDate(new Date());
  const inDate = parse(`${today} ${clockIn}`, "yyyy-MM-dd HH:mm", new Date());
  const outDate = parse(`${today} ${clockOut}`, "yyyy-MM-dd HH:mm", new Date());
  const mins = differenceInMinutes(outDate, inDate);
  return Math.round((mins / 60) * 100) / 100;
}

export function getCurrentTimestamp(): {
  date: string;
  day: string;
  time: string;
} {
  const now = new Date();
  return {
    date: formatDate(now),
    day: formatDay(now),
    time: formatTime(now),
  };
}

// Convert a sheet date ("yyyy-MM-dd") and time ("HH:mm") in Madrid time to a Date
export function toInstant(date: string, time: string): Date {
  return fromZonedTime(`${date}T${time}:00`, TIMEZONE);
}
