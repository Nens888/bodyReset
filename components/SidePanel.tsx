"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Home,
  Calendar,
  Sparkles,
  Settings,
  LogOut,
  Menu,
  Star,
} from "lucide-react";
import { useBookingModal } from "@/context/BookingModalProvider";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function SidePanel() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { openModal } = useBookingModal();

  const handleNavigate = (path: string) => {
    router.push(path);
    setOpen(false);
  };

  const handleOpenBooking = () => {
    openModal();
    setOpen(false);
  };
  
  const handleLogout = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.refresh();
    setOpen(false);
  };


  return (
    <>
      {/* Button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed right-6 top-6 z-[99] rounded-full bg-neutral-900 p-3 text-white shadow-lg hover:bg-neutral-800 transition"
      >
        <Menu size={18} />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[98] bg-black/30 backdrop-blur-sm"
        />
      )}

      {/* Panel */}
      <aside
        className={`fixed right-0 top-0 z-[100] h-full w-[340px] bg-white shadow-2xl transition-transform duration-300 ease-out
        ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex h-full flex-col p-8">
          {/* Header */}
          <div className="mb-10">
            <div className="text-lg font-semibold tracking-tight">
              Body <span className="text-violet-500">Reset</span>
            </div>
            <p className="mt-1 text-sm text-neutral-500">
              Персональный массаж
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex flex-col gap-2">
            <NavItem onClick={() => handleNavigate("/")} icon={<Home size={18} />} label="Главная" />
            <NavItem onClick={() => handleNavigate("/massages")} icon={<Sparkles size={18} />} label="Массажи" />
            <NavItem onClick={handleOpenBooking} icon={<Calendar size={18} />} label="Запись" />
            <NavItem onClick={() => handleNavigate("/reviews")} icon={<Star size={18} />} label="Отзывы" />

            <div className="my-6 h-px bg-neutral-200" />

            <NavItem
              onClick={() => handleNavigate("/admin/dashboard")}
              icon={<Settings size={18} />}
              label="Админ-панель"
              highlight
            />
            <NavItem
              onClick={handleLogout}
              icon={<LogOut size={18} />}
              label="Выйти"
              danger
            />
          </nav>
        </div>
      </aside>
    </>
  );
}

function NavItem({
  icon,
  label,
  highlight,
  danger,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  highlight?: boolean;
  danger?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition
        ${
          danger
            ? "text-red-500 hover:bg-red-50"
            : highlight
            ? "bg-neutral-900 text-white hover:bg-neutral-800"
            : "text-neutral-700 hover:bg-neutral-100"
        }
      `}
    >
      {icon}
      {label}
    </button>
  );
}
