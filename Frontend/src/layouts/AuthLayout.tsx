import { Outlet } from "react-router-dom";
import { Wrench } from "lucide-react";

export default function AuthLayout() {
  return (
    <>
      <header className="sticky top-0 z-50 backdrop-blur border-b">
        <div className="mx-auto w-full max-w-full px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer">
              <div className="h-9 w-9 rounded-lg bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
                <Wrench className="h-5 w-5 text-white" />
              </div>
              <div className="leading-tight">
                <h1 className="text-lg font-semibold tracking-tight text-white">
                  Mini-Toolbox
                </h1>
                <p className="text-xs text-muted-foreground">
                  Productivity tools in one place
                </p>
              </div>
          </div>
        </div>
      </header>
      
      <main className="min-h-[calc(100dvh-80px)] grid place-items-center p-4">
        <Outlet />
      </main>
    </>
  );
}
