"use client";

import { PillarPage } from "@/components/PillarPage";
import TasksView from "@/components/views/TasksView";
import HabitsView from "@/components/views/HabitsView";

export default function QuotidienPage() {
  return (
    <PillarPage
      title="Quotidien"
      tabs={[
        { id: "taches", label: "Tâches", render: () => <TasksView /> },
        { id: "habitudes", label: "Habitudes", render: () => <HabitsView /> },
      ]}
    />
  );
}
