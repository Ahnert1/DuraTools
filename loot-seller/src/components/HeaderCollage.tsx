import React, { useEffect, useState } from 'react';
import { lootItems } from '../data/itemDataMultiNpc';

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

export function HeaderCollage() {
    const [items, setItems] = useState<CollageItem[]>([]);

    useEffect(() => {
        // Get random items with images
        const itemsWithImages = lootItems.filter(item => item.imageBase64);
        const randomItems = itemsWithImages
            .sort(() => Math.random() - 0.5)
            .slice(0, 10); // Show 20 random items

        // Use a safe range so images don't overflow
        const minPercent = 8;
        const maxPercent = 92;

        // Create collage items with random positions and rotations
        const collageItems = randomItems.map((item, index) => ({
            id: index,
            image: item.imageBase64 || '',
            x: minPercent + Math.random() * (maxPercent - minPercent),
            y: minPercent + Math.random() * (maxPercent - minPercent),
            rotation: (Math.random() - 0.5) * 30, // Random rotation (-15 to 15 degrees)
            scale: 0.8 + Math.random() * 0.4, // Random scale (0.8 to 1.2)
            directionX: (Math.random() - 0.5) * 0.5,
            directionY: (Math.random() - 0.5) * 0.5,
            speed: 0.5 + Math.random() * 0.05,
        }));

        setItems(collageItems);

        // Animation loop with requestAnimationFrame for smoothness
        let animationFrameId: number;
        let lastTimestamp = 0;
        const FRAME_INTERVAL = 1000 / 30; // Target 30 FPS

        const animate = (timestamp: number) => {
            if (timestamp - lastTimestamp >= FRAME_INTERVAL) {
                setItems(prevItems =>
                    prevItems.map(item => {
                        let newX = item.x + item.directionX * item.speed;
                        let newY = item.y + item.directionY * item.speed;
                        // Bounce off edges
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
    }, []);

    return (
        <div className="header-collage">
            <div className="header-collage-text">
                <h1>Dura Profit Calculator</h1><br />
                Item data sourced from <a href="https://durawiki.miraheze.org/wiki/Quick_Loot_List" target="_blank" rel="noopener noreferrer">Dura Wiki - Quick Loot List</a>
                <span className="item-count"> ({lootItems.length} items in database)</span>
                <br />
                Tips appreciated <a href="https://discordapp.com/users/ahnert">Godlike</a> {"/ Thais ;)"} <br />
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