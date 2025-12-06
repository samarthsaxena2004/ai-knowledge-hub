"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

// 🛡️ Fix: We infer the types automatically to avoid version conflicts
type ThemeProviderProps = React.ComponentProps<typeof NextThemesProvider>;

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
