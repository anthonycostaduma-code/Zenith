"use client";

import { PillarPage } from "@/components/PillarPage";
import StudiesView from "@/components/views/StudiesView";
import FocusView from "@/components/views/FocusView";

export default function AcademiePage() {
  return (
    <PillarPage
      title="Académie"
      tabs={[
        { id: "etudes", label: "Études", render: () => <StudiesView /> },
        { id: "focus", label: "Focus", render: () => <FocusView /> },
      ]}
    />
  );
}
