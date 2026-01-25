
'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

type BookingModalContextType = {
  isOpen: boolean;
  preselectedMassageId: string | null;
  openModal: (massageId?: string) => void;
  closeModal: () => void;
};

const BookingModalContext = createContext<BookingModalContextType | undefined>(
  undefined
);

export function BookingModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [preselectedMassageId, setPreselectedMassageId] = useState<string | null>(null);

  const openModal = (massageId?: string) => {
    setPreselectedMassageId(massageId || null);
    setIsOpen(true);
  };
  
  const closeModal = () => {
    setIsOpen(false);
    setPreselectedMassageId(null);
  };

  return (
    <BookingModalContext.Provider value={{ isOpen, preselectedMassageId, openModal, closeModal }}>
      {children}
    </BookingModalContext.Provider>
  );
}

export function useBookingModal() {
  const context = useContext(BookingModalContext);
  if (context === undefined) {
    throw new Error('useBookingModal must be used within a BookingModalProvider');
  }
  return context;
}
