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

export function MiniHeaderCollage() {
    const [items, setItems] = useState<CollageItem[]>([]);

    useEffect(() => {
        const itemsWithImages = lootItems.filter(item => item.imageBase64);
        const randomItems = itemsWithImages
            .sort(() => Math.random() - 0.5)
            .slice(0, 8);
        const minPercent = 10;
        const maxPercent = 90;
        const collageItems = randomItems.map((item, index) => ({
            id: index,
            image: item.imageBase64 || '',
            x: minPercent + Math.random() * (maxPercent - minPercent),
            y: minPercent + Math.random() * (maxPercent - minPercent),
            rotation: (Math.random() - 0.5) * 30,
            scale: 1.2 + Math.random(),
            directionX: (Math.random() - 0.5) * 0.5,
            directionY: (Math.random() - 0.5) * 0.5,
            speed: 0.5 + Math.random() * 0.05,
        }));
        setItems(collageItems);
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
    }, []);

    return (
        <div className="mini-header-collage">
            <div className="mini-header-collage-text">
                <h1>Dura Profit Calculator</h1> <br />
                <h2>Made by <a href="https://discordapp.com/users/ahnert">Godlike</a></h2>
            </div>
            {items.map(item => (
                <div
                    key={item.id}
                    className="mini-collage-item"
                    style={{
                        left: `${item.x}%`,
                        top: `${item.y}%`,
                        transform: `translate(-50%, -50%) rotate(${item.rotation}deg) scale(${item.scale})`,
                        zIndex: 1,
                    } as React.CSSProperties}
                >
                    <img src={item.image} alt="" />
                </div>
            ))}
        </div>
    );
} 