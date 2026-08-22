import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { AttentionLevel } from "../types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatDate(dateString: string, locale = 'en-IN'): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
}

export function getSeverityStyles(severity: AttentionLevel) {
  switch (severity) {
    case 'VERIFIED':
      return {
        bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        badge: 'bg-emerald-600 text-white',
        dot: 'bg-emerald-500',
        border: 'border-l-emerald-500',
        cardBorder: 'border-emerald-200/80',
        iconColor: 'text-emerald-600',
        labelKey: 'severityVerified',
      };
    case 'STANDARD':
      return {
        bg: 'bg-blue-50 text-blue-800 border-blue-200',
        badge: 'bg-blue-600 text-white',
        dot: 'bg-blue-500',
        border: 'border-l-blue-500',
        cardBorder: 'border-blue-200/80',
        iconColor: 'text-blue-600',
        labelKey: 'severityStandard',
      };
    case 'REVIEW':
      return {
        bg: 'bg-amber-50 text-amber-900 border-amber-200',
        badge: 'bg-amber-500 text-white',
        dot: 'bg-amber-500',
        border: 'border-l-amber-500',
        cardBorder: 'border-amber-200/80',
        iconColor: 'text-amber-600',
        labelKey: 'severityReview',
      };
    case 'HIGH ATTENTION':
      return {
        bg: 'bg-rose-50 text-rose-900 border-rose-200',
        badge: 'bg-rose-600 text-white',
        dot: 'bg-rose-500',
        border: 'border-l-rose-500',
        cardBorder: 'border-rose-200/80',
        iconColor: 'text-rose-600',
        labelKey: 'severityHighAttention',
      };
  }
}
