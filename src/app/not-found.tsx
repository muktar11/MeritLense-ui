import Link from 'next/link';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-gray-200">404</h1>
        <h2 className="text-3xl font-semibold text-gray-900 mt-4">Not fonund</h2>
        <p className="text-gray-600 mt-2 mb-8">the page you are looking for does not exist.</p>
        <Button asChild>
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            back to home
          </Link>
        </Button>
      </div>
    </div>
  );
}
