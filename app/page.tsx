'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useBookingModal } from '@/context/BookingModalProvider';
import { MassageDetailModal } from '@/components/MassageDetailModal';
import { ChatWidget } from '@/components/ChatWidget';

type Massage = {
  id: string;
  title: string;
  description: string;
  duration: number;
  price: number;
  original_price?: number | null;
  zones?: string[] | null;
};

// Function to truncate description
const truncateDescription = (text: string, maxLength: number = 100): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
};

export default function HomePage() {
  const [massages, setMassages] = useState<Massage[]>([]);
  const [selectedMassage, setSelectedMassage] = useState<Massage | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { openModal } = useBookingModal();

  useEffect(() => {
    async function fetchMassages() {
      try {
        const response = await fetch('/api/massages');
        if (response.ok) {
          const data = await response.json();
          setMassages(data.slice(0, 3)); // Show only 3 on the landing page
        }
      } catch (error) {
        console.error('Failed to fetch massages:', error);
      }
    }
    fetchMassages();
  }, []);

  return (
    <main className="min-h-screen bg-white text-neutral-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-neutral-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-5">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            Body <span className="text-violet-500">Reset</span>
          </Link>

          <Button onClick={() => openModal()} className="rounded-full bg-neutral-900 px-5 py-2 text-sm font-medium text-white hover:bg-neutral-800 transition">
            Записаться
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative mx-auto max-w-7xl px-8 pt-32 pb-40">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          <div className="flex-1 max-w-3xl">
            <h1 className="text-5xl sm:text-6xl font-semibold leading-[1.05] tracking-tight">
              Перезагрузка тела
              <br />
              <span className="bg-gradient-to-r from-violet-500 to-indigo-500 bg-clip-text text-transparent">
                без лишних слов
              </span>
            </h1>

            <p className="mt-8 max-w-xl text-lg text-neutral-500">
              Персональный массаж для тех, кто ценит тишину, качество и результат.
              Работа с телом в спокойном, осознанном формате.
            </p>

            <div className="mt-12 flex gap-4">
              <Button onClick={() => openModal()} size="lg" className="rounded-full bg-neutral-900 px-8 py-3 text-white font-medium hover:bg-neutral-800 transition">
                Записаться
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full border border-neutral-200 px-8 py-3 font-medium text-neutral-700 hover:bg-neutral-50 transition">
                <Link href="/massages">Виды массажа</Link>
              </Button>
            </div>
          </div>
          
          {/* Abstract Image */}
          <div className="flex-1 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-md lg:max-w-lg">
              <img 
                src="/massage-hero.svg" 
                alt="Abstract massage illustration" 
                className="w-full h-auto opacity-90"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Massages */}
      <section className="mx-auto max-w-7xl px-8 pb-40">
        <div className="mb-16 max-w-xl">
          <h2 className="text-3xl font-semibold tracking-tight">
            Массажи
          </h2>
          <p className="mt-4 text-neutral-500">
            Каждая процедура — индивидуальный подход и внимательная работа с телом.
          </p>
        </div>

        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {massages.map((item) => {
            const isDiscounted = item.original_price && item.original_price > item.price;
            const discountPercentage = isDiscounted
              ? Math.round(((item.original_price! - item.price) / item.original_price!) * 100)
              : 0;

            return (
              <div
                key={item.id}
                onClick={() => {
                  setSelectedMassage(item);
                  setIsModalOpen(true);
                }}
                className="group flex flex-col rounded-3xl bg-neutral-50 p-8 transition hover:bg-white hover:shadow-xl relative cursor-pointer"
              >
                {isDiscounted && (
                  <span className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    -{discountPercentage}%
                  </span>
                )}
                <h3 className="text-xl font-medium tracking-tight">
                  {item.title}
                </h3>
                <div className="mt-3 text-neutral-500 flex-grow">
                  <p>
                    {truncateDescription(item.description, 100)}
                  </p>
                  {item.description.length > 100 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMassage(item);
                        setIsModalOpen(true);
                      }}
                      className="mt-2 text-sm font-medium text-violet-600 hover:text-violet-700 transition"
                    >
                      Читать полностью
                    </button>
                  )}
                </div>

                <div className="mt-8 flex items-center justify-between text-sm">
                  <span className="text-neutral-400">{item.duration} мин</span>
                  <div className="flex items-baseline gap-2">
                    {isDiscounted && (
                      <span className="text-neutral-400 line-through">
                        {item.original_price} ₽
                      </span>
                    )}
                    <span className="font-medium">{item.price} ₽</span>
                  </div>
                </div>

                <Button 
                  onClick={(e) => {
                    e.stopPropagation();
                    openModal();
                  }} 
                  className="mt-10 w-full rounded-full border border-neutral-200 py-3 text-sm font-medium hover:bg-neutral-100 transition"
                >
                  Записаться
                </Button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-100 py-10 text-sm text-neutral-400">
        <div className="mx-auto max-w-7xl px-8">
          © {new Date().getFullYear()} Body Reset
        </div>
      </footer>

      {/* Massage Detail Modal */}
      <MassageDetailModal
        massage={selectedMassage}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />

      {/* Chat Widget */}
      <ChatWidget />
    </main>
  );
}
