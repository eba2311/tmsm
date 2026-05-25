import { Globe } from 'lucide-react';
import useI18n from '../lib/i18n';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useI18n();

  return (
    <button
      onClick={() => setLanguage(language === 'en' ? 'am' : 'en')}
      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
      title={language === 'en' ? 'Switch to Amharic' : 'Switch to English'}
    >
      <Globe className="w-4 h-4" />
      <span className="text-sm font-medium">{language === 'en' ? 'EN' : 'አማ'}</span>
    </button>
  );
}
