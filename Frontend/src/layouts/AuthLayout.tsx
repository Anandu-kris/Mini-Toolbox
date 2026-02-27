import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <>
      <main className="min-h-[calc(100dvh-69px)] grid place-items-center mt-6 p-4">
        <Outlet />
      </main>
    </>
  );
}
