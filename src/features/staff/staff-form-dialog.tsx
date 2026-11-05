"use client";

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ROLE_DESCRIPTIONS, ROLE_LABELS } from '@/lib/business-labels'
import type { Staff } from '@/types/business'

const staffSchema = z.object({
  name: z.string().trim().min(1, 'Nama staf wajib diisi'),
  email: z
    .string()
    .trim()
    .min(1, 'Email wajib diisi')
    .refine(
      (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      'Format email tidak valid',
    ),
  role: z.enum(['owner', 'admin', 'manager', 'cashier']),
  status: z.enum(['active', 'inactive']),
})

export type StaffFormValues = z.infer<typeof staffSchema>

const ROLE_OPTIONS = (
  Object.keys(ROLE_LABELS) as Array<keyof typeof ROLE_LABELS>
).map((role) => ({ value: role, label: ROLE_LABELS[role] }))

export function StaffFormDialog({
  open,
  onOpenChange,
  member,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  member?: Staff | null
  onSubmit: (values: StaffFormValues) => boolean
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {member ? 'Edit staf' : 'Tambah staf'}
          </DialogTitle>
          <DialogDescription>
            Atur akses anggota tim. Perubahan langsung tercatat di daftar staf.
          </DialogDescription>
        </DialogHeader>

        <StaffFormBody
          key={member?.id ?? 'new'}
          member={member}
          onCancel={() => onOpenChange(false)}
          onSubmit={(values) => {
            if (onSubmit(values)) onOpenChange(false)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}

function StaffFormBody({
  member,
  onCancel,
  onSubmit,
}: {
  member?: Staff | null
  onCancel: () => void
  onSubmit: (values: StaffFormValues) => void
}) {
  const form = useForm<StaffFormValues>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      name: member?.name ?? '',
      email: member?.email ?? '',
      role: member?.role ?? 'cashier',
      status: member?.status ?? 'active',
    },
  })

  const role = form.watch('role')

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama lengkap</FormLabel>
              <FormControl>
                <Input placeholder="Contoh: Sarah Vance" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="nama@warjok.id" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Peran</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ROLE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="inactive">Nonaktif</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <p className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
          {ROLE_DESCRIPTIONS[role]}
        </p>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Batal
          </Button>
          <Button type="submit">
            {member ? 'Simpan perubahan' : 'Tambah staf'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  )
}
