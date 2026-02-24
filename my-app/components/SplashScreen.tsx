'use client';

import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';

interface SplashScreenProps {
  visible: boolean;
}

export default function SplashScreen({ visible }: SplashScreenProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            filter: 'blur(14px)',
            transition: { duration: 0.55, ease: 'easeInOut' },
          }}
          className="fixed inset-0 z-[100000] flex items-center justify-center overflow-hidden bg-[#fcfcfc]"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(59,130,246,0.14),transparent_55%)]" />
          <div className="absolute -top-24 -left-20 h-80 w-80 rounded-full bg-sky-100/70 blur-3xl" />
          <div className="absolute -bottom-24 -right-20 h-96 w-96 rounded-full bg-indigo-100/60 blur-3xl" />

          <div className="relative flex flex-col items-center px-6">
            <motion.div
              initial={{ scale: 0.72, opacity: 0, rotate: -8 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ duration: 1.1, type: 'spring', stiffness: 105, damping: 15 }}
              className="relative mb-8 h-48 w-48 sm:h-56 sm:w-56"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 opacity-15"
              >
                <div className="h-full w-full rounded-full border-2 border-dashed border-slate-900" />
              </motion.div>

              <div className="absolute inset-5 rounded-[2.2rem] border border-gray-200/80 bg-white/95 shadow-[0_24px_70px_rgba(15,23,42,0.2)]">
                <Image
                  src="/favicon.ico"
                  alt="Transport 245"
                  fill
                  priority
                  className="rounded-[2rem] object-contain p-5"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.45, duration: 0.8 }}
              className="text-center"
            >
              <h1 className="text-3xl font-black uppercase tracking-[0.28em] text-slate-900 sm:text-4xl">
                TRANSPORT 245
              </h1>
              <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.42em] text-slate-500 sm:text-[11px]">
                Gelecegin lojistik agi
              </p>

              <div className="relative mx-auto mt-6 h-[3px] w-56 overflow-hidden rounded-full bg-slate-100 sm:w-64">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 2.2, ease: 'easeInOut' }}
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-sky-500 via-indigo-500 to-blue-700"
                />
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
