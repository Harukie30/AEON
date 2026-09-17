"use client";

import { useEffect, useRef, useState, type ReactNode, Suspense } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { DeckLoader } from "@/components/command/deck-loader";
import { DeckRevealProvider } from "@/components/command/deck-reveal";
import { ThreatBulletin } from "@/components/command/threat-bulletin";
import { useUtcLabel } from "@/lib/clock";
import { clearSession, markSessionEnded, SESSION_BOOT } from "@/lib/session";
import { useAeonSession } from "@/lib/use-session";

const NAV = [
  { href: "/command", label: "OVERVIEW" },
  { href: "/command/network", label: "NETWORK" },
  { href: "/command/observe", label: "OBSERVE" },
  { href: "/command/alerts", label: "ALERTS" },
];

type LoaderState = {
  key: number;
  label: string;
  mode: "boot" | "module" | "logout";
};

function moduleLabel(pathname: string) {
  if (pathname.startsWith("/command/network")) return "NETWORK";
  if (pathname.startsWith("/command/observe")) return "OBSERVE";
  if (pathname.startsWith("/command/alerts")) return "ALERTS";
  return "OVERVIEW";
}

export function CommandShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const session = useAeonSession();
  const utcLabel = useUtcLabel();
  const previousPath = useRef(pathname);
  const [ending, setEnding] = useState(false);
  const [heldOperator, setHeldOperator] = useState<string | null>(null);
  const [loader, setLoader] = useState<LoaderState | null>({
    key: 0,
    label: moduleLabel(pathname),
    mode: "boot",
  });

  useEffect(() => {
    if (ending) return;
    if (session === SESSION_BOOT) return;
    if (!session) router.replace("/");
  }, [ending, session, router]);

  useEffect(() => {
    if (ending) return;
    if (previousPath.current === pathname) return;
    previousPath.current = pathname;
    setLoader({
      key: Date.now(),
      label: moduleLabel(pathname),
      mode: "module",
    });
  }, [ending, pathname]);

  const operatorId =
    session && session !== SESSION_BOOT ? session.operatorId : heldOperator ?? "UNKNOWN";

  function beginLogout() {
    if (ending) return;
    setEnding(true);
    setHeldOperator(operatorId);
    setLoader({
      key: Date.now(),
      label: "SESSION",
      mode: "logout",
    });
  }

  if ((!session || session === SESSION_BOOT) && !ending) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background font-mono text-xs tracking-[0.24em] text-aeon-cyan/70">
        VERIFYING SESSION
      </div>
    );
  }

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-background">
      <div className="aeon-stars pointer-events-none absolute inset-0 opacity-70" />
      <div className="aeon-grid pointer-events-none absolute inset-0 opacity-50" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,#04070a_88%)]" />

      <header className="relative z-10 flex flex-wrap items-center gap-3 border-b border-aeon-cyan/15 px-4 py-3 sm:px-6">
        <Link
          className="font-display text-lg tracking-[0.28em] text-white"
          href="/command"
        >
          AEON
        </Link>
        <p className="hidden font-mono text-[10px] tracking-[0.22em] text-aeon-cyan/70 sm:block">
          COMMAND DECK
        </p>

        <nav className="flex flex-1 flex-wrap items-center gap-1 sm:justify-center">
          {NAV.map((item) => {
            const active =
              item.href === "/command"
                ? pathname === "/command"
                : pathname.startsWith(item.href);

            return (
              <Link
                className={`px-3 py-1.5 font-mono text-[10px] tracking-[0.2em] transition ${
                  active
                    ? "border border-aeon-cyan/50 bg-aeon-cyan/10 text-aeon-cyan"
                    : "border border-transparent text-foreground/45 hover:border-aeon-cyan/20 hover:text-aeon-cyan/80"
                }`}
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex flex-wrap items-center gap-4 font-mono text-[10px] tracking-[0.16em] text-aeon-cyan/80">
          <p className="hidden text-foreground/50 lg:block">{utcLabel}</p>
          <p className="flex items-center gap-2">
            <span className="aeon-pulse inline-block size-1.5 rounded-full bg-aeon-cyan shadow-[0_0_8px_#4ff4e2]" />
            NET NOMINAL
          </p>
          <p className="text-white">{operatorId}</p>
          <button
            className="border border-white/10 px-2 py-1 text-foreground/50 transition hover:border-aeon-amber/40 hover:text-aeon-amber disabled:opacity-40"
            disabled={loader?.mode === "logout"}
            onClick={beginLogout}
            type="button"
          >
            END SESSION
          </button>
        </div>
      </header>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <DeckRevealProvider ready={!loader}>{children}</DeckRevealProvider>
      </div>

      {loader ? (
        <DeckLoader
          key={`${loader.mode}-${loader.key}`}
          label={loader.label}
          mode={loader.mode}
          onDone={() => {
            if (loader.mode === "logout") {
              markSessionEnded();
              clearSession();
              router.push("/");
              return;
            }
            setLoader(null);
          }}
          operatorId={operatorId}
        />
      ) : (
        <Suspense fallback={null}>
          <ThreatBulletin ready={!ending} />
        </Suspense>
      )}
    </div>
  );
}
