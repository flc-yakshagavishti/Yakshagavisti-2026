"use client";

import { signIn } from "next-auth/react";
import { useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

export default function JudgeLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });
    setLoading(false);

    if (!res || res.error) {
      toast.error("Invalid username or password");
      return;
    }
    // Full reload so the session is picked up everywhere.
    window.location.href = "/dashboard/jury";
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-4 rounded-lg border bg-white p-6 text-primary-100 shadow"
      >
        <h1 className="text-xl font-semibold text-primary-100">Log In</h1>
        <div className="space-y-2">
          <Label htmlFor="username" className="text-primary-100">Username or email</Label>
          <Input
            id="username"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="bg-white text-gray-900"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="text-primary-100">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-white text-gray-900"
            required
          />
        </div>
        <Button type="submit" className="w-full bg-primary-100 text-white hover:bg-primary-100/90" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </Button>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="h-px flex-1 bg-gray-200" />
          or
          <span className="h-px flex-1 bg-gray-200" />
        </div>
        <Button
          type="button"
          variant="outline"
          className="w-full bg-white text-primary-100"
          onClick={() => void signIn("google", { callbackUrl: "/dashboard/jury" })}
        >
          Continue with Google
        </Button>
      </form>
    </div>
  );
}
