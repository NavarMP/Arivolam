# Arivolam Next.js Implementation Guide
## Quick Start for Development

**Project:** Arivolam - Campus Unified Platform  
**Framework:** Next.js 14+  
**UI Library:** Tailwind CSS + Shadcn/ui  
**Date:** December 4, 2025

---

## 🚀 QUICK START SETUP (15 minutes)

### Step 1: Create Next.js Project
```bash
npx create-next-app@latest arivolam-app --typescript --tailwind --eslint
cd arivolam-app
```

### Step 2: Install Dependencies
```bash
# UI & Styling
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install @heroicons/react clsx
npm install recharts                    # For charts

# Forms & Validation
npm install react-hook-form zod zustand

# API & Data
npm install axios swr
npm install socket.io-client            # Real-time

# Video Conferencing
npm install @jitsi/js-sdk

# Maps
npm install leaflet react-leaflet
npm install -D leaflet

# Notifications
npm install react-toastify

# Authentication
npm install js-cookie

# Dev Tools
npm install -D prettier @types/node
```

### Step 3: Setup Environment
Create `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_NAME=Arivolam
NEXT_PUBLIC_JITSI_URL=https://meet.jitsi.org
```

### Step 4: Run Development Server
```bash
npm run dev
# Open http://localhost:3000
```

---

## 📁 PROJECT STRUCTURE SETUP

```bash
# Create directory structure
mkdir -p app/{auth,dashboard,api/{auth,attendance,library,fees,assignments,exams,progress,notifications}}
mkdir -p components/{layout,common,forms,dashboard,features}
mkdir -p lib hooks context styles
mkdir -p public/icons
```

---

## 🎨 TAILWIND THEME CONFIGURATION

### File: `tailwind.config.ts`

```typescript
import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark theme
        dark: {
          bg: "#0a0e27",
          card: "#1a1f3a",
          border: "#2d3354",
        },
        // Light theme
        light: {
          bg: "#f8fafc",
          card: "#ffffff",
          border: "#e2e8f0",
        },
        // Accent colors
        primary: "#3b82f6",
        success: "#10b981",
        warning: "#f59e0b",
        error: "#ef4444",
      },
      fontFamily: {
        sans: ["Poppins", "sans-serif"],
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        "2xl": "48px",
      },
    },
  },
  plugins: [],
}
export default config
```

### File: `app/globals.css`

```css
@import url("https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap");

@tailwind base;
@tailwind components;
@tailwind utilities;

/* Light theme (default) */
:root {
  --bg-primary: #f8fafc;
  --bg-secondary: #ffffff;
  --bg-tertiary: #f1f5f9;
  --text-primary: #1f2937;
  --text-secondary: #6b7280;
  --border: #e2e8f0;
  --accent: #2563eb;
}

/* Dark theme */
[class="dark"],
html[data-theme="dark"] {
  --bg-primary: #0a0e27;
  --bg-secondary: #1a1f3a;
  --bg-tertiary: #2d3354;
  --text-primary: #f5f5f5;
  --text-secondary: #a0a0a0;
  --border: #3a4051;
  --accent: #3b82f6;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: "Poppins", sans-serif;
}

body {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  transition: background-color 0.3s, color 0.3s;
}
```

---

## 🔐 AUTHENTICATION SETUP

### File: `context/AuthContext.tsx`

```typescript
"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import Cookies from "js-cookie"
import axios from "axios"

interface User {
  id: string
  email: string
  name: string
  role: "admin" | "teacher" | "student" | "librarian" | "support"
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  register: (data: any) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Check if user is logged in on app load
  useEffect(() => {
    const token = Cookies.get("authToken")
    if (token) {
      // Verify token and fetch user data
      axios
        .get(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setUser(res.data.user))
        .catch(() => Cookies.remove("authToken"))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    const res = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
      { email, password }
    )
    Cookies.set("authToken", res.data.token)
    setUser(res.data.user)
  }

  const logout = () => {
    Cookies.remove("authToken")
    setUser(null)
  }

  const register = async (data: any) => {
    const res = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/register`,
      data
    )
    Cookies.set("authToken", res.data.token)
    setUser(res.data.user)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
```

---

## 🌓 THEME TOGGLE

### File: `context/ThemeContext.tsx`

```typescript
"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

type Theme = "light" | "dark"

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Get theme from localStorage or system preference
    const saved = localStorage.getItem("theme") as Theme | null
    const system = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light"
    const initial = saved || system
    setTheme(initial)
    applyTheme(initial)
  }, [])

  const applyTheme = (newTheme: Theme) => {
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark"
    setTheme(newTheme)
    localStorage.setItem("theme", newTheme)
    applyTheme(newTheme)
  }

  if (!mounted) return children

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider")
  }
  return context
}
```

### File: `components/common/ThemeToggle.tsx`

```typescript
"use client"

