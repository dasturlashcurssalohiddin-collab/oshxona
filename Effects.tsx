import React, { useEffect, useState } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  opacity: number;
  emoji: string;
}

export default function Effects({ active }: { active: boolean }) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!active) {
      setParticles([]);
      return;
    }

    const emojis = ["🍂", "🌸", "✨", "🥘", "☕", "🍊"];
    const initialParticles: Particle[] = Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 15 + 10,
      speedY: -(Math.random() * 0.5 + 0.2),
      speedX: Math.random() * 0.4 - 0.2,
      opacity: Math.random() * 0.5 + 0.3,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
    }));

    setParticles(initialParticles);

    const interval = setInterval(() => {
      setParticles((prev) =>
        prev.map((p) => {
          let nextY = p.y + p.speedY;
          let nextX = p.x + p.speedX;

          // Wrap around if gone off-screen
          if (nextY < -10) {
            nextY = 110;
            nextX = Math.random() * 100;
          }
          if (nextX < -10 || nextX > 110) {
            nextX = Math.random() * 100;
          }

          return { ...p, x: nextX, y: nextY };
        })
      );
    }, 40);

    return () => clearInterval(interval);
  }, [active]);

  if (!active) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-40">
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute select-none transition-all duration-100 ease-linear"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            fontSize: `${p.size}px`,
            opacity: p.opacity,
            transform: `rotate(${p.y * 3}deg)`,
          }}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  );
}
