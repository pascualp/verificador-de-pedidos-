import { useState, useEffect } from 'react';
import { Clock, CheckCircle2 } from 'lucide-react';

export function TimeRemaining({ startTime, prepTimeMinutes, isPrepared, onAutoPrepared }: { startTime: string; prepTimeMinutes: number; isPrepared?: boolean; onAutoPrepared?: () => void }) {
  const [remaining, setRemaining] = useState('');
  const [isOverdue, setIsOverdue] = useState(false);

  useEffect(() => {
    if (isPrepared) return;

    const updateTimer = () => {
      const start = new Date(startTime).getTime();
      const now = new Date().getTime();
      const targetTime = start + prepTimeMinutes * 60000;
      const diff = targetTime - now;

      if (diff <= 0) {
        if (!isOverdue) {
          setIsOverdue(true);
          if (onAutoPrepared) {
             onAutoPrepared();
          }
        }
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
  }, [startTime, prepTimeMinutes, isPrepared, isOverdue, onAutoPrepared]);

  if (isPrepared || isOverdue) {
    return (
      <div className="absolute -top-2.5 -right-2.5 bg-green-100 text-green-800 border border-green-300 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
        <CheckCircle2 className="w-3 h-3" />
        <span className="font-mono text-[10px] font-black uppercase tracking-wider">PREPARADO</span>
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
