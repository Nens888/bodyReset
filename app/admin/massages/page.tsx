'use client';

import { useState, useEffect } from 'react';
import { PlusCircle, MoreHorizontal } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type Massage = {
  id: string;
  title: string;
  description: string;
  duration: number;
  price: number;
  original_price?: number | null;
  zones?: string[] | null;
};

function MassageFormDialog({
  massage,
  onFormSubmit,
  children,
}: {
  massage?: Massage | null;
  onFormSubmit: () => void;
  children: React.ReactNode;
}) {
  const availableZones = [
    { value: 'head', label: 'Голова' },
    { value: 'neck', label: 'Шея' },
    { value: 'shoulders', label: 'Плечи' },
    { value: 'back', label: 'Спина' },
    { value: 'arms', label: 'Руки' },
    { value: 'hands', label: 'Кисти' },
    { value: 'legs', label: 'Ноги' },
    { value: 'feet', label: 'Стопы' },
    { value: 'abdomen', label: 'Живот' },
    { value: 'chest', label: 'Грудь' },
    { value: 'full_body', label: 'Все тело' },
  ];

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(massage?.title || '');
  const [description, setDescription] = useState(massage?.description || '');
  const [duration, setDuration] = useState(massage?.duration.toString() || '');
  const [price, setPrice] = useState(massage?.price.toString() || '');
  const [originalPrice, setOriginalPrice] = useState(massage?.original_price?.toString() || '');
  const [selectedZones, setSelectedZones] = useState<string[]>(massage?.zones || []);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(massage?.title || '');
      setDescription(massage?.description || '');
      setDuration(massage?.duration.toString() || '');
      setPrice(massage?.price.toString() || '');
      setOriginalPrice(massage?.original_price?.toString() || '');
      setSelectedZones(massage?.zones || []);
    }
  }, [open, massage]);

  const toggleZone = (zone: string) => {
    setSelectedZones(prev => 
      prev.includes(zone) 
        ? prev.filter(z => z !== zone)
        : [...prev, zone]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const isEditing = !!massage;
    const url = isEditing ? `/api/massages/${massage.id}` : '/api/massages';
    const method = isEditing ? 'PATCH' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            title, 
            description, 
            duration: Number(duration), 
            price: Number(price),
            original_price: originalPrice ? Number(originalPrice) : null,
            zones: selectedZones.length > 0 ? selectedZones : null
        }),
      });

      if (!response.ok) throw new Error(`Failed to ${isEditing ? 'update' : 'create'} massage`);
      
      onFormSubmit();
      setOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{massage ? 'Редактировать массаж' : 'Новый массаж'}</DialogTitle>
          <DialogDescription>
            {massage ? 'Внесите изменения и сохраните.' : 'Добавьте новый вид массажа, который будет доступен для записи.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Название</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Описание</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
           <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="duration">Длительность (мин)</Label>
                    <Input id="duration" type="number" value={duration} onChange={(e) => setDuration(e.target.value)} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="price">Цена (₽)</Label>
                    <Input id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
                </div>
            </div>
            <div className="grid gap-2">
                <Label htmlFor="original_price">Исходная цена (для скидки, ₽)</Label>
                <Input id="original_price" type="number" value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value)} placeholder="Оставьте пустым, если нет скидки" />
            </div>
            <div className="grid gap-2">
                <Label>Зоны массажа</Label>
                <div className="flex flex-wrap gap-2 p-3 border rounded-md min-h-[80px]">
                  {availableZones.map((zone) => (
                    <button
                      key={zone.value}
                      type="button"
                      onClick={() => toggleZone(zone.value)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                        selectedZones.includes(zone.value)
                          ? 'bg-neutral-900 text-white hover:bg-neutral-800'
                          : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                      }`}
                    >
                      {zone.label}
                    </button>
                  ))}
                </div>
                {selectedZones.length > 0 && (
                  <p className="text-xs text-neutral-500">Выбрано: {selectedZones.length}</p>
                )}
            </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">Отмена</Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function MassagesPage() {
  const [massages, setMassages] = useState<Massage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMassages = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/massages');
      if (!response.ok) throw new Error('Failed to fetch massages');
      const data = await response.json();
      setMassages(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMassages();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот массаж?')) return;

    try {
      const response = await fetch(`/api/massages/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete massage');
      fetchMassages(); // Refresh list
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="flex flex-col sm:gap-4 sm:py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Массажи</h1>
        <MassageFormDialog onFormSubmit={fetchMassages}>
            <Button size="sm" className="h-8 gap-1 bg-primary text-primary-foreground hover:bg-primary/90">
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Добавить массаж
              </span>
            </Button>
        </MassageFormDialog>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Список массажей</CardTitle>
          <CardDescription>Управление видами массажа, доступными для записи.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead className="hidden md:table-cell">Цена</TableHead>
                <TableHead className="hidden md:table-cell">Исходная цена</TableHead>
                <TableHead className="hidden md:table-cell">Длительность</TableHead>
                <TableHead><span className="sr-only">Действия</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center">Загрузка...</TableCell></TableRow>
              ) : massages.length > 0 ? (
                massages.map((massage) => (
                  <TableRow key={massage.id}>
                    <TableCell className="font-medium">{massage.title}</TableCell>
                    <TableCell className="hidden md:table-cell">{massage.price} ₽</TableCell>
                    <TableCell className="hidden md:table-cell">{massage.original_price ? `${massage.original_price} ₽` : '-'}</TableCell>
                    <TableCell className="hidden md:table-cell">{massage.duration} мин</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Действия</DropdownMenuLabel>
                           <MassageFormDialog massage={massage} onFormSubmit={fetchMassages}>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                Редактировать
                              </DropdownMenuItem>
                            </MassageFormDialog>
                          <DropdownMenuItem onClick={() => handleDelete(massage.id)}>Удалить</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                 <TableRow><TableCell colSpan={5} className="text-center">Вы еще не добавили ни одного массажа.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
