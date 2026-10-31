"use client";

import { Suspense, useCallback, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export interface PillarTab {
  id: string;
  label: string;
  render: () => ReactNode;
}

function Tabs({ title, tabs }: { title: string; tabs: PillarTab[] }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const requested = params.get("vue");
  const current = tabs.find((t) => t.id === requested) ?? tabs[0];

  const select = useCallback(
    (id: string) => {
      router.replace(id === tabs[0].id ? pathname : `${pathname}?vue=${id}`, { scroll: false });
    },
    [router, pathname, tabs],
  );

  return (
    <div className="w-full max-w-full space-y-6">
      <div className="flex w-full max-w-full flex-col items-start gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
        <h1 className="min-w-0 text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>

        {/* Segmented control façon iOS : une seule surface dépolie. */}
        <div
          role="tablist"
          aria-label={title}
          className="no-scrollbar inline-flex max-w-full shrink-0 gap-1 overflow-x-auto rounded-full border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900"
        >
          {tabs.map((tab) => {
            const active = tab.id === current.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={active}
                onClick={() => select(tab.id)}
                className="min-h-[38px] shrink-0 whitespace-nowrap transform-gpu rounded-full px-4 text-sm font-semibold transition-all duration-200"
                style={{
                  background: active ? "var(--accent)" : "transparent",
                  color: active ? "var(--accent-contrast)" : "var(--muted)",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div key={current.id} className="fade-in">
        {current.render()}
      </div>
    </div>
  );
}

export function PillarPage({ title, tabs }: { title: string; tabs: PillarTab[] }) {
  return (
    <Suspense fallback={<p className="muted pt-6 text-sm">Chargement…</p>}>
      <Tabs title={title} tabs={tabs} />
    </Suspense>
  );
}
