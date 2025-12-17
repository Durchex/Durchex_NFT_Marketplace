import React, { useState, useEffect } from 'react';
import { FiClock } from 'react-icons/fi';

const CountdownTimer = ({ eventStartTime, onTimerComplete }) => {
  const [timeLeft, setTimeLeft] = useState(null);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!eventStartTime) {
        setIsLive(false);
        setTimeLeft(null);
        return;
      }

      const startTime = new Date(eventStartTime).getTime();
      const now = new Date().getTime();
      const difference = startTime - now;

      if (difference <= 0) {
        setIsLive(true);
        setTimeLeft(null);
        if (onTimerComplete) {
          onTimerComplete();
        }
      } else {
        setIsLive(false);
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({
          days: String(days).padStart(2, '0'),
          hours: String(hours).padStart(2, '0'),
          minutes: String(minutes).padStart(2, '0'),
          seconds: String(seconds).padStart(2, '0')
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [eventStartTime, onTimerComplete]);

  if (!eventStartTime) {
    return null;
  }

  if (isLive) {
    return (
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg px-3 py-2 text-white font-semibold flex items-center gap-2">
        <FiClock className="w-4 h-4 animate-pulse" />
        Live Now!
      </div>
    );
  }

  if (!timeLeft) {
    return (
      <div className="bg-slate-700 rounded-lg px-3 py-2 text-gray-300 flex items-center gap-2">
        <FiClock className="w-4 h-4" />
        Loading...
      </div>
    );
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
      <div className="flex items-center gap-1 text-xs text-gray-300 mb-2">
        <FiClock className="w-3 h-3" />
        Time Remaining
      </div>
      <div className="grid grid-cols-4 gap-1">
        <div className="bg-slate-700 rounded px-2 py-1 text-center">
          <div className="text-sm font-mono font-bold text-purple-300">{timeLeft.days}</div>
          <div className="text-xs text-gray-400">Days</div>
        </div>
        <div className="bg-slate-700 rounded px-2 py-1 text-center">
          <div className="text-sm font-mono font-bold text-purple-300">{timeLeft.hours}</div>
          <div className="text-xs text-gray-400">Hours</div>
        </div>
        <div className="bg-slate-700 rounded px-2 py-1 text-center">
          <div className="text-sm font-mono font-bold text-purple-300">{timeLeft.minutes}</div>
          <div className="text-xs text-gray-400">Mins</div>
        </div>
        <div className="bg-slate-700 rounded px-2 py-1 text-center">
          <div className="text-sm font-mono font-bold text-purple-300">{timeLeft.seconds}</div>
          <div className="text-xs text-gray-400">Secs</div>
        </div>
      </div>
    </div>
  );
};

export default CountdownTimer;
