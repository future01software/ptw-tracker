'use client';

import { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';

export default function SignaturePad({ onSave, onCancel, title }: {
    onSave: (url: string) => void;
    onCancel: () => void;
    title: string;
}) {
    const sigCanvas = useRef<SignatureCanvas>(null);
    const [isEmpty, setIsEmpty] = useState(true);

    const clear = () => {
        sigCanvas.current?.clear();
        setIsEmpty(true);
    };

    const save = () => {
        if (sigCanvas.current?.isEmpty()) return;
        const dataUrl = sigCanvas.current?.getTrimmedCanvas().toDataURL('image/png');
        if (dataUrl) {
            onSave(dataUrl);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px'
        }}>
            <div style={{
                background: 'white',
                padding: '24px',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '500px',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
            }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: '#1a202c' }}>
                    {title}
                </h3>

                <div style={{
                    border: '2px dashed #e2e8f0',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    background: '#f8fafc'
                }}>
                    <SignatureCanvas
                        ref={sigCanvas}
                        penColor="#1a202c"
                        canvasProps={{
                            style: { width: '100%', height: '200px' }
                        }}
                        onBegin={() => setIsEmpty(false)}
                    />
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button
                        onClick={onCancel}
                        style={{
                            padding: '10px 16px',
                            background: '#f1f5f9',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            color: '#64748b',
                            fontWeight: '600'
                        }}
                    >
                        İptal
                    </button>
                    <button
                        onClick={clear}
                        style={{
                            padding: '10px 16px',
                            background: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            color: '#64748b',
                            fontWeight: '600'
                        }}
                    >
                        Temizle
                    </button>
                    <button
                        onClick={save}
                        disabled={isEmpty}
                        style={{
                            padding: '10px 16px',
                            background: '#667eea',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            opacity: isEmpty ? 0.5 : 1
                        }}
                    >
                        Kaydet
                    </button>
                </div>
            </div>
        </div>
    );
}
