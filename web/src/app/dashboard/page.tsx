"use client";

import { Header } from "@/components/header";
import { RoomComponent } from "@/components/room-component";
import { Auth } from "@/components/auth";
import LK from "@/components/lk";
import Heart from "@/assets/heart.svg";
import { GitHubLogoIcon, HomeIcon } from "@radix-ui/react-icons";

import Link from "next/link";
import { useEffect, useState } from "react";
import { logoutAction } from "../actions/logout";

export default function Dashboard() {
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const handleLogout = async () => {
    try {
      await logoutAction();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };
  useEffect(() => {
    // Function to get cookie by name
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };

    // Get username from cookie
    const cookieUsername = getCookie('username');
    if (cookieUsername) {
      setUsername(decodeURIComponent(cookieUsername));
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-neutral-100">
      <header className="flex flex-shrink-0 h-12 items-center justify-between px-4 w-full md:mx-auto">
        <LK />
        <div className="flex items-center gap-8">
          <nav className="hidden md:flex items-center gap-4 text-sm">
            {username ? (
              <div className="flex items-center gap-4">
              <span className="text-gray-800 font-medium">
                Welcome, <span className="uppercase">{username}</span>
              </span>
              <button 
                onClick={handleLogout}
                className="hover:text-yellow-600 transition-colors bg-red-800 text-white px-3 py-1 rounded"
              >
                Logout
              </button>
            </div>
            ) : (
              <>
                <Link 
                  href="/login" 
                  className="hover:text-blue-600 transition-colors"
                >
                  Login
                </Link>
                <Link 
                  href="/signup" 
                  className="hover:text-blue-600 transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </nav>
        </div>
        <Auth />
      </header>
      <main className="flex flex-col flex-grow overflow-hidden p-0 md:p-2 md:pt-0 w-full md:mx-auto">
        <Header />
        <RoomComponent />
      </main>
      {/* <footer className="hidden md:flex md:items-center md:gap-2 md:justify-end font-mono uppercase text-right pt-1 pb-2 px-8 text-xs text-gray-600 w-full md:mx-auto">
        Built with
        <Heart />
        on
        <a
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          LiveKit Agents
        </a>{" "}
        •
        <a
          href="https://github.com/livekit-examples/realtime-playground"
          target="_blank"
          rel="noopener noreferrer"
          className="underline inline-flex items-center gap-1"
        >
          <GitHubLogoIcon className="h-4 w-4" />
          View source on GitHub
        </a>
        • © 2024 LiveKit
      </footer> */}
    </div>
  );
}