import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";

import { LoginForm } from "@/components/LoginForm";
import { SignUpForm } from "@/components/SignUpForm";

import AuthLayout from "@/layouts/AuthLayout";
import AppLayout from "@/layouts/AppLayout";
import HomeLayout from "@/layouts/HomeLayout";

import { PublicRoute } from "@/components/Routes/PublicRoute";
import { ProtectedRoute } from "@/components/Routes/ProtectedRoute";

import Home from "./pages/Home";
import UrlShortenerPage from "./pages/UrlShortnerPage";
import PasswordGeneratorPage from "./pages/PasswordGeneratorPage";
import NotesPage from "./pages/NotesPage";
import PomodoroPage from "./pages/PomodoroPage";
import PassLockPage from "./pages/PassLockPage";
import WordlePage from "./pages/WordlePage";

export default function App() {
  return (
    <>
      <Toaster position="bottom-center" richColors duration={2000} />

      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* PUBLIC ROUTES */}
        <Route element={<PublicRoute />}>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginForm />} />
            <Route path="/signup" element={<SignUpForm />} />
          </Route>
        </Route>

        {/* PROTECTED ROUTES */}
        <Route element={<ProtectedRoute />}>
          <Route path="/home" element={<AppLayout />}>
            <Route element={<HomeLayout />}>
              <Route index element={<Home />} />
            </Route>

            <Route path="url-shortener" element={<UrlShortenerPage />} />
            <Route
              path="password-generator"
              element={<PasswordGeneratorPage />}
            />
            <Route path="notes" element={<NotesPage />} />
            <Route path="pomodoro" element={<PomodoroPage />} />
            <Route path="passlock" element={<PassLockPage />} />
            <Route path="wordle" element={<WordlePage />} />
          </Route>
        </Route>
      </Routes>
    </>
  );
}
