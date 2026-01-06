"use client";

const styles: Record<string, string> = {
  pending: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  processing:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 animate-pulse",
  completed:
    "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
  failed: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  // Connector statuses
  connected:
    "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
  disconnected:
    "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  syncing:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 animate-pulse",
  error: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
};

interface Props {
  status: string;
}

export default function StatusBadge({ status }: Props) {
  const cls = styles[status] ?? styles.pending;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${cls}`}
    >
      {status}
    </span>
  );
}
