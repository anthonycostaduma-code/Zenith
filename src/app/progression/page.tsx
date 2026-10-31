"use client";

import { PillarPage } from "@/components/PillarPage";
import AverageView from "@/components/views/AverageView";
import TrackingView from "@/components/views/TrackingView";

export default function ProgressionPage() {
  return (
    <PillarPage
      title="Progression"
      tabs={[
        { id: "moyenne", label: "Moyenne", render: () => <AverageView /> },
        { id: "suivi", label: "Suivi", render: () => <TrackingView /> },
      ]}
    />
  );
}
