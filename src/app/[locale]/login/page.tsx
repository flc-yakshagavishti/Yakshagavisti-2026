"use client";

import { signIn } from "next-auth/react";
import { useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { FiEye, FiEyeOff } from "react-icons/fi";
import Reveal from "~/components/Animations/reveal";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
            <h2 className="text-center font-rhomdon text-4xl font-bold text-white md:text-5xl">
              Log <span className="text-secondary-100">In</span>
            </h2>
          </Reveal>

          <Reveal classes="">
            <Button
              type="button"
              className="w-full rounded-md bg-secondary-100 font-rhomdon text-lg text-white hover:bg-secondary-200"
              onClick={() => void signIn("google", { callbackUrl: "/post-login" })}
            >
              Continue with Google
            </Button>
          </Reveal>

          <div className="flex items-center gap-3 font-rhomdon text-white/70">
            <span className="h-px flex-1 bg-white/30" />
            Organisers
            <span className="h-px flex-1 bg-white/30" />
          </div>

          <Reveal classes="">
            <form onSubmit={onSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="username" className="font-rhomdon text-lg text-white">Username or email</Label>
                <Input
                  id="username"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="border-white/20 bg-white/10 text-white placeholder:text-white/50 focus-visible:ring-secondary-100"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="password" className="font-rhomdon text-lg text-white">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border-white/20 bg-white/10 pr-10 text-white placeholder:text-white/50 focus-visible:ring-secondary-100"
                    required
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-white/70 hover:text-secondary-100"
                  >
                    {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                disabled={loading}
                variant="outline"
                className="w-full rounded-md border-secondary-100 bg-transparent font-rhomdon text-lg text-white hover:bg-secondary-100/10 hover:text-white"
              >
                {loading ? "Signing in..." : "Organiser sign in"}
              </Button>
            </form>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