import { useTheme } from "@/context/ThemeContext"
import { SunIcon, MoonIcon } from "@heroicons/react/24/outline"

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
    >
      {theme === "dark" ? (
        <SunIcon className="w-5 h-5" />
      ) : (
        <MoonIcon className="w-5 h-5" />
      )}
    </button>
  )
}
```

---

## 📐 HEADER & SIDEBAR

### File: `components/layout/Header.tsx`

```typescript
"use client"

import { useAuth } from "@/context/AuthContext"
import { useTheme } from "@/context/ThemeContext"
import { ThemeToggle } from "./ThemeToggle"
import Link from "next/link"

export function Header() {
  const { user, logout } = useAuth()
  const { theme } = useTheme()

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <img
            src={theme === "dark" ? "/logo-dark.png" : "/logo.png"}
            alt="Arivolam"
            className="h-8"
          />
          <span className="font-bold text-lg">Arivolam</span>
        </Link>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          <ThemeToggle />
          {user && (
            <button
              onClick={logout}
              className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600"
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
```

### File: `components/layout/Sidebar.tsx`

```typescript
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/context/AuthContext"

const menuItems = {
  student: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Attendance", href: "/dashboard/attendance" },
    { label: "Assignments", href: "/dashboard/assignments" },
    { label: "Grades", href: "/dashboard/progress" },
    { label: "Library", href: "/dashboard/library" },
    { label: "Navigation", href: "/dashboard/navigation" },
    { label: "Exams", href: "/dashboard/exams" },
    { label: "Fees", href: "/dashboard/fees" },
    { label: "Professors", href: "/dashboard/professors" },
    { label: "Discussion", href: "/dashboard/discussions" },
    { label: "Support", href: "/dashboard/support" },
  ],
  teacher: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Attendance", href: "/dashboard/attendance" },
    { label: "Assignments", href: "/dashboard/assignments" },
    { label: "Video Class", href: "/dashboard/video-calls" },
    { label: "Exams", href: "/dashboard/exams" },
    { label: "Support", href: "/dashboard/support" },
  ],
  admin: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Users", href: "/dashboard/users" },
    { label: "Attendance", href: "/dashboard/attendance" },
    { label: "Fees", href: "/dashboard/fees" },
    { label: "Exams", href: "/dashboard/exams" },
    { label: "Reports", href: "/dashboard/reports" },
  ],
}

export function Sidebar() {
  const { user } = useAuth()
  const pathname = usePathname()

  if (!user) return null

  const items = menuItems[user.role as keyof typeof menuItems] || []

  return (
    <aside className="hidden lg:flex fixed left-0 top-16 h-screen w-64 flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 overflow-y-auto">
      <nav className="flex-1 px-4 py-8 space-y-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block px-4 py-2 rounded-lg transition ${
              pathname === item.href
                ? "bg-blue-500 text-white"
                : "hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
```

---

## 📄 ROOT LAYOUT

### File: `app/layout.tsx`

```typescript
import type { Metadata } from "next"
import { AuthProvider } from "@/context/AuthContext"
import { ThemeProvider } from "@/context/ThemeContext"
import { Header } from "@/components/layout/Header"
import { Sidebar } from "@/components/layout/Sidebar"
import "./globals.css"

export const metadata: Metadata = {
  title: "Arivolam - Campus Unified Platform",
  description: "The Horizon of Learning",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <AuthProvider>
            <Header />
            <Sidebar />
            <main className="lg:ml-64 pt-16">{children}</main>
            <footer className="text-center py-4 text-sm text-gray-600 dark:text-gray-400">
              <p>
                Copyright © 2025 Arivolam - Campus Unified Platform | Powered by NavarMP.Digibayt.com
              </p>
            </footer>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
```

---

## 🔒 LOGIN PAGE

### File: `app/(auth)/login/page.tsx`

```typescript
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import { useForm } from "react-hook-form"
import { z } from "zod"

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [error, setError] = useState("")
  const { register, handleSubmit } = useForm<LoginFormData>()

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password)
      router.push("/dashboard")
    } catch (err) {
      setError("Invalid email or password")
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Arivolam" className="h-12 mx-auto mb-4" />
          <h1 className="text-2xl font-bold">Arivolam</h1>
          <p className="text-gray-600 dark:text-gray-400">The Horizon of Learning</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              {...register("email")}
              type="email"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              {...register("password")}
              type="password"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  )
}
```

---

## ✅ NEXT STEPS

1. **Setup Backend:** Create Node.js/Express API with all endpoints
2. **Database:** Setup MongoDB + PostgreSQL
3. **Real-time:** Implement Socket.io for notifications
4. **Features:** Implement each module based on the prompt
5. **Testing:** Add Jest + React Testing Library
6. **Deployment:** Deploy to Vercel

---

## 📚 Resources

- **Next.js Docs:** https://nextjs.org/docs
- **Tailwind CSS:** https://tailwindcss.com/docs
- **Shadcn/ui:** https://ui.shadcn.com
- **React Hook Form:** https://react-hook-form.com
- **Recharts:** https://recharts.org

---

*This guide provides the foundation. Build on top of it!*