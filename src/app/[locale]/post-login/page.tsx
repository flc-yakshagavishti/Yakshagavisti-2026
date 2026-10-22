"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { Role } from "@prisma/client";

const homeByRole: Record<Role, string> = {
  [Role.ADMIN]: "/admin",
  [Role.JUDGE]: "/dashboard/jury",
  [Role.PARTICIPANT]: "/team",
};

export default function PostLogin() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      window.location.href = "/login";
      return;
    }
    if (status === "authenticated") {
      const role = session.user.role;
      window.location.href = homeByRole[role] ?? "/team";
    }
  }, [status, session]);

  return <div className="flex min-h-screen items-center justify-center text-white">Signing you in...</div>;
}
