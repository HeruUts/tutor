import { AuthForm } from "@/components/auth-form";
import { Metadata } from "next";
import LK from "@/components/lk";
import { signupAction } from "@/app/actions/signup";

export const metadata: Metadata = {
  title: "Sign Up- Bright Hikari",
  description: "Sign Up to your voice assistant account",
};

export default function SignUpPage({
  searchParams,
}: {
  searchParams: { message?: string };
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-100 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center">
          <LK />
        </div>

        {searchParams.message && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {decodeURIComponent(searchParams.message)}
          </div>
        )}

        <AuthForm type="signup" action={signupAction} />
      </div>
    </div>
  );
}
