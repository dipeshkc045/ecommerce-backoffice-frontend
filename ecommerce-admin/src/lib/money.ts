/** NPR from paisa with Nepali grouping: 12345678 → "Rs 1,23,456.78". Money is always integer paisa (ADR-0008). */
export function npr(minor: number | null | undefined): string {
  if (minor === null || minor === undefined) return "—"
  const negative = minor < 0
  const abs = Math.abs(minor)
  const rupees = Math.floor(abs / 100).toString()
  const paisa = abs % 100
  const last3 = rupees.slice(-3)
  const head = rupees.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",")
  const grouped = head ? `${head},${last3}` : last3
  return `${negative ? "-" : ""}Rs ${grouped}${paisa ? "." + paisa.toString().padStart(2, "0") : ""}`
}

/** "2500" or "2,500.50" typed by staff → paisa. Returns null when it is not a valid amount. */
export function parseRupees(text: string): number | null {
  const cleaned = text.replace(/[,\s]/g, "").replace(/^Rs\.?/i, "")
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null
  const [whole, fraction = ""] = cleaned.split(".")
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"))
}

export const dateTime = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "—"
