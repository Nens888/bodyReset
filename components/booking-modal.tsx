
'use client';

import { useState, useEffect } from 'react';
import { useBookingModal } from '@/context/BookingModalProvider';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Massage = {
  id: string;
  title: string;
  duration: number;
  price: number;
};

export function BookingModal() {
  const { isOpen, preselectedMassageId, closeModal } = useBookingModal();
  const [massages, setMassages] = useState<Massage[]>([]);
  const [massageId, setMassageId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [contact, setContact] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setStatus('idle');
      setDate('');
      setTime('');
      setContact('');
      setError('');

      async function fetchMassages() {
        const response = await fetch('/api/massages');
        if (response.ok) {
          const data = await response.json();
          setMassages(data);
          // Set preselected massage if provided
          if (preselectedMassageId) {
            setMassageId(preselectedMassageId);
          } else {
            setMassageId('');
          }
        }
      }
      fetchMassages();
    }
  }, [isOpen, preselectedMassageId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setStatus('submitting');

    if (!massageId || !date || !time || !contact) {
      setError('Пожалуйста, заполните все поля.');
      setStatus('error');
      return;
    }

    const response = await fetch('/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        massage_id: massageId,
        date,
        time,
        contact,
      }),
    });

    if (response.ok) {
      setStatus('success');
    } else {
      const data = await response.json();
      setError(data.error || 'Произошла ошибка при отправке заявки.');
      setStatus('error');
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      closeModal();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        {status === 'success' ? (
           <DialogHeader>
            <DialogTitle className="text-2xl text-center">🎉 Заявка отправлена!</DialogTitle>
            <DialogDescription className="text-center pt-2">
              Спасибо! Я свяжусь с вами в ближайшее время для подтверждения.
            </DialogDescription>
          </DialogHeader>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Запись на массаж</DialogTitle>
              <DialogDescription>
                {preselectedMassageId 
                  ? 'Выберите удобное время. Я свяжусь с вами для подтверждения.'
                  : 'Выберите удобное время и вид массажа. Я свяжусь с вами для подтверждения.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="grid gap-4">
              {preselectedMassageId ? (
                <div className="grid gap-2">
                  <Label>Вид массажа</Label>
                  <div className="px-3 py-2 rounded-md border bg-neutral-50 text-sm font-medium">
                    {massages.find(m => m.id === preselectedMassageId)?.title || 'Загрузка...'}
                  </div>
                </div>
              ) : (
                <div className="grid gap-2">
                  <Label htmlFor="massage">Вид массажа</Label>
                  <Select onValueChange={setMassageId} value={massageId}>
                    <SelectTrigger id="massage">
                      <SelectValue placeholder="Выберите массаж..." />
                    </SelectTrigger>
                    <SelectContent>
                      {massages.map((massage) => (
                        <SelectItem key={massage.id} value={massage.id}>
                          {massage.title} ({massage.duration} мин)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="date">Дата</Label>
                  <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="time">Время</Label>
                  <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contact">Ваш контакт (Telegram, WhatsApp)</Label>
                <Input id="contact" placeholder="@username или номер телефона" value={contact} onChange={(e) => setContact(e.target.value)} />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <DialogFooter className="pt-4">
                 <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={status === 'submitting'}>
                    {status === 'submitting' ? 'Отправка...' : 'Отправить заявку'}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
