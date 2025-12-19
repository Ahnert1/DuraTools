import React, { useEffect, useState } from 'react';
import { ItemData, lootItems } from '../data/itemDataMultiNpc';
import { mobData, MobData } from '../data/mobData';
// import { raidData } from '../data/raidData';

interface CollageItem {
    id: number;
    image: string;
    x: number;
    y: number;
    rotation: number;
    scale: number;
    directionX: number;
    directionY: number;
    speed: number;
}

interface HeaderCollageProps {
    activeTab: string;
}

export function HeaderCollage({ activeTab }: HeaderCollageProps) {
    const [items, setItems] = useState<CollageItem[]>([]);
    const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
        try {
            const stored = localStorage.getItem('theme');
            if (stored === 'dark') return true;
            if (stored === 'light') return false;
            // Default to dark when no stored preference
            return true;
        } catch {
            return true;
        }
    });

    // Static header content

    useEffect(() => {
        // Get random items/mobs with images based on activeTab
        const dataSource = activeTab === "raids" ? mobData : lootItems;
        const itemsWithImages = (dataSource as (MobData | ItemData)[]).filter((item): item is (MobData | ItemData) & { imageBase64: string } =>
            Boolean(item.imageBase64)
        );
        const randomItems = itemsWithImages
            .sort(() => Math.random() - 0.5)
            .slice(0, 10);

        // Use a safe range so images don't overflow
        const minPercent = 8;
        const maxPercent = 92;

        // Create collage items with random positions and rotations
        const collageItems = randomItems.map((item: MobData | ItemData, index: number) => ({
            id: index,
            image: item.imageBase64 || '',
            x: minPercent + Math.random() * (maxPercent - minPercent),
            y: minPercent + Math.random() * (maxPercent - minPercent),
            rotation: (Math.random() - 0.5) * 30,
            scale: (activeTab === "raids" ? 2 : 1.5) + Math.random() * 0.4,
            directionX: (Math.random() - 0.5) * 0.5,
            directionY: (Math.random() - 0.5) * 0.5,
            speed: 0.5 + Math.random() * 0.05,
        }));

        setItems(collageItems);

        // Animation loop with requestAnimationFrame for smoothness
        let animationFrameId: number;
        let lastTimestamp = 0;
        const FRAME_INTERVAL = 1000 / 30;

        const animate = (timestamp: number) => {
            if (timestamp - lastTimestamp >= FRAME_INTERVAL) {
                setItems(prevItems =>
                    prevItems.map(item => {
                        let newX = item.x + item.directionX * item.speed;
                        let newY = item.y + item.directionY * item.speed;
                        if (newX <= minPercent || newX >= maxPercent) {
                            newX = Math.max(minPercent, Math.min(maxPercent, newX));
                            item.directionX *= -0.99;
                        }
                        if (newY <= minPercent || newY >= maxPercent) {
                            newY = Math.max(minPercent, Math.min(maxPercent, newY));
                            item.directionY *= -0.99;
                        }
                        return {
                            ...item,
                            x: newX,
                            y: newY,
                        };
                    })
                );
                lastTimestamp = timestamp;
            }
            animationFrameId = requestAnimationFrame(animate);
        };

        animationFrameId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrameId);
    }, [activeTab]); // Add activeTab as a dependency to re-run when it changes

    useEffect(() => {
        try {
            if (isDarkMode) {
                document.body.classList.add('dark');
                localStorage.setItem('theme', 'dark');
            } else {
                document.body.classList.remove('dark');
                localStorage.setItem('theme', 'light');
            }
        } catch { }
    }, [isDarkMode]);

    function toggleDarkMode() {
        setIsDarkMode(prev => !prev);
    }

    return (
        <div className="header-collage">
            <div className="header-collage-text">
                <div className="header-collage-title">
                    <h1>Dura Tools</h1>
                </div>
            </div>
            <button
                type="button"
                className="header-collage-toggle"
                aria-label="Toggle dark mode"
                onClick={toggleDarkMode}
                title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
                <span className="header-collage-toggle-label">{isDarkMode ? 'Dark Mode' : 'Normal Mode'}</span>
                {isDarkMode ? (
                    // Moon icon when dark mode is enabled
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                        <path fill="currentColor" d="M12.74 2a9.93 9.93 0 00-9.7 12.46a10 10 0 0018.28 3.22a.75.75 0 00-.83-1.12A7.49 7.49 0 0112.2 4.5a.75.75 0 00.2-1.48A9.9 9.9 0 0012.74 2z" />
                    </svg>
                ) : (
                    // Sun icon when dark mode is disabled (normal mode)
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                        <path fill="currentColor" d="M6.76 4.84l-1.8-1.79L3.17 4.84l1.79 1.79l1.8-1.79m10.48 0l1.79-1.79l1.79 1.79l-1.79 1.79l-1.79-1.79M12 4V1h-0v3m0 19v-3h0v3M4 13H1v-2h3v2m19 0h-3v-2h3v2M6.76 19.16l-1.8 1.79l-1.79-1.79l1.79-1.79l1.8 1.79m10.48 0l1.79 1.79l1.79-1.79l-1.79-1.79l-1.79 1.79M12 8a4 4 0 100 8a4 4 0 000-8z" />
                    </svg>
                )}
            </button>
            <div className="header-collage-credit">
                <span className="header-collage-credit-chip">
                    Made by <a style={{ color: 'green', display: 'inline-flex', alignItems: 'center', gap: '6px' }} href="https://discordapp.com/users/ahnert">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                            <rect width="24" height="24" rx="6" fill="#5865F2" />
                            <path fill="#FFFFFF" d="M15.72 8.16a7.3 7.3 0 0 0-1.8-.56l-.13.26a8.86 8.86 0 0 1 2.1.7 9 9 0 0 0-3.89-.93h-.02c-1.34 0-2.67.31-3.9.93a8.86 8.86 0 0 1 2.1-.7l-.13-.26a7.3 7.3 0 0 0-1.8.56c-1.33.64-2.4 1.98-2.4 1.98s.72 5.09 3.2 6.7c.61.4 1.37.63 2.23.73l.48-.65c-.93-.27-1.73-.76-2.38-1.4.3.22.64.41 1 .57.74.32 1.6.5 2.5.5s1.76-.18 2.5-.5c.36-.16.69-.35 1-.57-.65.64-1.45 1.13-2.38 1.4l.48.65c.86-.1 1.62-.33 2.23-.73 2.48-1.61 3.2-6.7 3.2-6.7s-1.07-1.34-2.4-1.98ZM10.1 12.9c-.55 0-.99-.5-.99-1.12s.44-1.12.99-1.12c.54 0 .98.5.98 1.12s-.44 1.12-.98 1.12Zm3.8 0c-.55 0-.99-.5-.99-1.12s.44-1.12.99-1.12.98.5.98 1.12-.44 1.12-.98 1.12Z" />
                        </svg>
                        <span>Godlike</span>
                    </a>
                </span>
            </div>
            {items.map((item) => (
                <div
                    key={item.id}
                    className="collage-item"
                    style={{
                        left: `${item.x}%`,
                        top: `${item.y}%`,
                        transform: `translate(-50%, -50%) rotate(${item.rotation}deg) scale(${item.scale})`,
                        '--i': item.id,
                    } as React.CSSProperties}
                >
                    <img src={item.image} alt="" />
                </div>
            ))}
        </div>
    );
} 