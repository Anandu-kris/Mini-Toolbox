"use client";

import { useState } from "react";

import {
  WorkspaceSidebar,
  type Section,
} from "@/components/Notes/WorkSpaceSidebar";

import { NotesSection } from "@/components/Notes/NotesSection";
import { TasksSection } from "@/components/Tasks/TasksSection";

export default function NotesPage() {
  const [activeSection, setActiveSection] = useState<Section>("notes");

  const isTasks = activeSection === "tasks";

  return (
    <div className="h-full px-5">
      <div className="grid h-full min-h-0 gap-6 lg:grid-cols-[auto_1fr]">
        <WorkspaceSidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />

        <div className="min-w-0">
          {isTasks ? (
            <TasksSection />
          ) : activeSection === "notes" ? (
            <NotesSection trashed={false} />
          ) : activeSection === "trash" ? (
            <NotesSection trashed />
          ) : null}
        </div>
      </div>
    </div>
  );
}
