"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Lightbulb, PlusCircle, Network } from "lucide-react"

const LINKS = [
    { href: "/", label: "아이디어 등록", icon: PlusCircle },
    { href: "/ideas", label: "아이디어 목록", icon: Network },
]

export function SiteNav() {
    const pathname = usePathname()

    return (
        <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
            <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-3">
                <Link href="/" className="flex items-center gap-2">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand text-brand-foreground">
            <Lightbulb className="size-4" aria-hidden="true" />
          </span>
                    <span className="text-sm font-semibold tracking-tight text-foreground">IdeaBoard</span>
                </Link>

                <nav className="flex items-center gap-1">
                    {LINKS.map(({ href, label, icon: Icon }) => {
                        const active = pathname === href
                        return (
                            <Link
                                key={href}
                                href={href}
                                aria-current={active ? "page" : undefined}
                                className={
                                    active
                                        ? "flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground transition-colors"
                                        : "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                                }
                            >
                                <Icon className="size-4" aria-hidden="true" />
                                <span className="hidden sm:inline">{label}</span>
                            </Link>
                        )
                    })}
                </nav>
            </div>
        </header>
    )
}