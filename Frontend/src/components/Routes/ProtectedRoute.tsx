import { Navigate, Outlet } from "react-router-dom";
import { useCurrentUser } from "@/hooks/useAuth";

export function ProtectedRoute() {
  const { data, isLoading } = useCurrentUser();

  if (isLoading) {
    return <div className="p-10 text-center">Checking session…</div>;
  }

  if (!data) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
