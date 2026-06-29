'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePlayerStore } from '@/store/usePlayerStore';

export const RouterRegister: React.FC = () => {
  const router = useRouter();
  const { setRouter } = usePlayerStore();

  useEffect(() => {
    setRouter(router);
  }, [router, setRouter]);

  return null;
};
