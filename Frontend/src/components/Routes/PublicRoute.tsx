import { Navigate, Outlet } from "react-router-dom";
import { useCurrentUser } from "@/hooks/useAuth";

export function PublicRoute() {
  const { data, isLoading } = useCurrentUser();

  if (isLoading) {
    return <div className="p-10 text-center">Checking session…</div>;
  }

  if (data) {
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
}
