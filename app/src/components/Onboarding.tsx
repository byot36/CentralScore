import { useLanguage } from '../context/LanguageContext';

export default function Onboarding({ onDone }: { onDone: () => void }) {
  const { t } = useLanguage();

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="bg-[#111827] border border-white/10 rounded-2xl p-6 max-w-sm w-full text-center">
        <div className="flex items-center justify-center gap-2 font-extrabold text-xl tracking-tight text-white mb-4">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#00c853]" />
          Central<span className="text-[#00c853]">Score</span>
        </div>
        <h1 className="text-lg font-bold mb-3">{t('onboarding_title')}</h1>
        <div className="space-y-2 text-sm text-gray-300 text-left mb-6">
          <p className="flex gap-2"><span>⚽</span> {t('onboarding_p1')}</p>
          <p className="flex gap-2"><span>★</span> {t('onboarding_p2')}</p>
          <p className="flex gap-2"><span>🌐</span> {t('onboarding_p3')}</p>
        </div>
        <button
          onClick={onDone}
          className="w-full bg-[#00c853] text-black font-medium py-2.5 rounded-lg"
        >
          {t('onboarding_start')}
        </button>
      </div>
    </div>
  );
}
