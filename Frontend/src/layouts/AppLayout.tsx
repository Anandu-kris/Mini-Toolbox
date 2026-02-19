import { Link, Outlet } from "react-router-dom";
import { Wrench, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLogout } from "@/hooks/useLogout";
import ShinyText from "@/components/Animation/ShinyText";

export default function AppLayout() {
  const { mutateAsync: logout, isPending } = useLogout();

  async function handleLogout() {
    try {
      await logout();
      window.location.href = "/login";
    } catch (err) {
      console.log("Logout failed", err);
    }
  }

  return (
    <div className="min-h-dvh flex flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur border-b">
        <div className="mx-auto w-full max-w-full px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/home" className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
                <Wrench className="h-5 w-5 text-white" />
              </div>
              <div className="leading-tight">
                <div className="text-lg font-semibold tracking-tight text-white">
                  <ShinyText
                    text="Mini-Toolbox"
                    speed={2}
                    delay={0}
                    color="#b5b5b5"
                    shineColor="#ffffff"
                    spread={120}
                    direction="left"
                    yoyo={false}
                    pauseOnHover={false}
                    disabled={false}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Productivity tools in one place
                </p>
              </div>
            </Link>
          </div>

          {/* Logout */}
          <Button
            onClick={handleLogout}
            disabled={isPending}
            className="text-sm text-white bg-gray-800 hover:bg-gray-700"
          >
            <LogOut className="mr-1 h-4 w-4" />
            {isPending ? "Logging out..." : "Logout"}
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="min-h-[calc(100dvh-72px)] mb-10 mt-6">
        <Outlet />
      </main>
    </div>
  );
}
