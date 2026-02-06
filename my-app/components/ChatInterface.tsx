'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, X, ChevronRight, RotateCcw, Home } from 'lucide-react';

const API_URL = 'https://transporter-app-with-chatbot.onrender.com';

// --- SABİT VERİLER ---
const TARIFF_DATA = [
  { serviceType: "Nakliye", openingFee: 800, pricePerUnit: 25, unit: "km" },
  { serviceType: "Kurtarıcı (Çekici)", openingFee: 1200, pricePerUnit: 35, unit: "km" },
  { serviceType: "Şarj İstasyonu", openingFee: 50, pricePerUnit: 8, unit: "dk" },
  { serviceType: "Seyyar Şarj", openingFee: 400, pricePerUnit: 15, unit: "dk" }
];

const MAIN_MENU_ITEMS = [
  { label: 'Fiyat Hesapla', query: 'menu_price' },
  { label: 'Araç Çağır', query: 'menu_order' },
  { label: 'Canlı Destek', query: 'Canlı destek istiyorum' },
  { label: 'Tarifeler', query: 'Güncel tarifeleri göster' }
];

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  uiData?: {
    type: 'selection' | 'input_value' | 'info';
    items?: { label: string; query: string }[];
    service?: string;
    unit?: string;
  };
}

interface ChatInterfaceProps {
  mode: 'widget' | 'fullscreen' | 'page';
  onClose?: () => void;
  contextData?: any;
}

