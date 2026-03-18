import { Navigate, Outlet } from "react-router-dom";
import { useCurrentUser } from "@/hooks/useAuth";
import { OrbitLoader } from "../ui/Loader";

export function ProtectedRoute() {
  const { data, isLoading } = useCurrentUser();

  if (isLoading) {
    return <OrbitLoader />;
  }

  if (!data) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
