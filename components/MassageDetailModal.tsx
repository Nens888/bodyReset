'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useBookingModal } from '@/context/BookingModalProvider';

type Massage = {
  id: string;
  title: string;
  description: string;
  duration: number;
  price: number;
  original_price?: number | null;
  zones?: string[] | null;
};

type MassageDetailModalProps = {
  massage: Massage | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function MassageDetailModal({ massage, open, onOpenChange }: MassageDetailModalProps) {
  const { openModal } = useBookingModal();

  if (!massage) return null;

  const isDiscounted = massage.original_price && massage.original_price > massage.price;
  const discountPercentage = isDiscounted
    ? Math.round(((massage.original_price! - massage.price) / massage.original_price!) * 100)
    : 0;

  const handleBook = () => {
    onOpenChange(false);
    openModal(massage.id);
  };

  const zoneLabels: { [key: string]: string } = {
    'head': 'Голова',
    'neck': 'Шея',
    'shoulders': 'Плечи',
    'back': 'Спина',
    'arms': 'Руки',
    'hands': 'Кисти',
    'legs': 'Ноги',
    'feet': 'Стопы',
    'abdomen': 'Живот',
    'chest': 'Грудь',
    'full_body': 'Все тело',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <DialogTitle className="text-2xl font-semibold pr-4">{massage.title}</DialogTitle>
            {isDiscounted && (
              <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                -{discountPercentage}%
              </span>
            )}
          </div>
          <DialogDescription className="text-base pt-2">
            {massage.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Price and Duration */}
          <div className="flex items-center justify-between border-t border-b border-neutral-200 py-4">
            <div className="flex flex-col">
              <span className="text-sm text-neutral-500">Длительность</span>
              <span className="text-lg font-medium mt-1">{massage.duration} минут</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-sm text-neutral-500">Цена</span>
              <div className="flex items-baseline gap-2 mt-1">
                {isDiscounted && (
                  <span className="text-neutral-400 line-through text-lg">
                    {massage.original_price} ₽
                  </span>
                )}
                <span className="text-2xl font-semibold">{massage.price} ₽</span>
              </div>
            </div>
          </div>

          {/* Zones */}
          {massage.zones && massage.zones.length > 0 && (
            <div className="border-t border-neutral-200 pt-4">
              <span className="text-sm font-medium text-neutral-700 mb-3 block">Зоны массажа:</span>
              <div className="flex flex-wrap gap-2">
                {massage.zones.map((zone) => (
                  <span
                    key={zone}
                    className="px-3 py-1.5 bg-neutral-100 text-neutral-700 rounded-full text-sm font-medium"
                  >
                    {zoneLabels[zone] || zone}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Additional Info Section */}
          <div className="border-t border-neutral-200 pt-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-500">Длительность сеанса</span>
              <span className="font-medium">{massage.duration} минут</span>
            </div>
            {isDiscounted && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-500">Скидка</span>
                <span className="font-medium text-red-500">-{discountPercentage}%</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 border-t border-neutral-200 pt-4">
          <Button
            onClick={handleBook}
            className="flex-1 rounded-full bg-neutral-900 text-white hover:bg-neutral-800 py-3 text-base font-medium"
          >
            Записаться
          </Button>
          <Button
            onClick={() => onOpenChange(false)}
            variant="outline"
            className="rounded-full border border-neutral-200 py-3 px-6 font-medium hover:bg-neutral-50"
          >
            Закрыть
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

