import React, { useRef, useEffect, useState } from 'react';
import { raidData } from '../data/raidData';

interface RaidTooltipProps {
    raidName: string;
}

export function RaidTooltip({ raidName }: RaidTooltipProps) {
    const raid = raidData.find(r => r.name === raidName);
    const containerRef = useRef<HTMLDivElement>(null);
    const [tooltipPosition, setTooltipPosition] = useState<'top' | 'bottom'>('bottom');

    useEffect(() => {
        const updateTooltipPosition = () => {
            if (!containerRef.current) return;

            const rect = containerRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;
            const tooltipHeight = 300; // Approximate tooltip height

            setTooltipPosition(spaceBelow < tooltipHeight && spaceAbove > spaceBelow ? 'top' : 'bottom');
        };

        updateTooltipPosition();
        window.addEventListener('scroll', updateTooltipPosition);
        window.addEventListener('resize', updateTooltipPosition);

        return () => {
            window.removeEventListener('scroll', updateTooltipPosition);
            window.removeEventListener('resize', updateTooltipPosition);
        };
    }, []);

    if (!raid) return null;

    return (
        <div className="tooltip-container" ref={containerRef}>
            <span>{raidName}</span>
            <div className={`tooltip raid-tooltip ${tooltipPosition === 'top' ? 'tooltip-top' : 'tooltip-bottom'}`}>
                <div className="tooltip-content">
                    {raid.firstMessage && (
                        <div className="tooltip-item">
                            <strong>First Message:</strong> {raid.firstMessage}
                        </div>
                    )}
                    {raid.secondMessage && (
                        <div className="tooltip-item">
                            <strong>Second Message:</strong> {raid.secondMessage}
                        </div>
                    )}
                    {raid.thirdMessage && (
                        <div className="tooltip-item">
                            <strong>Third Message:</strong> {raid.thirdMessage}
                        </div>
                    )}
                    {raid.bossMessage && (
                        <div className="tooltip-item">
                            <strong>Boss Message:</strong> {raid.bossMessage}
                        </div>
                    )}
                    {raid.floors && (
                        <div className="tooltip-item">
                            <strong>Floors:</strong> {raid.floors.join(', ')}
                        </div>
                    )}
                    {raid.timeToSpawn && (
                        <div className="tooltip-item">
                            <strong>Time to Spawn:</strong> {raid.timeToSpawn}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 