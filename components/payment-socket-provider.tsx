'use client';

import { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { WS_BASE_URL } from '../lib/http';
import type { PaymentStatus } from '../lib/services/payments.service';

type PaymentSocketContextValue = {
  subscribe: (paymentId: string, listener: (payment: PaymentStatus) => void) => () => void;
};

const PaymentSocketContext = createContext<PaymentSocketContextValue | null>(null);

export function PaymentSocketProvider({ children }: { children: React.ReactNode }) {
  const socketRef = useRef<Socket | null>(null);
  const listenersRef = useRef(new Map<string, Set<(payment: PaymentStatus) => void>>());

  useEffect(() => {
    console.log('[PaymentSocket] connecting', {
      url: `${WS_BASE_URL}/payments`,
      transports: ['websocket'],
      withCredentials: true,
    });

    const socket = io(`${WS_BASE_URL}/payments`, {
      withCredentials: true,
      autoConnect: true,
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[PaymentSocket] connected', {
        socketId: socket.id,
        transport: socket.io.engine.transport.name,
      });
    });
    socket.on('connect_error', (error) => {
      const details = error as Error & {
        description?: unknown;
        context?: unknown;
      };
      console.warn('[PaymentSocket] connection error', {
        message: details.message,
        description: details.description,
        context: details.context,
      });
    });
    socket.on('disconnect', (reason) => {
      console.warn('[PaymentSocket] disconnected', { reason });
    });
    socket.on('payment:updated', (payment: PaymentStatus) => {
      console.log('[PaymentSocket] payment updated', {
        paymentId: payment.paymentId,
        status: payment.status,
      });
      listenersRef.current.get(payment.paymentId)?.forEach((listener) => listener(payment));
    });
    return () => {
      console.log('[PaymentSocket] disconnecting');
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const value = useMemo<PaymentSocketContextValue>(
    () => ({
      subscribe(paymentId, listener) {
        const listeners = listenersRef.current.get(paymentId) ?? new Set();
        listeners.add(listener);
        listenersRef.current.set(paymentId, listeners);
        console.log('[PaymentSocket] subscribing', { paymentId });
        socketRef.current?.emit('payment:subscribe', { paymentId });
        return () => {
          listeners.delete(listener);
          if (!listeners.size) listenersRef.current.delete(paymentId);
          console.log('[PaymentSocket] unsubscribed', { paymentId });
        };
      },
    }),
    [],
  );

  return <PaymentSocketContext.Provider value={value}>{children}</PaymentSocketContext.Provider>;
}

export function usePaymentSocket(paymentId: string, listener: (payment: PaymentStatus) => void) {
  const context = useContext(PaymentSocketContext);
  useEffect(() => {
    if (!context || !paymentId) return undefined;
    return context.subscribe(paymentId, listener);
  }, [context, paymentId, listener]);
}
