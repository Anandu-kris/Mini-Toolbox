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
    <div className="mx-auto max-w-full px-5 mb-1">
      <div
        className={cn(
          "grid gap-6",
          isTasks
            ? "lg:grid-cols-[240px_1fr]" // ✅ sidebar + board
            : "lg:grid-cols-[240px_340px_1fr]", // ✅ sidebar + list + editor
        )}
      >
        {/* SIDEBAR */}
        <WorkspaceSidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />

        {/* NOTES/TRASH keep their normal 2-column content */}
        {!isTasks ? (
          <>
            {activeSection === "notes" ? <NotesSection trashed={false} /> : null}
            {activeSection === "trash" ? <NotesSection trashed={true} /> : null}
          </>
        ) : null}

        {/* ✅ TASKS takes the big area */}
        {isTasks ? (
          <div className="min-w-0">
            <TasksSection />
          </div>
        ) : null}
      </div>
    </div>
  );
}
