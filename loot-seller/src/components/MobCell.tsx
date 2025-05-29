import { lootItems } from "../data/itemDataMultiNpc";
import { MobData, mobData } from "../data/mobData";
import { handleImageError } from "../utils/imageUtils";
import placeholderBase64 from "../utils/placeholder-base64";
import { useRef, useEffect, useState } from "react";

const elementColors: Record<string, string> = {
    Fire: 'text-red-500',
    Ice: 'text-sky-500',
    Terra: 'text-green-500',
    Energy: 'text-purple-500'
};

// Add new MobCell component
interface MobCellProps {
    mobName: string;
}

export default function MobCell({ mobName }: MobCellProps) {
    const mob = mobData.find((mob: MobData) => mob.name === mobName);
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

    return (
        <div className="flex flex-col items-center relative group" ref={containerRef}>
            <span className="text-green-600 font-medium mb-1">{mobName}</span>
            <img
                src={mob?.imageBase64 || placeholderBase64}
                alt={mobName}
                className="w-16 h-16 object-contain"
                onError={handleImageError}
            />
            {mob && (
                <div className={`mob-tooltip ${tooltipPosition === 'top' ? 'bottom-[calc(100%-4px)] top-auto' : 'top-full'}`}>
                    <div><strong>Regular:</strong> {mob.regularExp} XP / {mob.regularHp} HP</div>
                    <div><strong>Party:</strong> {mob.partyExp} XP / {mob.partyHp} HP</div>
                    <div><strong>Elite:</strong> {mob.eliteExp} XP / {mob.eliteHp} HP</div>
                    <div><strong>Legendary:</strong> {mob.legendaryExp} XP / {mob.legendaryHp} HP</div>
                    <div><strong>Heroism:</strong> Lvl {mob.heroismLvl}</div>
                    <div><strong>Glory:</strong> Lvl {mob.gloryLvl}</div>
                    <div><strong>Over Experienced:</strong> Lvl {mob.overExperiencedLvl}</div>
                    {mob.elementWeaknesses.length > 0 && (
                        <div>
                            <strong>Weaknesses:</strong>{' '}
                            {mob.elementWeaknesses.map((element, index) => (
                                <span key={index} className={elementColors[element] || ''}>
                                    {element}{index < mob.elementWeaknesses.length - 1 ? ', ' : ''}
                                </span>
                            ))}
                        </div>
                    )}
                    {mob.notableLoot.length > 0 && (
                        <div>
                            <strong>Notable Loot:</strong>
                            <div className="grid grid-cols-2 gap-2 mt-1">
                                {mob.notableLoot.map((lootName: string, index: number) => {
                                    const item = lootItems.find(item => item.name === lootName);
                                    return (
                                        <div key={index} className="border-b border-gray-300 border-opacity-10 flex items-center gap-1">
                                            <a
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                href={`https://durawiki.miraheze.org/${lootName.replace(/\s+/g, '_')}`}
                                                className="flex items-center gap-1 hover:text-blue-500 transition-colors"
                                            >
                                                <img
                                                    src={item?.imageBase64 || placeholderBase64}
                                                    alt={lootName}
                                                    className="w-6 h-6 object-contain"
                                                    onError={handleImageError}
                                                />
                                                <span className="text-sm">{lootName}</span>
                                            </a>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}