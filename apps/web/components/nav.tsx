'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ApiClient } from '@/lib/api';

interface NavProps {
  user: {
    email: string;
    role: string;
  };
}

export default function Nav({ user }: NavProps) {
  const pathname = usePathname();
  const router = useRouter();
  
  const handleLogout = async () => {
    try {
      await ApiClient.post('/auth/logout');
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };
  
  const links = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/leads', label: 'Leads' },
    { href: '/deals', label: 'Deals' },
    { href: '/companies', label: 'Companies' },
  ];
  
  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-primary-600">Mini CRM</span>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    pathname === link.href
                      ? 'border-primary-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-700">
              {user.email} ({user.role.toLowerCase()})
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}