export default function ChatInterface({ mode, onClose, contextData }: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: 'init-1', 
      role: 'assistant', 
      content: 'Merhaba! Ben Transporter Asistan. Size nasıl yardımcı olabilirim?', 
    }
  ]);
  
  // Alt kısımdaki hızlı aksiyon butonları
  const [quickActions, setQuickActions] = useState(MAIN_MENU_ITEMS);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, quickActions]); // Butonlar değişince de kaydır

  // --- METİN FORMATLAMA (Renklendirme) ---
  const renderFormattedText = (text: string) => {
    // Markdown benzeri bold (**) yapılarını ve TL fiyatlarını renklendirir
    const parts = text.split(/(\*\*.*?\*\*)/g); // **bold** kısımlarını ayır
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="text-gray-900 font-black">{part.replace(/\*\*/g, '')}</strong>;
      }
      // "1.500 TL" gibi fiyatları yeşil yap
      if (part.includes('TL')) {
         return <span key={index} className="text-gray-800">{part}</span>;
      }
      return <span key={index} className="text-gray-600">{part}</span>;
    });
  };

  // --- API RESPONSE PARSE ---
  const parseApiResponse = (rawText: string): { text: string; uiData?: any } => {
    if (rawText.includes('||DATA||')) {
      const parts = rawText.split('||DATA||');
      const text = parts[0].trim();
      try {
        const jsonStr = parts[1].trim();
        const data = JSON.parse(jsonStr);
        return { text, uiData: data };
      } catch (e) {
        return { text: rawText };
      }
    }
    return { text: rawText };
  };

  // --- MESAJ GÖNDERME ---
  const handleSend = async (text: string, isHiddenCommand = false) => {
    if (!text.trim()) return;

    // 1. Kullanıcı mesajı
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    if (!isHiddenCommand) setInput('');
    setIsLoading(true);
    setQuickActions([]); // Yüklenirken butonları gizle

    // --- ÖZEL MENÜLER (Frontend) ---
    if (text === 'menu_price') {
      setTimeout(() => {
        addBotMessage('Hangi hizmet için fiyat hesaplayalım?', {
          type: 'selection', // Bu tip artık alt barı güncelleyecek
          items: [
            { label: 'Nakliye (Evden Eve)', query: 'Nakliye fiyatı hesapla' },
            { label: 'Ticari (Kamyon)', query: 'Ticari taşıma fiyatı hesapla' },
            { label: 'Kurtarıcı (Çekici)', query: 'Kurtarıcı fiyatı hesapla' },
            { label: 'Mobil Şarj', query: 'Mobil şarj fiyatı hesapla' },
            { label: 'Geri Dön', query: 'main_menu' }
          ]
        });
        setIsLoading(false);
      }, 500);
      return;
    }

    if (text === 'menu_order') {
       setTimeout(() => {
         addBotMessage('İhtiyacınız olan araç türünü seçiniz:', {
            type: 'selection',
            items: [
              { label: 'Oto Kurtarma', query: 'En yakın oto kurtarıcıyı bul' },
              { label: 'Vinç Hizmeti', query: 'En yakın vinç hizmetini bul' },
              { label: 'Evden Eve', query: 'Evden eve nakliye aracı bul' },
              { label: 'Ticari', query: 'Ticari yük taşıma aracı bul' },
              { label: 'Geri Dön', query: 'main_menu' }
            ]
         });
         setIsLoading(false);
       }, 500);
       return;
    }

    if (text === 'main_menu') {
        setTimeout(() => {
            addBotMessage('Ana menüye dönüldü.', null);
            setQuickActions(MAIN_MENU_ITEMS);
            setIsLoading(false);
        }, 300);
        return;
    }

    // --- API İSTEĞİ ---
    try {
      const nearbyDrivers = contextData?.drivers?.map((d: any) => 
        `- ${d.serviceType} (${d.firstName}): ${d.distance}m`
      ).join('\n') || "Yakında araç yok.";

      const systemContext = `
        Sen Transporter asistanısın.
        GÜNCEL TARİFE:
        ${JSON.stringify(TARIFF_DATA)}
        
        ETRAFTAKİ ARAÇLAR:
        ${nearbyDrivers}
        
        Kullanıcı Konumu: ${contextData?.userLocation ? contextData.userLocation.join(', ') : 'Bilinmiyor'}
        
        KURALLAR:
        1. Fiyat hesaplarken matematiksel işlem yap. (Açılış + (Mesafe * Birim)).
        2. Çıktı formatın düzenli olsun. Başlıkları **yıldızlar** içine al.
        3. Kullanıcıdan sayı (Input) istersen şu formatı ekle:
           ||DATA||{"type":"input_value","service":"hizmet_adi","unit":"km"}||DATA||
      `;

      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          context: systemContext,
          // Menu komutlarını filtreleyerek geçmişi temiz tut
          history: messages.filter(m => !m.content.includes('menu_') && !m.content.includes('main_')).map(m => ({ role: m.role, content: m.content }))
        })
      });

      if (!response.ok) throw new Error('API Hatası');
      const data = await response.json();
      const rawResponse = data.response || data.message || "Anlaşılamadı.";
      
      const { text: cleanText, uiData } = parseApiResponse(rawResponse);
      
      addBotMessage(cleanText, uiData);

    } catch (error) {
      addBotMessage("Bağlantı hatası oluştu.", null);
    } finally {
      setIsLoading(false);
    }
  };

  // --- BOT MESAJI EKLEME VE BUTON GÜNCELLEME ---
  const addBotMessage = (text: string, uiData: any) => {
    const botMsg: Message = { 
      id: Date.now().toString(), 
      role: 'assistant', 
      content: text,
      uiData: uiData 
    };
    setMessages(prev => [...prev, botMsg]);

    // Eğer API'den özel butonlar geldiyse onları alt bara koy
    if (uiData?.type === 'selection' && uiData.items) {
      setQuickActions(uiData.items);
    } 
    // Eğer input isteniyorsa butonları gizle ki inputa odaklansın
    else if (uiData?.type === 'input_value') {
      setQuickActions([]); 
    }
    // Hiçbir özel durum yoksa ANA MENÜYÜ geri getir (Persistent Menu)
    else {
      setQuickActions(MAIN_MENU_ITEMS);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      
      {/* HEADER */}
      <div className="bg-white px-5 py-4 border-b border-gray-100 flex justify-between items-center shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="bg-black text-white p-2 rounded-xl">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-gray-900 text-sm leading-tight">Transporter AI</h3>
            <p className="text-[10px] text-green-600 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Çevrimiçi
            </p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* MESAJ ALANI */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            
            {/* Baloncuk */}
            <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-xs font-medium leading-relaxed shadow-sm ${
              msg.role === 'user' 
                ? 'bg-black text-white rounded-br-none' 
                : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
            }`}>
              {/* Metni Formatla (Bold, Renk) */}
              {renderFormattedText(msg.content)}
            </div>

            {/* INPUT FORMU (Sadece input istendiğinde mesajın altında çıkar) */}
            {msg.uiData?.type === 'input_value' && (
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const val = (e.target as any).elements.val.value;
                  // (undefined) hatasını çözen kısım: || '' eklendi
                  handleSend(`${val} ${msg.uiData?.unit || ''}`);
                }}
                className="mt-2 w-full max-w-[85%] animate-in fade-in slide-in-from-top-2 flex gap-2"
              >
                <input 
                  name="val"
                  type="number" 
                  placeholder={`Değer giriniz (${msg.uiData?.unit || 'birim'})`} 
                  className="flex-1 bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-black/20 outline-none text-gray-900 shadow-sm"
                  autoFocus
                />
                <button type="submit" className="bg-green-600 text-white px-4 rounded-xl font-bold shadow-md active:scale-95">
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}

          </div>
        ))}

        {isLoading && (
           <div className="flex justify-start w-full">
              <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-none border border-gray-100 shadow-sm flex gap-1 items-center h-10">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-75"></span>
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-150"></span>
              </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ALT KISIM: SEÇENEKLER + INPUT */}
      <div className="bg-white border-t border-gray-100 shrink-0 safe-area-pb">
        
        {/* SEÇENEKLER (Yatay Kaydırmalı - CHATİN ÜSTÜNDE DEĞİL, BURADA) */}
        {quickActions.length > 0 && !isLoading && (
          <div className="px-4 pt-3 pb-1 flex gap-2 overflow-x-auto scrollbar-hide">
            {quickActions.map((action, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(action.query, true)} // Gizli komut gönder
                className="whitespace-nowrap bg-gray-50 border border-gray-200 text-gray-700 px-4 py-2.5 rounded-full text-[11px] font-bold hover:bg-black hover:text-white hover:border-black transition-all shadow-sm active:scale-95"
              >
                {action.label}
              </button>
            ))}
          </div>
        )}

        {/* INPUT */}
        <div className="p-4 pt-2">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
            className="flex items-center gap-2 bg-gray-50 p-1.5 pl-4 rounded-2xl border border-gray-200 focus-within:border-black/20 focus-within:bg-white transition-all"
          >
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Bir mesaj yazın..." 
              disabled={isLoading}
              className="flex-1 bg-transparent text-xs font-medium outline-none text-gray-900 placeholder:text-gray-400"
            />
            <button 
              type="submit" 
              disabled={!input.trim() || isLoading}
              className="p-2.5 bg-black text-white rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

    </div>
  );
}