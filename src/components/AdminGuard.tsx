'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Verificar se o usuário tem um documento em 'restaurants'
        const docRef = doc(db, 'restaurants', user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setAuthorized(true);
        } else {
          // Se for o admin mestre (opcional, para você continuar tendo acesso total)
          const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'alexnaguibass@gmail.com';
          if (user.email === ADMIN_EMAIL) {
            setAuthorized(true);
          } else {
            router.push('/login');
          }
        }
      } else {
        router.push('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!authorized) return null;

  return <>{children}</>;
}
