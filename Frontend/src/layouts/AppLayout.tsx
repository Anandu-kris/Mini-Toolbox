import { Link, Outlet } from "react-router-dom";
import { Sparkles, LogOut } from "lucide-react";
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
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');

        .app-header {
          top: 0;
          z-index: 50;
          padding: 16px 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-family: 'Sora', sans-serif;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .app-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
        }

        .app-logo-icon {
          width: 32px;
          height: 32px;
          border-radius: 9px;
          background: linear-gradient(140deg, #8b6dfd 0%, #5b3fe8 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 2px 12px rgba(124, 92, 252, 0.4);
          transition: box-shadow 0.2s, transform 0.2s;
        }

        .app-logo:hover .app-logo-icon {
          transform: translateY(-1px);
          box-shadow: 0 4px 18px rgba(124, 92, 252, 0.6);
        }

        .app-logo-text {
          display: flex;
          flex-direction: column;
          gap: 1px;
          font-size: 20px;
          font-weight: 600;
        }

        .app-logo-tagline {
          font-size: 11px;
          font-weight: 400;
          color: rgba(255, 255, 255, 0.3);
          letter-spacing: 0.01em;
          line-height: 1;
        }

        .app-logout-btn {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 8px 14px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.5);
          font-family: 'Sora', sans-serif;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s, color 0.2s;
        }

        .app-logout-btn:hover:not(:disabled) {
          background: rgba(255, 80, 80, 0.1);
          border-color: rgba(255, 80, 80, 0.2);
          color: rgba(255, 120, 120, 0.9);
        }

        .app-logout-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
      `}</style>

      <div className="h-dvh flex flex-col">
        <header className="app-header">
          {/* Logo */}
          <Link to="/home" className="app-logo">
            <div className="app-logo-icon">
              <Sparkles size={15} color="white" />
            </div>
            <div className="app-logo-text">
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
              <span className="app-logo-tagline">Productivity tools in one place</span>
            </div>
          </Link>

          {/* Logout */}
          <button
            className="app-logout-btn"
            onClick={handleLogout}
            disabled={isPending}
          >
            <LogOut size={14} />
            {isPending ? "Logging out…" : "Logout"}
          </button>
        </header>

        <main className="flex-1 min-h-0 pt-6 pb-10">
          <Outlet />
        </main>
      </div>
    </>
  );
}