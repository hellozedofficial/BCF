import React, { useRef, useEffect, useCallback } from 'react';

export default function ClickSpark({
  sparkColor = '#047857',
  sparkSize = 10,
  sparkRadius = 25,
  sparkCount = 8,
  duration = 400,
  extraScale = 1.0,
  children
}) {
  const canvasRef = useRef(null);
  const sparksRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  const createSparks = useCallback((x, y) => {
    const now = performance.now();
    const newSparks = [];
    
    // Carrom Toka colors: Green, Gold, Red (Queen), White
    const colors = [sparkColor, '#F59E0B', '#EF4444', '#10B981', '#2563EB'];

    for (let i = 0; i < sparkCount; i++) {
      const angle = (2 * Math.PI * i) / sparkCount + (Math.random() - 0.5) * 0.4;
      const speed = (sparkRadius / (duration / 16)) * (0.8 + Math.random() * 0.5);
      const color = colors[Math.floor(Math.random() * colors.length)];

      newSparks.push({
        x,
        y,
        angle,
        speed,
        startTime: now,
        size: (sparkSize * (0.7 + Math.random() * 0.6)) * extraScale,
        color
      });
    }

    sparksRef.current.push(...newSparks);
  }, [sparkColor, sparkCount, sparkRadius, sparkSize, duration, extraScale]);

  useEffect(() => {
    let animationFrameId;

    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const now = performance.now();
      sparksRef.current = sparksRef.current.filter((spark) => {
        const elapsed = now - spark.startTime;
        if (elapsed >= duration) return false;

        const progress = elapsed / duration;
        // Ease out quad
        const easeProgress = 1 - Math.pow(1 - progress, 2);
        const distance = spark.speed * (elapsed / 16);

        const currentX = spark.x + Math.cos(spark.angle) * distance;
        const currentY = spark.y + Math.sin(spark.angle) * distance;
        const currentSize = spark.size * (1 - progress);
        const opacity = 1 - progress;

        ctx.save();
        ctx.beginPath();
        // Line spark radiating outward like a striker impact
        const lineLen = currentSize * 2.2;
        ctx.moveTo(currentX, currentY);
        ctx.lineTo(
          currentX + Math.cos(spark.angle) * lineLen,
          currentY + Math.sin(spark.angle) * lineLen
        );
        ctx.strokeStyle = spark.color;
        ctx.lineWidth = Math.max(1.5, currentSize * 0.6);
        ctx.lineCap = 'round';
        ctx.globalAlpha = opacity;
        ctx.shadowColor = spark.color;
        ctx.shadowBlur = 4;
        ctx.stroke();

        // Little bright particle head
        ctx.beginPath();
        ctx.arc(
          currentX + Math.cos(spark.angle) * lineLen,
          currentY + Math.sin(spark.angle) * lineLen,
          currentSize * 0.4,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.restore();

        return true;
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    animationFrameId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animationFrameId);
  }, [duration]);

  const handleClick = (e) => {
    createSparks(e.clientX, e.clientY);
  };

  return (
    <div onClick={handleClick} style={{ position: 'relative', width: '100%', minHeight: '100vh' }}>
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          pointerEvents: 'none',
          zIndex: 9999
        }}
      />
      {children}
    </div>
  );
}
