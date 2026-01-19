/**
 * AuctionTimer Component
 * Countdown timer with visual feedback
 */

import React, { useState, useEffect } from 'react';
import './AuctionTimer.css';

const AuctionTimer = ({ endTime, onAuctionEnd, autoExtendTime = null, status = 'active' }) => {
    const [timeLeft, setTimeLeft] = useState(null);
    const [isWarning, setIsWarning] = useState(false);
    const [isExtending, setIsExtending] = useState(false);
    const [percentage, setPercentage] = useState(100);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date().getTime();
            const end = new Date(endTime).getTime();
            const difference = end - now;

            if (difference <= 0) {
                setTimeLeft(null);
                if (onAuctionEnd) {
                    onAuctionEnd();
                }
                return;
            }

            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((difference / 1000 / 60) % 60);
            const seconds = Math.floor((difference / 1000) % 60);

            // Warn when less than 1 hour left
            setIsWarning(difference < 60 * 60 * 1000);

            setTimeLeft({ days, hours, minutes, seconds, total: difference });
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(timer);
    }, [endTime, onAuctionEnd]);

    useEffect(() => {
        if (autoExtendTime) {
            const now = new Date().getTime();
            const extend = new Date(autoExtendTime).getTime();
            if (extend > now) {
                setIsExtending(true);
                const timeout = setTimeout(() => setIsExtending(false), 3000);
                return () => clearTimeout(timeout);
            }
        }
    }, [autoExtendTime]);

    if (!timeLeft) {
        return (
            <div className="auction-timer-container ended">
                <div className="status-badge">
                    {status === 'settled' ? 'Settled' : 'Ended'}
                </div>
                <p className="ended-message">This auction has ended</p>
            </div>
        );
    }

    const totalDuration = new Date(endTime).getTime() - new Date().getTime();
    const elapsed = Math.max(0, totalDuration - timeLeft.total);
    const totalInit = new Date(endTime).getTime() - new Date(new Date(endTime).getTime() - totalDuration).getTime();
    percentage = ((totalInit - timeLeft.total) / totalInit) * 100;

    return (
        <div className={`auction-timer-container ${isWarning ? 'warning' : ''} ${isExtending ? 'extending' : ''}`}>
            {/* Status Badge */}
            {status && (
                <div className={`status-badge ${status}`}>
                    {status === 'active' && (
                        <>
                            <span className="pulse"></span>
                            Active
                        </>
                    )}
                    {status === 'extended' && (
                        <>
                            <span className="pulse"></span>
                            Extended
                        </>
                    )}
                    {status === 'settled' && 'Settled'}
                </div>
            )}

            {/* Timer Display */}
            <div className="timer-display">
                {timeLeft.days > 0 && (
                    <div className="time-unit">
                        <span className="number">{String(timeLeft.days).padStart(2, '0')}</span>
                        <span className="label">Days</span>
                    </div>
                )}

                <div className="time-unit">
                    <span className="number">{String(timeLeft.hours).padStart(2, '0')}</span>
                    <span className="label">Hours</span>
                </div>

                <div className="time-unit">
                    <span className="number">{String(timeLeft.minutes).padStart(2, '0')}</span>
                    <span className="label">Mins</span>
                </div>

                <div className="time-unit">
                    <span className="number">{String(timeLeft.seconds).padStart(2, '0')}</span>
                    <span className="label">Secs</span>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="progress-container">
                <div className="progress-bar" style={{ width: `${Math.min(percentage, 100)}%` }}></div>
            </div>

            {/* Warning Message */}
            {isWarning && timeLeft.minutes < 60 && (
                <div className="warning-message">
                    ⚠️ Less than 1 hour remaining!
                </div>
            )}

            {/* Extension Notice */}
            {isExtending && (
                <div className="extension-notice">
                    ✓ Auction extended by 15 minutes
                </div>
            )}

            {/* Info */}
            <div className="timer-info">
                {timeLeft.minutes < 15 && (
                    <p>Late bids will trigger a 15-minute extension</p>
                )}
                {timeLeft.minutes >= 15 && (
                    <p>Ends at {new Date(endTime).toLocaleTimeString()}</p>
                )}
            </div>
        </div>
    );
};

export default AuctionTimer;
