import Link from 'next/link'
import { Home, Compass } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden px-6">
      {/* Background decoration elements */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30 dark:opacity-20 mix-blend-screen dark:mix-blend-lighten">
        <div className="w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/3 animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="w-[400px] h-[400px] bg-secondary/20 rounded-full blur-[100px] -translate-x-1/3 translate-y-1/3 animate-pulse" style={{ animationDuration: '6s' }} />
      </div>

      <div className="z-10 flex flex-col items-center text-center max-w-2xl relative">
        {/* 404 Header with layered effect */}
        <div className="relative mb-8 group cursor-default">
          <h1 className="text-[140px] sm:text-[200px] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-primary via-primary/80 to-primary/30 select-none drop-shadow-sm transition-transform duration-700 group-hover:scale-105">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-background/80 backdrop-blur-md px-6 py-2 rounded-full border border-primary/20 shadow-xl text-primary font-bold text-xl sm:text-2xl transform transition-all duration-500 group-hover:scale-110 shadow-primary/20">
              Page Not Found
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="animate-slide-up" style={{ animationFillMode: 'both' }}>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight mb-4">
            Looks like you're lost.
          </h2>
          
          <p className="text-muted-foreground text-lg sm:text-xl mb-10 max-w-lg mx-auto leading-relaxed">
            The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto animate-slide-up" style={{ animationDelay: '150ms', animationFillMode: 'both' }}>
          <Button asChild size="lg" className="rounded-full h-14 px-8 shadow-lg shadow-primary/20 group transition-all duration-300 hover:shadow-primary/40 hover:-translate-y-1 text-base">
            <Link href="/">
              <Home className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
              Return to Campus
            </Link>
          </Button>
          
          <Button asChild variant="outline" size="lg" className="rounded-full h-14 px-8 group transition-all duration-300 hover:-translate-y-1 border-primary/20 hover:border-primary/50 text-base bg-background/50 backdrop-blur-sm">
            <Link href="/explore">
              <Compass className="mr-2 h-5 w-5 group-hover:rotate-45 transition-transform duration-500" />
              Explore Directory
            </Link>
          </Button>
        </div>
      </div>
      
      {/* Footer text */}
      <div className="absolute bottom-10 text-muted-foreground text-sm font-medium tracking-[0.2em] uppercase opacity-40 animate-fade-in" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
        Arivolam Digital Campus
      </div>
    </div>
  )
}
