import { Link, Outlet } from "react-router-dom";
import { Sparkles } from "lucide-react";
import ShinyText from "@/components/Animation/ShinyText";
import AccountDropdown from "@/components/AccountDropdown";
import NotificationDropdown from "@/components/NotificationDropdown";
import { useCurrentUser } from "@/hooks/useAuth";


export default function AppLayout() {
  const { data: me } = useCurrentUser();


  const name = me?.name ?? undefined;
  const email = me?.email ?? undefined;
  const avatarUrl = me?.avatarUrl;


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

        .app-right-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .app-unread-pill {
          height: 28px;
          min-width: 28px;
          padding: 0 10px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          color: white;
          background: linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%);
          box-shadow: 0 8px 22px rgba(168, 85, 247, 0.28);
          border: 1px solid rgba(255,255,255,0.14);
        }
      `}</style>

      <div className="h-dvh flex flex-col">
        <header className="app-header">
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
              <span className="app-logo-tagline">
                Productivity tools in one place
              </span>
            </div>
          </Link>

          <div className="app-right-actions">
            <NotificationDropdown
            />

            <AccountDropdown
              name={name}
              email={email}
              avatarUrl={avatarUrl}
            />
          </div>
        </header>

        <main className="flex-1 min-h-0 pt-2 pb-10">
          <Outlet />
        </main>
      </div>
    </>
  );
}