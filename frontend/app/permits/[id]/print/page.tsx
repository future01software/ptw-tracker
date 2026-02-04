'use client';
import { use, useEffect, useState } from 'react';
import { permitsApi } from '@/lib/api';
import { Loader2 } from 'lucide-react';

export default function PrintPermitPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [permit, setPermit] = useState<any>(null);

    useEffect(() => {
        permitsApi.getById(id).then(res => setPermit(res.data));
        permitsApi.getGasTests(id).then(res => setGasTests(res.data || [])).catch(() => { });
    }, [id]);

    const [gasTests, setGasTests] = useState<any[]>([]);

    if (!permit) return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin w-8 h-8" /></div>;

    // Parse JSON fields safely
    const parseJSON = (str: string | null) => {
        try {
            return str ? JSON.parse(str) : [];
        } catch {
            return [];
        }
    };

    const personnel = parseJSON(permit.personnelList);
    const hazards = parseJSON(permit.selectedHazards);
    const precautions = parseJSON(permit.selectedPrecautions);
    const ppe = parseJSON(permit.selectedPPE);
    const workTypes = parseJSON(permit.workTypes);

    // Layout Helper
    const CheckBox = ({ checked, label }: { checked: boolean; label: string }) => (
        <div className="flex items-center gap-1">
            <div className={`w-4 h-4 border border-black flex items-center justify-center text-[10px]`}>
                {checked ? 'X' : ''}
            </div>
            <span className="text-[10px] whitespace-nowrap">{label}</span>
        </div>
    );

    return (
        <div className="bg-white text-black font-sans p-8 max-w-[210mm] mx-auto print:p-0 print:max-w-none">
            {/* Header */}
            <div className="border-2 border-black">
                <div className="flex items-center border-b-2 border-black">
                    <div className="w-1/4 p-4 border-r-2 border-black flex flex-col items-center justify-center">
                        {/* AssanPort Logo */}
                        <img src="/assanport-logo.png" alt="AssanPort" className="h-12 object-contain" />
                    </div>
                    <div className="w-2/4 border-r-2 border-black py-4 flex items-center justify-center">
                        <h2 className="text-2xl font-black">ÇALIŞMA İZİN FORMU</h2>
                    </div>
                    <div className="w-1/4 text-[10px]">
                        <div className="border-b border-black p-1 flex justify-between">
                            <strong>Rapor No:</strong> <span>{permit.permitNumber}</span>
                        </div>
                        <div className="border-b border-black p-1 flex justify-between">
                            <strong>Tarih:</strong> <span>{new Date(permit.createdAt).toLocaleDateString('tr-TR')}</span>
                        </div>
                        <div className="border-b border-black p-1 flex justify-between">
                            <strong>Firma / Departman:</strong> <span>{permit.workEntity}</span>
                        </div>
                    </div>
                </div>

                {/* Hidden - Work Entity moved to header */}

                {/* Description */}
                <div className="border-b-2 border-black p-2 text-xs">
                    <strong>İşin Tanımı:</strong> {permit.description}
                    <br />
                    <strong>Çalışılacak Bölge:</strong> {permit.locationName}
                    <br />
                    <strong>Firma Adı:</strong> {permit.contractorName}
                </div>

                {/* Agreement Text */}
                <div className="border-b-2 border-black p-2 text-[9px] text-justify leading-tight italic">
                    Çalışma izin formunda bulunan tüm gereklilikleri sağlayacağımı, çalışma sırasında İş Sağlığı ve Güvenliği ile ilgili tüm kural ve talimatlara uyacağımı, iş kazası, ramak kala ve maddi hasarlı kaza yaşandığı takdirde ilgili dökümantasyon için AssanPort yetkililerine bilgi vereceğimi, ortaya çıkan tüm atıkları ilgili atık kutularına atmadan işi sonlandırmayacağımı taahhüt ederim.
                </div>

                {/* Personnel Grid - 3x3 */}
                <div className="border-b-2 border-black">
                    <div className="bg-slate-100 print:bg-transparent border-b border-black p-1 text-[10px] font-bold text-center">
                        Çalışmayı Yapacak Personel İsimleri
                    </div>
                    <div className="grid grid-cols-3 text-[10px]">
                        {[...Array(9)].map((_, i) => (
                            <div key={i} className={`p-2 border-b border-r border-black h-8 flex items-center ${i >= 6 ? 'border-b-0' : ''} ${(i + 1) % 3 === 0 ? 'border-r-0' : ''}`}>
                                <span className="mr-2 font-bold">({i + 1})</span>
                                {personnel[i]?.name || ''}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Work Types */}
                <div className="border-b-2 border-black p-2 flex flex-wrap gap-4 justify-center text-[10px]">
                    <strong>Çalışma Şekli:</strong>
                    {['Sahada', 'Gemide', 'Yüksekte', 'Binada', 'Ateşli', 'Altyapıda', 'Kapalı Mekanda', 'Gece'].map(type => (
                        <CheckBox key={type} checked={workTypes.includes(type)} label={type} />
                    ))}
                </div>

                {/* Hazards / Precautions / PPE Columns */}
                <div className="grid grid-cols-3 border-b-2 border-black text-[9px]">
                    {/* Hazards */}
                    <div className="border-r-2 border-black">
                        <div className="bg-slate-200 print:bg-slate-300 p-1 font-bold text-center border-b border-black">ÇALIŞMA ALANINDAKİ TEHLİKELER</div>
                        <div className="p-2 space-y-1">
                            {[
                                'Basınçlı Sıvı yada Gaz', 'Zehirli Madde', 'Elektrik Çarpması', 'Düşme Tehlikesi',
                                'Sıcak Madde', 'Alev Alıcı Madde', 'Yangın,parlama,patlama', 'Radyasyon',
                                'Makine Kaynaklı Kıvılcım', 'Açık Alev', 'Takılma,kayma', 'Kötü Hava Koşulları',
                                'Yüksek Gerilim', 'Yüksek Ses', 'İnşaat Çalışması'
                            ].map(h => (
                                <CheckBox key={h} checked={hazards.includes(h)} label={h} />
                            ))}
                            {permit.otherHazards && (
                                <div className="mt-2 border-t border-black pt-1 text-[9px] italic">
                                    <strong>Diğer:</strong> {permit.otherHazards}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Precautions */}
                    <div className="border-r-2 border-black">
                        <div className="bg-slate-200 print:bg-slate-300 p-1 font-bold text-center border-b border-black">ALINMASI GEREKEN TEDBİRLER</div>
                        <div className="p-2 space-y-1">
                            {[
                                'Havalandırma', 'Harici Aydınlatma', 'Basınç Düşürülmesi', 'Gözlemci Bulundurulması',
                                'Yangın Söndürücü', 'Yangın Battaniyesi', 'İşbaşı Toplantısı', 'Çalışma Sahasının Islak Tutulması',
                                'Yanıcı Maddelerin Uzaklaştırılması', 'Ex-Proof Tesisat', 'İzolasyon', 'Bariyer Kullanılması',
                                'Anti-Statik İş Elbisesi', 'Güç Kilitleme'
                            ].map(p => (
                                <CheckBox key={p} checked={precautions.includes(p)} label={p} />
                            ))}
                            {permit.otherPrecautions && (
                                <div className="mt-2 border-t border-black pt-1 text-[9px] italic">
                                    <strong>Diğer:</strong> {permit.otherPrecautions}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* PPE */}
                    <div>
                        <div className="bg-slate-200 print:bg-slate-300 p-1 font-bold text-center border-b border-black">KİŞİSEL KORUYUCULAR</div>
                        <div className="p-2 space-y-1">
                            {[
                                'Göz Koruyucusu', 'Kulak Koruyucusu', 'Yüz Maskesi', 'Kimyasal Koruyucu Elbise',
                                'Paraşüt Tip Emniyet Kemeri', 'Baret', 'Toz Maskesi', 'Can Yeleği', 'Eldiven',
                                'Sıcağa Karşı Koruma', 'Reflektif Yelek', 'İş Ayakkabısı', 'Tulum (İş Elbisesi)',
                                'Kaynakçı Başlığı', 'Duman Maskesi', 'Tozluk / Kolluk'
                            ].map(p => (
                                <CheckBox key={p} checked={ppe.includes(p)} label={p} />
                            ))}
                            {permit.otherPPE && (
                                <div className="mt-2 border-t border-black pt-1 text-[9px] italic">
                                    <strong>Diğer:</strong> {permit.otherPPE}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Warning Banner */}
                <div className="border-b-2 border-black p-2 text-center text-xs font-bold bg-slate-100 print:bg-transparent">
                    *Liman içinde elektronik hız denetleme sistemi uygulanmaktadır. Ana yol 30 km, ara yol 20 km, rıhtımlar 10 km dir. Hız sınırını aşanlara cezai yaptırım uygulanacaktır.
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-2 text-[10px]">
                    <div className="border-r-2 border-black p-2 h-20">
                        <strong>Yetkili / İmza:</strong>
                        <br /><br />
                        <span>{permit.contractorName} Yetkilisi</span>
                    </div>
                    <div className="p-2 h-20">
                        <strong>Yetkili / İmza:</strong>
                        <br /><br />
                        <span>{permit.createdBy?.fullName} (İzin Veren)</span>
                    </div>
                </div>

                {/* Gas Test Table Placeholder */}
                <div className="border-t-2 border-black">
                    <div className="text-center font-bold text-[10px] bg-slate-100 border-b border-black">Çalışma Sahası Gaz Testi (Gas Test Results)</div>
                    <table className="w-full text-[10px] text-center">
                        <thead>
                            <tr className="border-b border-black">
                                <th className="border-r border-black p-1">Saat</th>
                                <th className="border-r border-black p-1">Oksijen</th>
                                <th className="border-r border-black p-1">Karbondioksit</th>
                                <th className="border-r border-black p-1">Yanıcı LEL</th>
                                <th className="border-r border-black p-1">Zehirleyici</th>
                                <th className="p-1">CO</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[...Array(Math.max(3, gasTests.length))].map((_, i) => {
                                const test = gasTests[i];
                                return (
                                    <tr key={i} className="border-b border-black last:border-0 h-6">
                                        <td className="border-r border-black">{test?.testTime || ''}</td>
                                        <td className="border-r border-black">{test?.oxygen || ''}</td>
                                        <td className="border-r border-black">{test?.co2 || ''}</td>
                                        <td className="border-r border-black">{test?.lel || ''}</td>
                                        <td className="border-r border-black">{test?.toxic || ''}</td>
                                        <td>{test?.co || ''}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

            </div>

            <div className="mt-4 flex justify-end gap-2 print:hidden">
                <button onClick={() => window.print()} className="bg-blue-600 text-white px-4 py-2 rounded font-bold">Yazdır / PDF (Print)</button>
            </div>
        </div>
    );
}
