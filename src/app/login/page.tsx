'use client';

import { useState, useEffect, Suspense } from 'react';
import { auth, db, googleProvider, storage } from '@/lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function LoginContent() {
  const [isLogin, setIsLogin] = useState(true);
  const [userRole, setUserRole] = useState<'client' | 'restaurant'>('client');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const role = searchParams.get('role');
    const mode = searchParams.get('mode');
    
    if (role === 'restaurant') setUserRole('restaurant');
    if (role === 'client') setUserRole('client');
    if (mode === 'signup') setIsLogin(false);
  }, [searchParams]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const restRef = doc(db, 'restaurants', user.uid);
        const restSnap = await getDoc(restRef);
        
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (restSnap.exists()) {
          router.push('/admin');
        } else if (userSnap.exists()) {
          router.push('/');
        } else {
          router.push('/');
        }
      } else {
        let formattedWhatsapp = '';
        if (userRole === 'restaurant') {
          const digitsOnly = whatsapp.replace(/\D/g, '');
          if (digitsOnly.length !== 11) {
            alert('O WhatsApp do restaurante deve ter 11 dígitos (DDD + número).');
            setLoading(false);
            return;
          }
          formattedWhatsapp = '55' + digitsOnly;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await updateProfile(user, { displayName: name });

        if (userRole === 'restaurant') {
          const slug = name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
          
          let logoUrl = '';
          if (logoFile) {
            const storageRef = ref(storage, `restaurants/${user.uid}/logo_${Date.now()}`);
            await uploadBytes(storageRef, logoFile);
            logoUrl = await getDownloadURL(storageRef);
          }

          await setDoc(doc(db, 'restaurants', user.uid), {
            id: user.uid,
            name: name,
            email: email,
            whatsapp: formattedWhatsapp,
            slug: slug,
            logoUrl: logoUrl,
            role: 'restaurant',
            createdAt: serverTimestamp(),
          });
          router.push('/admin');
        } else {
          await setDoc(doc(db, 'users', user.uid), {
            id: user.uid,
            name: name,
            email: email,
            role: 'client',
            createdAt: serverTimestamp(),
          });
          router.push('/');
        }
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error("Auth error:", error);
      alert('Erro na autenticação: ' + message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      if (!isLogin && userRole === 'restaurant' && !whatsapp) {
        alert('Por favor, preencha o WhatsApp do restaurante antes de continuar com o Google.');
        setLoading(false);
        return;
      }

      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const restRef = doc(db, 'restaurants', user.uid);
      const restSnap = await getDoc(restRef);
      
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (isLogin) {
        if (restSnap.exists()) {
          router.push('/admin');
        } else if (userSnap.exists()) {
          router.push('/');
        } else {
          await setDoc(userRef, {
            id: user.uid,
            name: user.displayName || 'Usuário Google',
            email: user.email,
            role: 'client',
            createdAt: serverTimestamp(),
          });
          router.push('/');
        }
      } else {
        if (userRole === 'restaurant') {
          if (!restSnap.exists()) {
            const digitsOnly = whatsapp.replace(/\D/g, '');
            const formattedWhatsapp = '55' + digitsOnly;
            const slug = (name || user.displayName || 'restaurante').toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
            
            let logoUrl = '';
            if (logoFile) {
              const storageRef = ref(storage, `restaurants/${user.uid}/logo_${Date.now()}`);
              await uploadBytes(storageRef, logoFile);
              logoUrl = await getDownloadURL(storageRef);
            } else if (user.photoURL) {
              // Usar foto do Google como fallback inicial
              logoUrl = user.photoURL;
            }

            await setDoc(restRef, {
              id: user.uid,
              name: name || user.displayName,
              email: user.email,
              whatsapp: formattedWhatsapp,
              slug: slug,
              logoUrl: logoUrl,
              role: 'restaurant',
              createdAt: serverTimestamp(),
            });
          }
          router.push('/admin');
        } else {
          if (!userSnap.exists()) {
            await setDoc(userRef, {
              id: user.uid,
              name: name || user.displayName,
              email: user.email,
              role: 'client',
              createdAt: serverTimestamp(),
            });
          }
          router.push('/');
        }
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error("Google Login error:", error);
      alert('Erro na autenticação com Google: ' + message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800/50 backdrop-blur-xl p-8 rounded-3xl border border-slate-700 shadow-2xl">
        <div className="text-center mb-8">
          <Link href="/">
            <img 
              src="/tanamao_512.png" 
              alt="Logo" 
              className="h-20 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(249,115,22,0.4)] hover:scale-105 transition-transform" 
            />
          </Link>
          <h1 className="text-3xl font-black text-white italic">
            {isLogin ? 'Bem-vindo' : 'Criar Conta'}
          </h1>
          
          {!isLogin && (
            <div className="flex bg-slate-900/50 p-1 rounded-xl mt-6 border border-slate-700/50">
              <button 
                onClick={() => setUserRole('client')}
                className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${userRole === 'client' ? 'bg-orange-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Sou Cliente
              </button>
              <button 
                onClick={() => setUserRole('restaurant')}
                className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${userRole === 'restaurant' ? 'bg-orange-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Sou Restaurante
              </button>
            </div>
          )}
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
                {userRole === 'restaurant' ? 'Nome do Restaurante' : 'Seu Nome Completo'}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-600 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                placeholder={userRole === 'restaurant' ? "Ex: Pizzaria do João" : "Seu nome"}
                required
              />
            </div>
          )}

          {!isLogin && userRole === 'restaurant' && (
            <>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Logo do Restaurante (Opcional)</label>
                <div className="flex items-center gap-4 bg-slate-900/50 border border-slate-700 rounded-xl p-3">
                  <div className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center border border-slate-700 overflow-hidden shrink-0">
                    {logoFile ? (
                      <img src={URL.createObjectURL(logoFile)} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl">📸</span>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                    className="text-xs text-slate-400 file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:bg-orange-500 file:text-white hover:file:bg-orange-600 transition-all cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">WhatsApp para Pedidos</label>
                  <span className="text-[9px] text-orange-500 font-bold uppercase tracking-widest">(Obrigatório mesmo com Google)</span>
                </div>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, '').slice(0, 11))}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-600 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                  placeholder="DDD + Número (ex: 11999999999)"
                  required
                />
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-600 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
              placeholder="seu@email.com"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-600 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-orange-500/20 active:scale-[0.98] disabled:opacity-50 mt-4"
          >
            {loading ? 'Processando...' : (isLogin ? 'Entrar Agora' : 'Finalizar Cadastro')}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-700/50"></div>
          </div>
          <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
            <span className="bg-[#1e293b] px-4 text-slate-500 rounded-full border border-slate-700/50">Ou use sua conta</span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full bg-slate-900 hover:bg-slate-700 text-white font-bold py-3.5 rounded-xl border border-slate-700 flex items-center justify-center gap-3 transition-all active:scale-[0.98] group"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 48 48"
            className="group-hover:scale-110 transition-transform"
            aria-hidden="true"
          >
            <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.643 32.659 29.253 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.967 3.033l5.657-5.657C34.053 6.053 29.29 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
            <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 16.108 19.003 12 24 12c3.059 0 5.842 1.154 7.967 3.033l5.657-5.657C34.053 6.053 29.29 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
            <path fill="#4CAF50" d="M24 44c5.187 0 9.868-1.987 13.416-5.219l-6.19-5.238C29.162 35.096 26.715 36 24 36c-5.23 0-9.607-3.318-11.267-7.946l-6.518 5.023C9.505 39.556 16.227 44 24 44z"/>
            <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.22-2.282 4.085-4.077 5.543l.003-.002 6.19 5.238C36.981 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
          </svg>
          <span>Entrar com Gmail</span>
        </button>

        <p className="text-center text-slate-400 mt-8 text-sm font-medium">
          {isLogin ? 'Novo por aqui?' : 'Já possui cadastro?'}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-orange-500 font-bold ml-2 hover:underline"
          >
            {isLogin ? 'Criar minha conta' : 'Fazer login'}
          </button>
        </p>

        <div className="mt-8 text-center border-t border-slate-700/30 pt-6">
          <Link href="/" className="text-slate-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-[0.2em]">
            ← Voltar para a vitrine
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin"></div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
