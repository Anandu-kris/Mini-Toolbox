import * as React from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Settings, User, ChevronDown } from "lucide-react";
import { useLogout } from "@/hooks/useLogout";

type AccountDropdownProps = {
  name?: string ;
  email?: string;
  avatarUrl?: string | null;
  compact?: boolean;
};

function initialsFromName(name?: string) {
  const n = (name || "").trim();
  if (!n) return "U";
  const parts = n.split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join("") || "U";
}

export default function AccountDropdown({
  name = "Your Account",
  email = "you@example.com",
  avatarUrl = "avatar",
  compact = false,
}: AccountDropdownProps) {
  const navigate = useNavigate();
  const { mutateAsync: logout, isPending } = useLogout();

  const [open, setOpen] = React.useState(false);
  const btnRef = React.useRef<HTMLButtonElement | null>(null);
  const menuRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    function onDocDown(e: MouseEvent) {
      if (!open) return;
      const t = e.target as Node;
      if (btnRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      setOpen(false);
    }

    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onDocDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

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
        .acc-wrap { position: relative; }

        .acc-btn{
          display:flex;
          align-items:center;
          gap:10px;
          padding:6px 10px;
          border-radius:12px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.85);
          cursor:pointer;
          transition: background .2s, border-color .2s, transform .2s;
          font-family: 'Sora', sans-serif;
        }
        .acc-btn:hover{
          background: rgba(255,255,255,0.07);
          border-color: rgba(255,255,255,0.12);
          transform: translateY(-1px);
        }
        .acc-btn:focus-visible{
          outline: none;
          box-shadow: 0 0 0 3px rgba(124,92,252,0.35);
        }

        .acc-avatar{
          width:30px;
          height:30px;
          border-radius:12px;
          overflow:hidden;
          display:grid;
          place-items:center;
          flex-shrink:0;
          background: linear-gradient(140deg, rgba(139,109,253,0.9) 0%, rgba(91,63,232,0.9) 100%);
          box-shadow: 0 2px 12px rgba(124, 92, 252, 0.35);
        }
        .acc-avatar img{
          width:100%;
          height:100%;
          object-fit:cover;
          display:block;
        }
        .acc-initials{
          font-size:12px;
          font-weight:700;
          letter-spacing:0.02em;
          color:white;
          user-select:none;
        }

        .acc-meta{
          display:flex;
          flex-direction:column;
          line-height:1.1;
          text-align:left;
          min-width: 20px;
        }
        .acc-name{
          font-size:13px;
          font-weight:600;
          color: rgba(255,255,255,0.9);
        }
        // .acc-email{
        //   font-size:11px;
        //   color: rgba(255,255,255,0.45);
        //   margin-top:2px;
        // }

        .acc-menu{
          position:absolute;
          right:0;
          top: calc(100% + 10px);
          width: 200px;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(12, 14, 20, 0.72);
          backdrop-filter: blur(16px);
          box-shadow: 0 18px 60px rgba(0,0,0,0.35);
          overflow:hidden;
          transform-origin: top right;
          animation: accPop .14s ease-out;
          z-index: 80;
        }
        @keyframes accPop {
          from { opacity: 0; transform: translateY(-6px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        .acc-head{
          padding: 12px 12px 10px;
          border-bottom: 1px solid rgba(255,255,255,0.07);
          display:flex;
          gap:10px;
          align-items:center;
        }
        .acc-head .acc-meta{ min-width:0; }
        .acc-head .acc-name{ font-size:12.5px; }
        .acc-head .acc-email{
          font-size: 11.5px;
          overflow:hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          width: 100%;
        }

        .acc-items{ padding: 8px; display:flex; flex-direction:column; gap:6px; }
        .acc-item{
          width:100%;
          display:flex;
          align-items:center;
          gap:10px;
          padding:10px 10px;
          border-radius: 12px;
          background: transparent;
          border: 1px solid transparent;
          color: rgba(255,255,255,0.75);
          cursor:pointer;
          transition: background .2s, border-color .2s, color .2s;
          font-family: 'Sora', sans-serif;
          font-size: 13px;
          font-weight: 500;
          text-align:left;
        }
        .acc-item:hover{
          background: rgba(255,255,255,0.06);
          border-color: rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.92);
        }

        .acc-danger:hover{
          background: rgba(255, 80, 80, 0.12);
          border-color: rgba(255, 80, 80, 0.22);
          color: rgba(255, 160, 160, 0.95);
        }

        .acc-item:disabled{
          opacity:0.55;
          cursor:not-allowed;
        }
        .acc-right{
          margin-left:auto;
          opacity:0.55;
        }
      `}</style>

      <div className="acc-wrap">
        <button
          ref={btnRef}
          className="acc-btn"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
        >
          <div className="acc-avatar" aria-hidden="true">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" />
            ) : (
              <span className="acc-initials">{initialsFromName(name)}</span>
            )}
          </div>

          {!compact && (
            <div className="acc-meta">
              <div className="acc-name">{name}</div>
              {/* <div className="acc-email">{email}</div> */}
            </div>
          )}

          <ChevronDown size={16} className="acc-right" />
        </button>

        {open && (
          <div ref={menuRef} className="acc-menu" role="menu">
            <div className="acc-head">
              <div className="acc-avatar" aria-hidden="true" style={{ width: 30, height: 30 }}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" />
                ) : (
                  <span className="acc-initials">{initialsFromName(name)}</span>
                )}
              </div>
              <div className="acc-meta">
                <div className="acc-name">{name}</div>
                <div className="acc-email">{email}</div>
              </div>
            </div>

            <div className="acc-items">
              <button
                className="acc-item"
                onClick={() => {
                  setOpen(false);
                  navigate("/home/profile");
                }}
                role="menuitem"
              >
                <User size={16} />
                Profile
              </button>

              <button
                className="acc-item"
                onClick={() => {
                  setOpen(false);
                  navigate("/settings");
                }}
                role="menuitem"
              >
                <Settings size={16} />
                Settings
              </button>

              <button
                className="acc-item acc-danger"
                onClick={handleLogout}
                disabled={isPending}
                role="menuitem"
              >
                <LogOut size={16} />
                {isPending ? "Logging out…" : "Logout"}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}