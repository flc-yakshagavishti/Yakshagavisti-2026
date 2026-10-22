"use client";

import { signIn } from "next-auth/react";
import { useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import Reveal from "~/components/Animations/reveal";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

export default function Login() {
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
    window.location.href = "/post-login";
  };

  return (
    <div className="mt-[4.75rem] sm:mt-[5.75rem] md:mt-24 lg:mt-[6.25rem] min-h-[60vh] flex flex-col justify-center px-4 py-10">
      <div className="container m-auto flex justify-center">
        <div className="flex w-full max-w-md flex-col gap-8">
          <Reveal classes="">
            <h2 className="text-center font-rhomdon text-4xl font-bold md:text-5xl">
              Log <span className="text-secondary-100">In</span>
            </h2>
          </Reveal>

          <Reveal classes="">
            <form onSubmit={onSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="username">Username or email</Label>
                <Input
                  id="username"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-secondary-100 text-black hover:bg-secondary-200"
              >
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </Reveal>

          <div className="flex items-center gap-3 text-sm opacity-70">
            <span className="h-px flex-1 bg-current opacity-30" />
            or
            <span className="h-px flex-1 bg-current opacity-30" />
          </div>

          <Reveal classes="">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => void signIn("google", { callbackUrl: "/post-login" })}
            >
              Continue with Google
            </Button>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
