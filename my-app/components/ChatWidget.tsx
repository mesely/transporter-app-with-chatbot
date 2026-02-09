'use client';

import { Bot } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import ChatInterface from './ChatInterface';

const MotionDiv = motion.div as any;
const MotionButton = motion.button as any;

interface ChatWidgetProps {
  isOpen: boolean;
  onToggle: (state: boolean) => void;
  contextData?: any; 
  isMovedUp?: boolean; 
}

export default function ChatWidget({ isOpen, onToggle, contextData }: ChatWidgetProps) {
  return (
    <>
      {/* 1. TAM EKRAN SOHBET PENCERESİ (AÇIKKEN) */}
      <AnimatePresence>
        {isOpen && (
          <MotionDiv
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            // z-[9000]: Sidebar'dan yüksek olsun ki sohbet açılınca her şeyi kaplasın
            // Ama Global Alertlerin (UserAgreement gibi) altında kalsın istersen page.tsx sırası önemli
            className="fixed inset-0 z-[9000] bg-white w-full h-full flex flex-col overflow-hidden"
          >
             <ChatInterface 
                mode="widget" 
                onClose={() => onToggle(false)} 
                contextData={contextData}
             />
          </MotionDiv>
        )}
      </AnimatePresence>

      {/* 2. YUVARLAK BOT BUTONU (KAPALIYKEN) */}
      {!isOpen && (
        <MotionButton
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          onClick={() => onToggle(true)}
          // 🔥 DÜZELTME BURADA: z-[99999] YERİNE z-[1500] YAPILDI.
          // Böylece Sidebar (z-2000) açılınca buton onun altında kalır ve blurlanır.
          className="fixed top-24 right-6 z-[1500] pointer-events-auto w-12 h-12 bg-white rounded-full shadow-xl border-2 border-gray-100 flex items-center justify-center text-black cursor-pointer hover:bg-gray-50 active:scale-95 transition-transform"
        >
          <Bot className="w-6 h-6 text-gray-700" />
        </MotionButton>
      )}
    </>
  );
}