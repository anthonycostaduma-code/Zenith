import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Les anciennes routes restent valides et pointent vers le bon onglet du pilier.
  async redirects() {
    return [
      { source: "/taches", destination: "/quotidien?vue=taches", permanent: false },
      { source: "/habitudes", destination: "/quotidien?vue=habitudes", permanent: false },
      { source: "/etudes", destination: "/academie?vue=etudes", permanent: false },
      { source: "/focus", destination: "/academie?vue=focus", permanent: false },
      { source: "/moyenne", destination: "/progression?vue=moyenne", permanent: false },
      { source: "/suivi", destination: "/progression?vue=suivi", permanent: false },
    ];
  },
};

export default nextConfig;
