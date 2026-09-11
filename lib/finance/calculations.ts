export type TransactionAmount = { type: "INCOME" | "EXPENSE"; amount: number };

export function signedAmount(transaction: TransactionAmount) {
  return transaction.type === "INCOME" ? transaction.amount : -transaction.amount;
}

export function calculateBalance(openingBalance: number, transactions: TransactionAmount[]) {
  return transactions.reduce((balance, transaction) => balance + signedAmount(transaction), openingBalance);
}

export function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function jakartaToday(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function monthRange(period?: string) {
  const current = jakartaToday().slice(0, 7);
  const normalized = /^\d{4}-(0[1-9]|1[0-2])$/.test(period ?? "") ? period! : current;
  const [year, month] = normalized.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return {
    period: normalized,
    start: `${normalized}-01`,
    end: `${normalized}-${String(lastDay).padStart(2, "0")}`,
  };
}

export function previousMonth(period: string) {
  const [year, month] = period.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 2, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}
