import type { ReactNode } from 'react';

interface ScrollableBookingListProps {
  children: ReactNode;
}

export function ScrollableBookingList({ children }: ScrollableBookingListProps) {
  return <div className="mt-8 min-h-[32rem] max-h-[70vh] overflow-y-auto pr-1">{children}</div>;
}
