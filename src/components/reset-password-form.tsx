"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Loader2Icon, MailIcon } from "lucide-react"
import { z } from "zod"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { authClient } from "@/lib/auth-client"
import { cn } from "@/lib/utils"

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Kata sandi minimal 8 karakter"),
    confirmPassword: z.string().min(1, "Konfirmasi kata sandi wajib diisi"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Konfirmasi kata sandi tidak cocok",
    path: ["confirmPassword"],
  })

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>

export function ResetPasswordForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const [formError, setFormError] = useState("")
  const [formSuccess, setFormSuccess] = useState("")
  const isValidToken = Boolean(token)

  if (!isValidToken) {
    setFormError("Link reset tidak valid atau sudah kedaluwarsa.")
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  })

  const onSubmit = async (values: ResetPasswordValues) => {
    setFormError("")
    setFormSuccess("")

    if (!token || !isValidToken) {
      setFormError("Link reset tidak valid atau sudah kedaluwarsa.")
      return
    }

    try {
      const result = await authClient.resetPassword({
        newPassword: values.password,
        token,
      })

      if (result?.error) {
        setFormError(result.error.message || "Gagal mengatur ulang kata sandi.")
        return
      }

      setFormSuccess(
        "Kata sandi berhasil diubah. Anda dapat masuk sekarang.",
      )
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Gagal mengatur ulang kata sandi. Silakan coba lagi.",
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
        {isValidToken ? (
          <>
            <h1 className="text-2xl font-semibold tracking-tight">
              Atur ulang kata sandi
            </h1>
            <p className="text-sm text-balance text-muted-foreground">
              Masukkan kata sandi baru untuk akun Anda.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold tracking-tight">
              Link reset tidak valid
            </h1>
            <p className="text-sm text-balance text-muted-foreground">
              Link reset kata sandi tidak valid atau sudah kedaluwarsa.
            </p>
          </>
        )}
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

      {isValidToken && (
        <FieldGroup className="gap-5">
          <Field data-invalid={!!errors.password}>
            <FieldLabel htmlFor="password">Kata sandi baru</FieldLabel>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              aria-invalid={!!errors.password}
              {...register("password")}
            />
            <FieldDescription>Minimal 8 karakter.</FieldDescription>
            <FieldError errors={[errors.password]} />
          </Field>
          <Field data-invalid={!!errors.confirmPassword}>
            <FieldLabel htmlFor="confirmPassword">
              Konfirmasi kata sandi baru
            </FieldLabel>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              aria-invalid={!!errors.confirmPassword}
              {...register("confirmPassword")}
            />
            <FieldError errors={[errors.confirmPassword]} />
          </Field>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2Icon className="animate-spin" />
            ) : (
              <MailIcon />
            )}
            {isSubmitting ? "Mengubah..." : "Ubah kata sandi"}
          </Button>
        </FieldGroup>
      )}

      <p className="text-center text-sm text-muted-foreground">
        Sudah punya kata sandi baru?{" "}
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
