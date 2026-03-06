"use client";

import { useState } from "react";

import {
  WorkspaceSidebar,
  type Section,
} from "@/components/Notes/WorkSpaceSidebar";

import { NotesSection } from "@/components/Notes/NotesSection";
import { TasksSection } from "@/components/Tasks/TasksSection";
import { cn } from "@/lib/utils";

export default function NotesPage() {
  const [activeSection, setActiveSection] = useState<Section>("notes");

  const isTasks = activeSection === "tasks";

  return (
    <div className="h-full px-5">
      <div
        className={cn(
          "grid h-full min-h-0 gap-6",
          isTasks
            ? "lg:grid-cols-[240px_1fr]" 
            : "lg:grid-cols-[240px_340px_1fr]", 
        )}
      >
        {/* SIDEBAR */}
        <WorkspaceSidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />

        {!isTasks ? (
          <>
            {activeSection === "notes" ? <NotesSection trashed={false} /> : null}
            {activeSection === "trash" ? <NotesSection trashed={true} /> : null}
          </>
        ) : null}

        {/* TASKS  */}
        {isTasks ? (
          <div className="min-w-0">
            <TasksSection />
          </div>
        ) : null}
      </div>
    </div>
  );
}
