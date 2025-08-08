import { requireAuth } from '@/lib/auth';
import Nav from '@/components/nav';

export default async function LeadsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();
  
  return (
    <>
      <Nav user={user} />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </>
  );
}