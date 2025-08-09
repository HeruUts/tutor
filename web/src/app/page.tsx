import LK from "@/components/lk";
import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Bright Hikari - AI Voice Assistant",
  description: "Experience personalized voice interactions powered by AI",
};

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100">
      <header className="flex h-16 items-center justify-between px-6">
        <LK />
        <div className="flex gap-4">
          <Link href="/login">
            <Button variant="ghost" className="bg-blue-500 text-white">Login</Button>
          </Link>
          <Link href="/signup">
            <Button>Sign Up</Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-5xl font-bold mb-6">
          Intelligent Voice <span className="text-blue-600">Conversations</span>
        </h1>
        <p className="text-xl mb-12 max-w-2xl mx-auto">
          Experience real-time speech-to-speech AI interactions personalized to your needs
        </p>
        
        <div className="flex justify-center gap-4">
          <Link href="/signup">
            <Button size="lg">Get Started</Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline">
              Demo Now
            </Button>
          </Link>
          {/* <Link href="/achievements">
            <Button size="lg" variant="outline">
              Achievements
            </Button>
          </Link> */}
        </div>
      </main>

      <footer className="py-8 text-center text-sm text-gray-600">
        © {new Date().getFullYear()} Bright Hikari. All rights reserved.
      </footer>
    </div>
  );
}