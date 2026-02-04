'use client';

import { useLanguage } from '@/lib/LanguageContext';

export default function LanguageSwitcher() {
    const { language, setLanguage } = useLanguage();

    return (
        <button
            onClick={() => setLanguage(language === 'tr' ? 'en' : 'tr')}
            style={{
                padding: '8px 16px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px',
                color: '#475569',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = '#e2e8f0';
                e.currentTarget.style.borderColor = '#cbd5e1';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f8fafc';
                e.currentTarget.style.borderColor = '#e2e8f0';
            }}
            title={language === 'tr' ? 'Switch to English' : 'Türkçe\'ye geç'}
        >
            <span style={{ fontSize: '16px' }}>🌐</span>
            <span>{language === 'tr' ? 'TR' : 'EN'}</span>
        </button>
    );
}
