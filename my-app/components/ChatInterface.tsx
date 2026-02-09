'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Send, Bot, X, Calculator, Truck, HelpCircle, MapPin, Settings, 
  Phone, Globe, Zap, Box, Anchor, Navigation, Star, Bell, Shield, LogOut, Trash2, CheckCircle2, MessageCircle 
} from 'lucide-react';

const API_URL = 'https://transporter-app-with-chatbot.onrender.com';

// --- 1. SABİT VERİLER ---
const PRICING_RULES = {
  base_prices: {
    kurtarici: { name: "Oto Kurtarma", open: 2000, unit: 45, unit_name: "KM" },
    vinc: { name: "Vinç Hizmeti", open: 5500, unit: 250, unit_name: "Saat" },
    nakliye: { name: "Yurtiçi Nakliye", open: 2500, unit: 50, unit_name: "KM" },
    yurt_disi: { name: "Yurt Dışı Nakliye", open: 15000, unit: 150, unit_name: "KM" },
    seyyar_sarj: { name: "Mobil Şarj", open: 800, unit: 30, unit_name: "kWh" },
    sarj_istasyonu: { name: "Şarj İstasyonu", open: 50, unit: 15, unit_name: "kWh" }
  },
  multipliers: { tier1: 1.25, tier2: 1.0 }
};

const MAIN_MENU_ITEMS = [
  { label: 'Araç Çağır', query: 'menu_order', icon: <Truck size={14}/>, color: 'bg-black text-white border-black' },
  { label: 'Fiyat Hesapla', query: 'menu_price', icon: <Calculator size={14}/>, color: 'bg-white text-gray-700 border-gray-200' },
  { label: 'Nasıl Çalışır?', query: 'menu_help', icon: <HelpCircle size={14}/>, color: 'bg-white text-gray-700 border-gray-200' },
  { label: 'Ayarlar', query: 'menu_settings', icon: <Settings size={14}/>, color: 'bg-white text-gray-700 border-gray-200' }
];

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  uiData?: {
    type: 'selection' | 'input_value' | 'info_card' | 'driver_list' | 'settings_card';
    items?: { label: string; query: string; color?: string; icon?: any }[];
    drivers?: any[]; 
    unit?: string;
    page?: number; 
  };
}

interface ChatInterfaceProps {
  mode: 'widget' | 'fullscreen' | 'page';
  onClose?: () => void;
  contextData?: any; // { userLocation: [lat, lng], drivers: [] }
}

