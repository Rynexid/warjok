"use client"

import { useState } from "react"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { MailIcon, Loader2Icon } from "lucide-react"
import { z } from "zod"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { authClient } from "@/lib/auth-client"
import { cn } from "@/lib/utils"

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email wajib diisi")
    .refine(
      (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      "Format email tidak valid",
    ),
})

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [formError, setFormError] = useState("")
  const [formSuccess, setFormSuccess] = useState("")

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  })

  const onSubmit = async (values: ForgotPasswordValues) => {
    setFormError("")
    setFormSuccess("")

    try {
      const result = await authClient.requestPasswordReset({
        email: values.email,
      })

      if (result?.error) {
        setFormError(result.error.message || "Gagal mengirim email reset.")
        return
      }

      setFormSuccess(
        "Jika email terdaftar, Anda akan menerima link reset kata sandi.",
      )
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Gagal mengirim email reset. Silakan coba lagi.",
      )
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn("flex flex-col gap-6", className)}
      noValidate
      {...props}
    >
      <div className="space-y-1.5 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Lupa kata sandi
        </h1>
        <p className="text-sm text-balance text-muted-foreground">
          Masukkan email akun Anda, kami akan kirimkan link untuk mengatur
          ulang kata sandi.
        </p>
      </div>

      {formError && (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      {formSuccess && (
        <Alert>
          <AlertDescription>{formSuccess}</AlertDescription>
        </Alert>
      )}

      <FieldGroup className="gap-5">
        <Field data-invalid={!!errors.email}>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="nama@warjok.id"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
          <FieldError errors={[errors.email]} />
        </Field>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2Icon className="animate-spin" />
          ) : (
            <MailIcon />
          )}
          {isSubmitting ? "Mengirim..." : "Kirim link reset"}
        </Button>
      </FieldGroup>

      <p className="text-center text-sm text-muted-foreground">
        Sudah ingat kata sandi?{" "}
        <Link
          href="/login"
          className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
        >
          Masuk
        </Link>
      </p>
    </form>
  )
}
