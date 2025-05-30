import React, { useEffect, useState } from 'react';
import { ItemData, lootItems } from '../data/itemDataMultiNpc';
import { mobData, MobData } from '../data/mobData';
import { raidData } from '../data/raidData';

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

    // Determine source URL and text based on title
    const sourceConfig = activeTab === "raids"
        ? {
            title: "Dura Raid Analyzer",
            url: "https://sites.google.com/view/durawiki/raids?authuser=0",
            text: "Raid data sourced from",
            count: raidData.length
        }
        : {
            title: "Dura Profit Calculator",
            url: "https://durawiki.miraheze.org/wiki/Quick_Loot_List",
            text: "Item data sourced from",
            count: lootItems.length
        };

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

    return (
        <div className="header-collage">
            <div className="header-collage-text">
                <h1>{sourceConfig.title}</h1><br />
                {sourceConfig.text}<br />
                <a href={sourceConfig.url} target="_blank" rel="noopener noreferrer">{sourceConfig.url}</a>
                <span className="item-count"> ({sourceConfig.count} {activeTab === "raids" ? "raids" : "items"} in database)</span>
                <br />
                Made by <a style={{ color: 'green' }} href="https://discordapp.com/users/ahnert">Godlike</a><br />
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