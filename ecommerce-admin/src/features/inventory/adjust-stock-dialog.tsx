import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { useAdjustStock } from "./api"
import type { InventoryItem } from "./types"

const adjustSchema = z.object({
  delta: z
    .string()
    .min(1, "Enter a quantity")
    .refine((v) => !Number.isNaN(Number(v)) && Number(v) !== 0, {
      message: "Enter a non-zero number",
    }),
  reason: z.string().min(3, "Give a short reason (min 3 characters)"),
})

type AdjustFormValues = z.infer<typeof adjustSchema>

interface AdjustStockDialogProps {
  item: InventoryItem | null
  onOpenChange: (open: boolean) => void
}

/**
 * Reference pattern for form dialogs in this app:
 * React Hook Form (uncontrolled inputs, minimal re-renders) + Zod schema
 * (shared validation shape, easy to reuse server-side later) + a TanStack
 * mutation that invalidates the relevant query on success.
 */
export function AdjustStockDialog({ item, onOpenChange }: AdjustStockDialogProps) {
  const adjustStock = useAdjustStock()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AdjustFormValues>({
    resolver: zodResolver(adjustSchema),
    defaultValues: { delta: "", reason: "" },
  })

  React.useEffect(() => {
    if (item) reset({ delta: "", reason: "" })
  }, [item, reset])

  const onSubmit = async (values: AdjustFormValues) => {
    if (!item) return
    try {
      await adjustStock.mutateAsync({ id: item.id, delta: Number(values.delta) })
      toast.success(`${item.name} stock updated`)
      onOpenChange(false)
    } catch {
      toast.error("Couldn't update stock. Try again.")
    }
  }

  return (
    <Dialog open={!!item} onOpenChange={onOpenChange}>
      {item && (
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust stock</DialogTitle>
            <DialogDescription>
              {item.name} · {item.sku} · currently {item.quantity} in stock
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="delta">Change in quantity</Label>
              <Input
                id="delta"
                placeholder="e.g. 20 or -5"
                {...register("delta")}
              />
              {errors.delta && (
                <p className="text-xs text-[var(--color-danger)]">{errors.delta.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="reason">Reason</Label>
              <Input
                id="reason"
                placeholder="e.g. Received shipment #4021"
                {...register("reason")}
              />
              {errors.reason && (
                <p className="text-xs text-[var(--color-danger)]">{errors.reason.message}</p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      )}
    </Dialog>
  )
}
