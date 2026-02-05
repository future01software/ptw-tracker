'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usersApi } from '@/lib/api';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const user = usersApi.getCurrentUser();
    if (user) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [router]);

  return null;
}
