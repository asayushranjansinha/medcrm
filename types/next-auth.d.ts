import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & {
      id: string;
      role: 'ADMIN' | 'MANAGER' | 'MR';
      territory: string | null;
    };
  }

  interface User {
    role: 'ADMIN' | 'MANAGER' | 'MR';
    territory: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: 'ADMIN' | 'MANAGER' | 'MR';
    territory: string | null;
  }
}
