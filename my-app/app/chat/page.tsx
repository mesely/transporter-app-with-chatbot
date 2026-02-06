'use client';

import ChatInterface from "../../components/ChatInterface";



export default function ChatPage() {
  return (
    // Mobilde tam ekran olması için h-[100dvh] (dynamic viewport height) kullanıyoruz
    <div className="h-[100dvh] w-full bg-white">
      {/* 'page' modu artık geçerli */}
      <ChatInterface mode="page" />
    </div>
  );
}