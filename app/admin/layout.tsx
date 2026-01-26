'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bell,
  Home,
  LineChart,
  Package,
  Package2,
  ShoppingCart,
  Users,
  LogOut,
  FileText,
  DollarSign,
  MessageSquare,
  Settings,
  Star,
} from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login' || pathname === '/admin/login/';

  const menuItems = [
    {
      href: '/admin/dashboard',
      label: 'Панель управления',
      icon: Home,
    },
    {
      href: '/admin/requests',
      label: 'Заявки',
      icon: FileText,
    },
    {
      href: '/admin/massages',
      label: 'Массажи',
      icon: Package,
    },
    {
      href: '/admin/reviews',
      label: 'Отзывы',
      icon: Star,
    },
    {
      href: '/admin/earnings',
      label: 'Заработок',
      icon: DollarSign,
    },
    {
      href: '/admin/chat',
      label: 'Чат',
      icon: MessageSquare,
    },
    {
      href: '/admin/settings',
      label: 'Настройки',
      icon: Settings,
    },
  ];

  return (
    isLoginPage ? (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 to-white">
        {children}
      </div>
    ) : (
      <div className="grid min-h-screen w-full md:grid-cols-[240px_1fr] lg:grid-cols-[280px_1fr]">
        <div className="hidden border-r bg-gradient-to-b from-white to-neutral-50/50 md:block shadow-sm">
          <div className="flex h-full max-h-screen flex-col gap-2">
            <div className="flex h-16 items-center border-b border-neutral-200/50 px-4 lg:px-6 bg-white/50 backdrop-blur-sm">
              <Link
                href="/admin/dashboard"
                className="flex items-center gap-2.5 font-semibold group"
              >
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 shadow-md group-hover:shadow-lg transition-shadow">
                  <Package2 className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                  Body Reset
                </span>
              </Link>
            </div>
            <div className="flex-1 px-3 py-4">
              <nav className="grid items-start gap-1.5">
                {menuItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-md shadow-violet-500/25'
                          : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                      }`}
                    >
                      <item.icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-neutral-500'}`} />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
            <div className="mt-auto p-4 border-t border-neutral-200/50">
              <Link
                href="/admin/login"
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-600 transition-all hover:text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Выйти
              </Link>
            </div>
          </div>
        </div>
        <div className="flex flex-col bg-gradient-to-br from-neutral-50 to-white">
          <header className="flex h-16 items-center gap-4 border-b border-neutral-200/50 bg-white/80 backdrop-blur-sm px-4 lg:px-6 shadow-sm">
            <div className="w-full flex-1">
              <h2 className="text-lg font-semibold text-neutral-900">
                {pathname === '/admin/dashboard' && 'Панель управления'}
                {pathname === '/admin/requests' && 'Заявки'}
                {pathname === '/admin/massages' && 'Массажи'}
                {pathname === '/admin/reviews' && 'Отзывы'}
                {pathname === '/admin/earnings' && 'Заработок'}
                {pathname === '/admin/chat' && 'Чат'}
                {pathname === '/admin/settings' && 'Настройки'}
              </h2>
            </div>
          </header>
          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    )
  );
}
