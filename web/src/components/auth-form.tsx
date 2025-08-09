"use client";

import { useFormStatus } from "react-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

type Props = {
  type: "login" | "signup";
  action: (formData: FormData) => Promise<void>;
};

export function AuthForm({ type, action }: Props) {
  const { pending } = useFormStatus();

  return (
    <form action={action} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          name="username"
          type="text"
          required
          placeholder="username"
          disabled={pending}
        />
      </div>
        {type === "signup" && (
            <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="email@example.com"
                disabled={pending}
            />
            </div>
        )}
      
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          placeholder="••••••••"
          disabled={pending}
        />
      </div>
      
      <Button 
        type="submit" 
        className="w-full"
        disabled={pending}
      >
        {pending ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </span>
        ) : type === "login" ? "Login" : "Sign Up"}
      </Button>
    </form>
    
  );
}