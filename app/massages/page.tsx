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

export default function MassagesPage() {
  const [massages, setMassages] = useState<Massage[]>([]);
  const [selectedMassage, setSelectedMassage] = useState<Massage | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { openModal } = useBookingModal();

  useEffect(() => {
    async function fetchMassages() {
      try {
        const response = await fetch('/api/massages');
        if (response.ok) {
          setMassages(await response.json());
        }
      } catch (error) {
        console.error('Failed to fetch massages:', error);
      }
    }
    fetchMassages();
  }, []);

  return (
    <main className="min-h-screen bg-white text-neutral-900">
      {/* Using a simplified header for this page */}
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

      <section className="mx-auto max-w-7xl px-8 py-20">
        <div className="mb-16 max-w-2xl">
          <h1 className="text-4xl font-semibold tracking-tight">
            Виды массажа
          </h1>
          <p className="mt-4 text-lg text-neutral-500">
            Каждая процедура — это индивидуальный подход и внимательная работа с вашим телом для достижения наилучшего результата.
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
                  className="mt-10 w-full rounded-full border border-primary bg-primary text-primary-foreground py-3 text-sm font-medium transition hover:bg-primary/90"
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
