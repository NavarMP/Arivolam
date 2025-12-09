import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 text-center">
      <div className="space-y-6">
        <h1 className="text-6xl font-bold tracking-tighter sm:text-7xl">
          <span className="text-primary">Arivolam</span>
        </h1>
        <p className="text-2xl text-muted-foreground">The Horizon of Learning</p>
        <p className="max-w-[600px] text-muted-foreground">
          Welcome to the future of campus management. Experience a featured-rich, immersive digital campus.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/dashboard">
            <Button size="lg" className="rounded-full text-lg">Enter Campus</Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg" className="rounded-full text-lg">Login</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
