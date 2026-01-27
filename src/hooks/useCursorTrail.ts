import { useEffect, useRef, useCallback } from 'react';

interface TrailParticle {
  x: number;
  y: number;
  size: number;
  opacity: number;
  hue: number;
  life: number;
}

export const useCursorTrail = (containerRef: React.RefObject<HTMLElement>, isEnabled: boolean = true) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<TrailParticle[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef<number>(0);
  const lastMouseRef = useRef({ x: 0, y: 0 });

  const createParticle = useCallback((x: number, y: number) => {
    const particle: TrailParticle = {
      x,
      y,
      size: Math.random() * 8 + 4,
      opacity: 1,
      hue: Math.random() * 60 + 40, // Yellow-gold range (40-100)
      life: 1,
    };
    particlesRef.current.push(particle);
    
    // Limit particles
    if (particlesRef.current.length > 50) {
      particlesRef.current.shift();
    }
  }, []);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update and draw particles
    particlesRef.current = particlesRef.current.filter(particle => {
      particle.life -= 0.02;
      particle.opacity = particle.life;
      particle.size *= 0.98;
      particle.y -= 0.5; // Float up slightly

      if (particle.life <= 0) return false;

      // Draw particle with glow
      ctx.save();
      ctx.globalAlpha = particle.opacity;
      
      // Outer glow
      const gradient = ctx.createRadialGradient(
        particle.x, particle.y, 0,
        particle.x, particle.y, particle.size * 2
      );
      gradient.addColorStop(0, `hsla(${particle.hue}, 100%, 70%, ${particle.opacity})`);
      gradient.addColorStop(0.5, `hsla(${particle.hue}, 100%, 50%, ${particle.opacity * 0.5})`);
      gradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2);
      ctx.fill();

      // Inner bright core
      ctx.fillStyle = `hsla(${particle.hue}, 100%, 90%, ${particle.opacity})`;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * 0.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      return true;
    });

    animationFrameRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    if (!isEnabled || !containerRef.current) return;

    const container = containerRef.current;
    
    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '15';
    canvasRef.current = canvas;
    container.appendChild(canvas);

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    resizeCanvas();

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      mouseRef.current = { x, y };

      // Calculate distance from last position
      const dx = x - lastMouseRef.current.x;
      const dy = y - lastMouseRef.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Create particles based on movement distance
      if (distance > 5) {
        createParticle(x, y);
        lastMouseRef.current = { x, y };
      }
    };

    const handleMouseEnter = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      lastMouseRef.current = { 
        x: e.clientX - rect.left, 
        y: e.clientY - rect.top 
      };
    };

    window.addEventListener('resize', resizeCanvas);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseenter', handleMouseEnter);
    
    // Start animation loop
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseenter', handleMouseEnter);
      cancelAnimationFrame(animationFrameRef.current);
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
    };
  }, [isEnabled, containerRef, createParticle, animate]);

  return canvasRef;
};
