import Link from 'next/link';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Outside the [locale] tree there is no language context, so this page
// speaks both languages.
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-gray-200">404</h1>
        <h2 className="text-3xl font-semibold text-gray-900 mt-4">Page not found</h2>
        <p className="text-gray-600 mt-2">The page you are looking for does not exist.</p>
        <h2 className="text-2xl font-semibold text-gray-900 mt-6" dir="rtl" lang="ar">الصفحة غير موجودة</h2>
        <p className="text-gray-600 mt-2 mb-8" dir="rtl" lang="ar">الصفحة التي تبحث عنها غير موجودة.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/en">
              <Home className="mr-2 h-4 w-4" />
              Back to home
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/ar" lang="ar">
              العودة إلى الصفحة الرئيسية
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
