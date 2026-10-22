"use client";

import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import type React from "react";

const SecondWrapper = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const { data: session } = useSession();
  const router = useRouter();

  const normalizedPath = pathname.replace(/^\/(en|kn)(?=\/|$)/, "") || "/";
  const locale = /^\/(en|kn)(?:\/|$)/.exec(pathname)?.[1];
  const judgePath = locale ? `/${locale}/dashboard/jury` : "/dashboard/jury";

  useEffect(() => {
    if (
      session?.user?.role === "JUDGE" &&
      normalizedPath !== "/dashboard/jury"
    ) {
      router.replace(judgePath);
    }
  }, [judgePath, normalizedPath, router, session?.user?.role]);

  if (session?.user?.role === "JUDGE" && normalizedPath !== "/dashboard/jury") {
    return null;
  }

  return children;
};

export default SecondWrapper;
