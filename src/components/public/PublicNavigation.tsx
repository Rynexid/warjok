"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function PublicNavigation({
  variant,
}: {
  variant?: "desktop" | "mobile";
}) {
  const pathname = usePathname();
  const isMobile = variant === "mobile";

  return (
    <nav
      className={cn(
        "flex items-center gap-1",
        isMobile
          ? "fixed inset-x-0 bottom-0 z-40 h-[calc(env(safe-area-inset-bottom)+3.5rem)] items-center justify-around border-t border-border/70 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85"
          : "hidden items-center gap-1",
      )}
    >
      <Link
        href="/menu"
        className={cn(
          "flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[11px] font-medium transition",
          isMobile
            ? "min-w-0 flex-1"
            : "rounded-lg px-3 py-1.5 text-sm",
          pathname?.startsWith("/menu")
            ? "text-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <span className="text-base" aria-hidden>🍽️</span>
        Menu
      </Link>
      <Link
        href="/"
        className={cn(
          "flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[11px] font-medium transition",
          isMobile ? "min-w-0 flex-1" : "rounded-lg px-3 py-1.5 text-sm",
          pathname === "/"
            ? "text-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <span className="text-base" aria-hidden>🏠</span>
        Beranda
      </Link>
    </nav>
  );
}
