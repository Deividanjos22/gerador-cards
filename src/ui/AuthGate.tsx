import { useEffect, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth';
import { auth } from '../firebase';

const MARKETING_EMAIL = 'marketingbaratao@gmail.com';

function LoginScreen({ message }: { message?: string }) {
  const [email, setEmail] = useState(MARKETING_EMAIL);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(message ?? '');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      if (credential.user.email?.toLowerCase() !== MARKETING_EMAIL) {
        await signOut(auth);
        setError('Esta conta não tem acesso ao Gerador de Cards.');
      }
    } catch (error) {
      const code = error instanceof Error && 'code' in error ? String(error.code) : '';
      if (code.includes('user-not-found')) {
        setError('Esta conta ainda não foi criada no Firebase.');
      } else if (code.includes('wrong-password') || code.includes('invalid-credential')) {
        setError('A senha está incorreta para esta conta.');
      } else if (code.includes('invalid-email')) {
        setError('Informe um e-mail válido.');
      } else {
        setError('Não foi possível entrar. Verifique a conta e a senha.');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-screen">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Gerador de Cards</h1>
        <p>Acesso exclusivo para o marketing.</p>
        {error && <div className="auth-error">{error}</div>}
        <label>
          E-mail
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
        <label>
          Senha
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        </label>
        <button type="submit" disabled={busy}>{busy ? 'Entrando...' : 'Acessar Gerador'}</button>
      </form>
    </main>
  );
}

export function AuthGate({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);

  useEffect(() => onAuthStateChanged(auth, (currentUser) => {
    if (currentUser?.email?.toLowerCase() === MARKETING_EMAIL) {
      setUser(currentUser);
      setDenied(false);
    } else {
      setUser(null);
      setDenied(Boolean(currentUser));
      if (currentUser) void signOut(auth);
    }
    setLoading(false);
  }), []);

  if (loading) return <main className="auth-screen"><p>Validando acesso...</p></main>;
  if (!user) return <LoginScreen message={denied ? 'Use a conta marketingbaratao@gmail.com para acessar.' : undefined} />;
  return children;
}
