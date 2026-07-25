import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

const STATS = [
  { label: "Revenue (30d)", value: "$48,210" },
  { label: "Orders (30d)", value: "1,204" },
  { label: "Avg. order value", value: "$40.05" },
  { label: "Open tickets", value: "6" },
]

export function DashboardPage() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-lg font-semibold text-[var(--color-ink)]">Dashboard</h1>
        <p className="text-sm text-[var(--color-ink-muted)]">Overview of store performance.</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {STATS.map((stat) => (
          <Card key={stat.label}>
            <CardHeader>
              <CardDescription>{stat.label}</CardDescription>
              <CardTitle className="text-2xl font-semibold">{stat.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Next steps</CardTitle>
          <CardDescription>This is a placeholder — wire in real charts (Recharts is installed) once the analytics endpoint exists.</CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    </div>
  )
}
