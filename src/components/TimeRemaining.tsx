import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export function TimeRemaining({ startTime, prepTimeMinutes }: { startTime: string; prepTimeMinutes: number }) {
  const [remaining, setRemaining] = useState('');
  const [isOverdue, setIsOverdue] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const start = new Date(startTime).getTime();
      const now = new Date().getTime();
      const targetTime = start + prepTimeMinutes * 60000;
      const diff = targetTime - now;

      if (diff <= 0) {
        setIsOverdue(true);
        const overdueDiff = Math.abs(diff);
        const minutes = Math.floor(overdueDiff / 60000);
        const seconds = Math.floor((overdueDiff % 60000) / 1000);
        setRemaining(`-${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        return;
      }

      setIsOverdue(false);
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      
      if (hours > 0) {
        setRemaining(`${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      } else {
        setRemaining(`${mins.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [startTime, prepTimeMinutes]);

  if (isOverdue) {
    return (
      <div className="absolute -top-2.5 -right-2.5 bg-red-100 text-red-800 border border-red-300 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1 animate-pulse">
        <Clock className="w-3 h-3" />
        <span className="font-mono text-[10px] font-black uppercase tracking-wider">Atrasado: {remaining}</span>
      </div>
    );
  }

  return (
    <div className="absolute -top-2.5 -right-2.5 bg-yellow-100 text-yellow-800 border border-yellow-300 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
      <Clock className="w-3 h-3" />
      <span className="font-mono text-[10px] font-bold">{remaining}</span>
    </div>
  );
}
