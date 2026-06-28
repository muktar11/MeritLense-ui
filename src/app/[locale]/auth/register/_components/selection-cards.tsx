import { User, Building2 } from "lucide-react";
import { useTranslations, useLocale } from "next-intl"; // ✅ import useLocale
import Link from "next/link";

interface SelectionCardsProps {
  onSelectB2C: () => void;
  onSelectB2B: () => void;
}

export function SelectionCards({ onSelectB2C, onSelectB2B }: SelectionCardsProps) {
  const t = useTranslations('auth_page.register_selection');
  const locale = useLocale(); // ✅ get current locale

  return (
    <div className="w-full max-w-2xl sm:mt-12 mt-20">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {t('header.title')}
        </h1>
        <p className="text-gray-600">
          {t('header.subtitle')}
        </p>
      </div>

      {/* Selection Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* B2C Card */}
        <button
          onClick={onSelectB2C}
          className="bg-white/70 backdrop-blur-md rounded-xl shadow-lg border border-white/20 p-8 hover:shadow-xl transition-all hover:scale-105"
        >
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {t('card_b2c.title')}
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            {t('card_b2c.description')}
          </p>
          <div className="text-blue-600 font-medium">
            {t('card_b2c.cta')} →
          </div>
        </button>

        {/* B2B Card */}
        <button
          onClick={onSelectB2B}
          className="bg-white/70 backdrop-blur-md rounded-xl shadow-lg border border-white/20 p-8 hover:shadow-xl transition-all hover:scale-105"
        >
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-purple-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {t('card_b2b.title')}
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            {t('card_b2b.description')}
          </p>
          <div className="text-purple-600 font-medium">
            {t('card_b2b.cta')} →
          </div>
        </button>
      </div>

      {/* Login Link */}
      <p className="mt-8 text-center text-sm text-gray-600">
        {t('link_login.prefix')}{" "}
        <Link
          href={`/${locale}/auth/login`} // ✅ updated route with current locale
          className="font-medium text-blue-600 hover:text-blue-700"
        >
          {t('link_login.link_text')}
        </Link>
      </p>
    </div>
  );
}