export default function ChatInterface({ mode, onClose, contextData }: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [calcState, setCalcState] = useState<any>({}); 
  const [settingsState, setSettingsState] = useState({ notif: true, privacy: true });

  const [messages, setMessages] = useState<Message[]>([
    { 
      id: 'init-1', 
      role: 'assistant', 
      content: 'Merhaba! Ben **Transporter Asistan**. Size en yakın aracı bulabilir, fiyat hesaplayabilir veya sorularınızı yanıtlayabilirim.', 
    }
  ]);
  
  const [quickActions, setQuickActions] = useState(MAIN_MENU_ITEMS);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { 
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); 
  }, [messages, quickActions]);

  // --- 2. GÖRSEL ETİKETLEME ---
  const renderFormattedText = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\*\*.*?\*\*|Oto Kurtarma|Vinç|Yurtiçi Nakliye|Yurt Dışı Nakliye|Mobil Şarj|Şarj İstasyonu)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) return <strong key={index} className="text-gray-900 font-black">{part.replace(/\*\*/g, '')}</strong>;
      
      // TÜR ETİKETLERİ
      if (part === 'Oto Kurtarma') return <span key={index} className="inline-block bg-red-50 text-red-600 px-1.5 rounded-md font-bold text-[10px] mx-0.5 border border-red-100">Oto Kurtarma</span>;
      if (part === 'Vinç') return <span key={index} className="inline-block bg-red-100 text-red-800 px-1.5 rounded-md font-bold text-[10px] mx-0.5 border border-red-200">Vinç</span>;
      if (part === 'Yurtiçi Nakliye') return <span key={index} className="inline-block bg-purple-50 text-purple-600 px-1.5 rounded-md font-bold text-[10px] mx-0.5 border border-purple-100">Yurtiçi Nakliye</span>;
      if (part === 'Yurt Dışı Nakliye') return <span key={index} className="inline-block bg-indigo-50 text-indigo-600 px-1.5 rounded-md font-bold text-[10px] mx-0.5 border border-indigo-100">Yurt Dışı Nakliye</span>;
      if (part === 'Mobil Şarj') return <span key={index} className="inline-block bg-cyan-50 text-cyan-600 px-1.5 rounded-md font-bold text-[10px] mx-0.5 border border-cyan-100">Mobil Şarj</span>;
      if (part === 'Şarj İstasyonu') return <span key={index} className="inline-block bg-blue-50 text-blue-600 px-1.5 rounded-md font-bold text-[10px] mx-0.5 border border-blue-100">Şarj İstasyonu</span>;

      if (part.includes('TL') || part.includes('₺')) return <span key={index} className="text-green-600 font-black">{part}</span>;
      return <span key={index} className="text-gray-600 font-medium">{part}</span>;
    });
  };

  // --- 3. DOĞRUDAN API ARAMA FONKSİYONU (STRICT FILTER) ---
  const performDirectSearch = async (type: string, label: string) => {
    setIsLoading(true);
    setQuickActions([]); 

    const lat = contextData?.userLocation?.[0] || 38.4237;
    const lng = contextData?.userLocation?.[1] || 27.1428;

    try {
        const response = await fetch(`${API_URL}/users/nearby?lat=${lat}&lng=${lng}&type=${type}`);
        const data = await response.json();

        if (Array.isArray(data) && data.length > 0) {
            // 🔥 KRİTİK DÜZELTME: Backend bazen karışık gönderse bile Client tarafında süzüyoruz.
            // Sadece istenen 'type' ile eşleşenleri al.
            const strictFilteredData = data.filter((d: any) => d.serviceType === type);

            if (strictFilteredData.length > 0) {
                addBotMessage(`Bölgenizdeki **${label}** hizmet sağlayıcıları listelendi:`, {
                    type: 'driver_list',
                    drivers: strictFilteredData,
                    page: 1
                });
            } else {
                // Eğer filtreleme sonrası boş kalırsa
                addBotMessage(`Bölgenizde **${label}** bulunamadı, ancak diğer hizmet sağlayıcıları mevcut.`, {
                    type: 'selection',
                    items: [{ label: 'Ana Menü', query: 'main_menu' }]
                });
            }
        } else {
            addBotMessage(`Üzgünüm, şu an bölgenizde aktif **${label}** bulunamadı.`, {
                type: 'selection',
                items: [{ label: 'Ana Menü', query: 'main_menu' }]
            });
        }
    } catch (e) {
        addBotMessage("Bağlantı hatası oluştu. Lütfen tekrar deneyin.", null);
    } finally {
        setIsLoading(false);
    }
  };

  // --- 4. MESAJ YÖNETİMİ ---
  const handleSend = async (text: string, isHiddenCommand = false) => {
    if (!text || !text.trim()) return;

    let displayContent = text;
    if (text.startsWith('CMD_SEARCH_')) {
        const typeMap:any = { 
            kurtarici: 'Oto Kurtarma Ara', 
            vinc: 'Vinç Ara', 
            nakliye: 'Nakliye Ara', 
            yurt_disi: 'Yurt Dışı Lojistik Ara', 
            seyyar_sarj: 'Mobil Şarj Ara',
            sarj_istasyonu: 'Şarj İstasyonu Ara'
        };
        const key = text.replace('CMD_SEARCH_', '');
        displayContent = typeMap[key] || 'Araç Ara';
    }

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: displayContent };
    setMessages(prev => [...prev, userMsg]);
    if (!isHiddenCommand) setInput('');
    setIsLoading(true);
    setQuickActions([]); 

    // 🔥 ARAMA KOMUTLARI 🔥
    if (text.startsWith('CMD_SEARCH_')) {
        const type = text.replace('CMD_SEARCH_', '');
        let label = "Araç";
        if(type === 'kurtarici') label = "Oto Kurtarma";
        if(type === 'vinc') label = "Vinç";
        if(type === 'nakliye') label = "Yurtiçi Nakliye";
        if(type === 'yurt_disi') label = "Yurt Dışı Nakliye";
        if(type === 'seyyar_sarj') label = "Mobil Şarj";
        if(type === 'sarj_istasyonu') label = "Şarj İstasyonu";

        await performDirectSearch(type, label);
        return; 
    }

    // --- FRONTEND AKIŞLARI ---

    if (text === 'menu_help') {
       setTimeout(() => {
         addBotMessage('', {
            type: 'info_card', 
            items: [{ label: 'Ana Menü', query: 'main_menu', color: 'bg-black text-white' }]
         });
         setIsLoading(false);
       }, 500);
       return;
    }

    if (text === 'menu_settings') {
        setTimeout(() => {
            addBotMessage('Ayarlarınızı buradan yönetebilirsiniz:', {
               type: 'settings_card', 
               items: [{ label: '🔙 Ana Menü', query: 'main_menu' }]
            });
            setIsLoading(false);
        }, 400);
        return;
    }

    if (text === 'menu_order') {
       setTimeout(() => {
         addBotMessage('Hangi hizmete ihtiyacınız var?', {
            type: 'selection',
            items: [
              { label: 'Oto Kurtarma', query: 'CMD_SEARCH_kurtarici', color: 'bg-red-50 text-red-600 border-red-100', icon: <Truck size={14}/> },
              { label: 'Vinç', query: 'CMD_SEARCH_vinc', color: 'bg-red-100 text-red-800 border-red-200', icon: <Anchor size={14}/> },
              { label: 'Yurtiçi Nakliye', query: 'CMD_SEARCH_nakliye', color: 'bg-purple-50 text-purple-600 border-purple-100', icon: <Box size={14}/> },
              { label: 'Yurt Dışı Lojistik', query: 'CMD_SEARCH_yurt_disi', color: 'bg-indigo-50 text-indigo-600 border-indigo-100', icon: <Globe size={14}/> },
              { label: 'Mobil Şarj', query: 'CMD_SEARCH_seyyar_sarj', color: 'bg-cyan-50 text-cyan-600 border-cyan-100', icon: <Zap size={14}/> },
              { label: 'Şarj İstasyonu', query: 'CMD_SEARCH_sarj_istasyonu', color: 'bg-blue-50 text-blue-600 border-blue-100', icon: <MapPin size={14}/> }, 
              { label: '🔙 Geri', query: 'main_menu' }
            ]
         });
         setIsLoading(false);
       }, 400);
       return;
    }

    // FİYAT HESAPLAMA
    if (text === 'menu_price') {
        setTimeout(() => {
            addBotMessage('Fiyat hesaplaması için hizmet türünü seçiniz:', {
                type: 'selection',
                items: [
                    { label: 'Oto Kurtarma', query: 'calc_step_1_kurtarici', color: 'bg-red-50 text-red-600' },
                    { label: 'Vinç', query: 'calc_step_1_vinc', color: 'bg-red-50 text-red-800' },
                    { label: 'Yurtiçi Nakliye', query: 'calc_step_1_nakliye', color: 'bg-purple-50 text-purple-600' },
                    { label: 'Yurt Dışı', query: 'calc_step_1_yurt_disi', color: 'bg-indigo-50 text-indigo-600' },
                    { label: 'Mobil Şarj', query: 'calc_step_1_seyyar_sarj', color: 'bg-blue-50 text-blue-600' },
                    { label: 'Şarj İstasyonu', query: 'calc_step_1_sarj_istasyonu', color: 'bg-blue-100 text-blue-700' },
                    { label: '🔙 Geri', query: 'main_menu' }
                ]
            });
            setIsLoading(false);
        }, 400);
        return;
    }

    // HESAPLAMA ADIM 1
    if (text.startsWith('calc_step_1_')) {
        const type = text.replace('calc_step_1_', '');
        setCalcState({ ...calcState, type }); 
        setTimeout(() => {
            addBotMessage('Hizmetin alınacağı bölgeyi seçiniz:', {
                type: 'selection',
                items: [
                    { label: 'İstanbul', query: `calc_step_2_istanbul`, color: 'bg-gray-50' },
                    { label: 'Ankara', query: `calc_step_2_ankara`, color: 'bg-gray-50' },
                    { label: 'İzmir', query: `calc_step_2_izmir`, color: 'bg-gray-50' },
                    { label: 'Diğer İller', query: `calc_step_2_diger`, color: 'bg-gray-50' },
                    { label: '🔙 Geri', query: 'menu_price' }
                ]
            });
            setIsLoading(false);
        }, 400);
        return;
    }

    if (text.startsWith('calc_step_2_')) {
        const city = text.replace('calc_step_2_', '');
        setCalcState((prev: any) => ({ ...prev, city }));
        const typeInfo = PRICING_RULES.base_prices[calcState.type as keyof typeof PRICING_RULES.base_prices];
        setTimeout(() => {
            addBotMessage(`Tahmini mesafe/miktar (${typeInfo?.unit_name}) bilgisini giriniz:`, {
                type: 'input_value',
                unit: typeInfo?.unit_name
            });
            setIsLoading(false);
        }, 400);
        return;
    }

    if (!isNaN(parseFloat(text)) && calcState.type) {
        calculateAndShowPrice(parseFloat(text));
        return;
    }

    if (text === 'main_menu') {
        setTimeout(() => { addBotMessage('Ana menüye dönüldü.', null); setQuickActions(MAIN_MENU_ITEMS); setIsLoading(false); }, 300);
        return;
    }

    // --- D. AI (SOHBET) ---
    try {
      const cleanHistory = messages.filter(m => !m.content.includes('menu_') && !m.content.includes('CMD_') && !m.content.includes('calc_')).map(m => ({ role: m.role, content: m.content }));

      const systemContext = `
        SEN TRANSPORTER ASİSTANISIN.
        GÖREV: Kullanıcıya profesyonelce yardımcı olmak.
        NOT: Eğer kullanıcı araç aramak istiyorsa menüleri kullanmasını söyle.
        Eğer kullanıcı "oto kurtarıcı bul", "vinç bul" gibi direktif verirse JSON dönme, sadece menüye yönlendir.
      `;

      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          context: systemContext,
          history: cleanHistory
        })
      });

      const data = await response.json();
      const rawResponse = data.response || "Şu an yanıt veremiyorum.";
      addBotMessage(rawResponse, null); 

    } catch (error) {
      addBotMessage("Bağlantı kurulamadı.", null);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateAndShowPrice = (val: number) => {
      const { type, city } = calcState;
      const rules = PRICING_RULES.base_prices[type as keyof typeof PRICING_RULES.base_prices];
      if(!rules) { setIsLoading(false); return; }
      let multiplier = 1.0;
      if (['istanbul', 'ankara', 'izmir'].includes(city)) multiplier = PRICING_RULES.multipliers.tier1;
      const total = (rules.open + (rules.unit * val)) * multiplier;
      const formattedTotal = total.toLocaleString('tr-TR', { maximumFractionDigits: 0 });

      setTimeout(() => {
          addBotMessage(`**HESAPLAMA SONUCU:**\n${rules.name} (${city.toUpperCase()})\nTahmini Tutar: **${formattedTotal} TL**`, {
              type: 'selection',
              items: [{ label: 'Bu Aracı Çağır', query: 'menu_order', color: 'bg-green-600 text-white' }, { label: 'Ana Menü', query: 'main_menu' }]
          });
          setCalcState({});
          setIsLoading(false);
      }, 600);
  };

  const addBotMessage = (text: string, uiData: any) => {
    const botMsg: Message = { id: Date.now().toString(), role: 'assistant', content: text, uiData: uiData };
    setMessages(prev => [...prev, botMsg]);
    if (uiData?.type === 'selection' && uiData.items) setQuickActions(uiData.items);
    else if (uiData?.type === 'input_value') setQuickActions([]); 
    else setQuickActions(MAIN_MENU_ITEMS);
  };

  const handleLoadMore = (msgId: string) => {
      setMessages(prev => prev.map(msg => {
          if (msg.id === msgId && msg.uiData?.type === 'driver_list') {
              return { ...msg, uiData: { ...msg.uiData, page: (msg.uiData.page || 1) + 1 } };
          }
          return msg;
      }));
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white px-5 py-4 border-b border-gray-100 flex justify-between items-center shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="bg-black text-white p-2.5 rounded-xl shadow-lg shadow-black/20"><Bot className="w-5 h-5" /></div>
          <div><h3 className="font-black text-gray-900 text-sm">Transporter AI</h3><p className="text-[10px] text-green-600 font-bold">Asistan</p></div>
        </div>
        {onClose && <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" strokeWidth={2.5} /></button>}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2 duration-300`}>
            {msg.uiData?.type === 'info_card' ? (
                <div className="bg-white border border-gray-100 p-5 rounded-[1.5rem] shadow-sm max-w-[95%]">
                    <h4 className="font-black text-gray-900 uppercase text-xs mb-4 flex items-center gap-2"><Navigation size={16} className="text-blue-600"/> Kullanım Rehberi</h4>
                    <ul className="space-y-4">
                        <li className="flex items-start gap-3"><div className="bg-red-50 text-red-600 p-2 rounded-xl shrink-0"><MapPin size={16}/></div><div><h5 className="text-[10px] font-black text-gray-900 uppercase">1. Konum & Araç</h5><p className="text-[9px] text-gray-500 font-medium">Sistem konumunuzu algılar. İhtiyacınıza uygun aracı seçersiniz.</p></div></li>
                        <li className="flex items-start gap-3"><div className="bg-green-50 text-green-600 p-2 rounded-xl shrink-0"><Phone size={16}/></div><div><h5 className="text-[10px] font-black text-gray-900 uppercase">2. Hızlı İletişim</h5><p className="text-[9px] text-gray-500 font-medium">En yakın sürücüyü haritada görüp tek tıkla arayabilir veya mesajlaşabilirsiniz.</p></div></li>
                    </ul>
                </div>
            ) : msg.uiData?.type === 'settings_card' ? (
                <div className="bg-white border border-gray-100 p-4 rounded-[1.5rem] shadow-sm w-full max-w-[90%]">
                    <h4 className="font-black text-gray-900 uppercase text-xs mb-3 flex items-center gap-2"><Settings size={14}/> Hızlı Ayarlar</h4>
                    <div className="space-y-2">
                        <div onClick={() => setSettingsState(p => ({...p, notif: !p.notif}))} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl cursor-pointer active:scale-95 transition-all"><span className="text-[10px] font-bold text-gray-600 flex items-center gap-2"><Bell size={12}/> Bildirimler</span><span className={`text-[9px] font-black ${settingsState.notif ? 'text-green-600' : 'text-gray-400'}`}>{settingsState.notif ? 'AÇIK' : 'KAPALI'}</span></div>
                        <div onClick={() => setSettingsState(p => ({...p, privacy: !p.privacy}))} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl cursor-pointer active:scale-95 transition-all"><span className="text-[10px] font-bold text-gray-600 flex items-center gap-2"><Shield size={12}/> Gizlilik</span><span className={`text-[9px] font-black ${settingsState.privacy ? 'text-green-600' : 'text-gray-400'}`}>{settingsState.privacy ? 'AKTİF' : 'PASİF'}</span></div>
                        <div onClick={() => confirm("Hesabınızı silmek istediğinize emin misiniz?") && alert("Talep alındı.")} className="flex items-center justify-between p-2.5 bg-red-50 rounded-xl cursor-pointer active:scale-95 transition-all border border-red-100"><span className="text-[10px] font-bold text-red-600 flex items-center gap-2"><Trash2 size={12}/> Hesabımı Sil</span></div>
                        <div onClick={() => window.location.reload()} className="flex items-center justify-between p-2.5 bg-gray-100 rounded-xl cursor-pointer active:scale-95 transition-all"><span className="text-[10px] font-bold text-gray-600 flex items-center gap-2"><LogOut size={12}/> Çıkış Yap</span></div>
                    </div>
                </div>
            ) : msg.uiData?.type === 'driver_list' ? (
                <div className="w-full space-y-3">
                    <div className="bg-white p-3 rounded-2xl rounded-bl-none shadow-sm text-xs font-medium text-gray-700 border border-gray-100">{msg.content}</div>
                    {msg.uiData.drivers && msg.uiData.drivers.length > 0 ? (
                        <>
                            {msg.uiData.drivers.slice(0, (msg.uiData.page || 1) * 5).map((driver: any, idx: number) => (
                                <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center animate-in zoom-in-95 hover:border-gray-300 transition-colors">
                                    <div>
                                        <h5 className="font-black text-gray-900 text-xs uppercase flex items-center gap-2">{driver.firstName} {driver.rating >= 4.8 && <CheckCircle2 size={10} className="text-blue-500" />}</h5>
                                        <div className="flex items-center gap-2 mt-1.5"><span className="bg-green-50 text-green-700 px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-1"><Star size={8} fill="currentColor"/> {driver.rating || 5.0}</span><span className="text-[9px] text-gray-400 font-bold flex items-center gap-1"><MapPin size={8}/> {driver.city || 'Merkez'}</span></div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => window.open(`https://wa.me/${driver.phoneNumber?.replace(/\D/g,'')}`)} className="bg-green-500 text-white p-2.5 rounded-xl active:scale-95 transition-transform shadow-lg"><MessageCircle size={16} /></button>
                                        <button onClick={() => window.open(`tel:${driver.phoneNumber}`)} className="bg-black text-white p-2.5 rounded-xl active:scale-95 transition-transform shadow-lg"><Phone size={16} /></button>
                                        <button onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${driver.location?.coordinates?.[1] || 0},${driver.location?.coordinates?.[0] || 0}`)} className="bg-blue-600 text-white p-2.5 rounded-xl active:scale-95 transition-transform shadow-lg"><MapPin size={16} /></button>
                                    </div>
                                </div>
                            ))}
                            {msg.uiData.drivers.length > (msg.uiData.page || 1) * 5 && (
                                <button onClick={() => handleLoadMore(msg.id)} className="w-full py-2 bg-gray-50 text-gray-500 text-[10px] font-black rounded-xl hover:bg-gray-100 transition-colors uppercase">Daha Fazla Göster</button>
                            )}
                        </>
                    ) : <div className="text-center p-4 bg-gray-50 rounded-xl text-[10px] text-gray-400 font-bold">Üzgünüm, şu an yakında müsait araç bulunamadı.</div>}
                </div>
            ) : (
                <div className={`max-w-[85%] px-5 py-3.5 rounded-2xl text-xs font-medium leading-relaxed shadow-sm whitespace-pre-wrap ${msg.role === 'user' ? 'bg-black text-white rounded-br-none shadow-black/10' : 'bg-white text-gray-700 border border-gray-100 rounded-bl-none shadow-gray-200/50'}`}>{renderFormattedText(msg.content)}</div>
            )}
            {msg.uiData?.type === 'input_value' && (
              <form onSubmit={(e) => { e.preventDefault(); const val = (e.target as any).elements.val.value; if(val) handleSend(val); }} className="mt-2 w-full max-w-[85%] flex gap-2">
                <input name="val" type="number" placeholder={`Miktar (${msg.uiData?.unit})`} className="flex-1 bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none" autoFocus />
                <button type="submit" className="bg-green-600 text-white px-4 rounded-xl font-bold shadow-lg"><Send className="w-4 h-4" /></button>
              </form>
            )}
          </div>
        ))}
        {isLoading && <div className="p-4 text-xs text-gray-400 font-bold animate-pulse">Yazıyor...</div>}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white border-t border-gray-100 shrink-0 safe-area-pb">
        {quickActions.length > 0 && !isLoading && (
          <div className="px-4 pt-3 pb-1 flex gap-2 overflow-x-auto scrollbar-hide">
            {quickActions.map((action, idx) => (
              <button key={idx} onClick={() => handleSend(action.query, true)} className={`whitespace-nowrap flex items-center gap-2 px-4 py-2.5 rounded-full text-[10px] font-black transition-all border shadow-sm active:scale-95 ${ (action as any).color ? (action as any).color : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50' }`}>{(action as any).icon} {action.label}</button>
            ))}
          </div>
        )}
        <div className="p-4 pt-2">
          <form onSubmit={(e) => { e.preventDefault(); handleSend(input); }} className="flex items-center gap-2 bg-gray-50 p-1.5 pl-4 rounded-2xl border border-gray-100 focus-within:border-black/10 focus-within:bg-white focus-within:shadow-md transition-all">
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Bir mesaj yazın..." disabled={isLoading} className="flex-1 bg-transparent text-xs font-bold outline-none text-gray-900 placeholder:text-gray-400" />
            <button type="submit" disabled={!input.trim() || isLoading} className="p-2.5 bg-black text-white rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-95"><Send className="w-4 h-4" /></button>
          </form>
        </div>
      </div>
    </div>
  );
}