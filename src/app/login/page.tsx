import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      {/* Subtle background overlay - much lighter for better image visibility */}
      <div className="absolute inset-0 z-0 bg-black/20 backdrop-blur-[2px]"></div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo/Title */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-5xl font-bold text-white">Trading Journal</h1>
          <p className="text-lg text-gray-200">Gerencie seus trades com profissionalismo</p>
        </div>

        {/* Suspend the form to prevent hydration mismatch with searchParams */}
        <Suspense fallback={<LoginFormSkeleton />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}

function LoginFormSkeleton() {
  return (
    <div className="rounded-3xl border border-gray-700 bg-[#353b3e] p-8 shadow-2xl">
      <div className="mb-8 flex animate-pulse gap-4">
        <div className="h-12 flex-1 rounded bg-gray-700"></div>
        <div className="h-12 flex-1 rounded bg-gray-700"></div>
      </div>
      <div className="animate-pulse space-y-5">
        <div className="h-12 rounded bg-gray-700"></div>
        <div className="h-12 rounded bg-gray-700"></div>
        <div className="h-12 rounded bg-gray-700"></div>
      </div>
    </div>
  );
}
