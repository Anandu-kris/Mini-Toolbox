import { Outlet } from "react-router-dom";
import Footer from "@/components/Footer";

export default function HomeLayout() {
  return (
    <div className="min-h-dvh flex flex-col">
      <main className="min-h-[calc(100dvh-200px)] mb-10">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
