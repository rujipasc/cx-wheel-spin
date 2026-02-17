import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

const WHEEL_COLORS = [
  "hsl(340, 82%, 62%)",
  "hsl(170, 70%, 50%)",
  "hsl(35, 92%, 60%)",
  "hsl(260, 70%, 65%)",
  "hsl(200, 80%, 55%)",
  "hsl(145, 65%, 50%)",
  "hsl(15, 85%, 58%)",
  "hsl(280, 60%, 55%)",
];

const SpinWheel = forwardRef(function SpinWheel(
  { names, onResult, spinning, onSpinEnd, onSpinStart, size = 500 },
  ref
) {
  const canvasRef = useRef(null);
  const animRef = useRef(0);
  const currentRotation = useRef(0);
  const namesRef = useRef(names);

  useEffect(() => {
    namesRef.current = names;
  }, [names]);

  const draw = useCallback((rot) => {
    const canvas = canvasRef.current;
    if (!canvas || namesRef.current.length === 0) return;
    const ctx = canvas.getContext("2d");
    const size = canvas.width;
    const center = size / 2;
    const radius = center - 4;
    const arc = (2 * Math.PI) / namesRef.current.length;

    ctx.clearRect(0, 0, size, size);

    namesRef.current.forEach((name, i) => {
      const startAngle = rot + i * arc;
      const endAngle = startAngle + arc;

      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = WHEEL_COLORS[i % WHEEL_COLORS.length];
      ctx.fill();

      ctx.strokeStyle = "rgba(0,0,0,0.16)";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(startAngle + arc / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "#fff";
      ctx.font = `bold ${Math.max(8, Math.min(16, 260 / namesRef.current.length))}px CardX, sans-serif`;
      ctx.shadowColor = "rgba(0,0,0,0.45)";
      ctx.shadowBlur = 4;

      const maxWidth = radius * 0.6;
      let displayName = String(name);
      if (ctx.measureText(displayName).width > maxWidth) {
        while (
          ctx.measureText(`${displayName}…`).width > maxWidth &&
          displayName.length > 1
        ) {
          displayName = displayName.slice(0, -1);
        }
        displayName += "…";
      }
      ctx.fillText(displayName, radius - 20, 4);
      ctx.restore();
    });

    ctx.beginPath();
    ctx.arc(center, center, 22, 0, 2 * Math.PI);
    ctx.fillStyle = "hsl(218, 28%, 34%)";
    ctx.fill();
  }, []);

  useEffect(() => {
    draw(currentRotation.current);
  }, [names, draw]);

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  const spin = useCallback(() => {
    if (namesRef.current.length === 0 || spinning) return;
    onSpinStart?.();

    const extraSpins = 5 + Math.random() * 5;
    const targetRotation =
      currentRotation.current +
      extraSpins * 2 * Math.PI +
      Math.random() * 2 * Math.PI;
    const duration = 4000 + Math.random() * 1000;
    const startTime = performance.now();
    const startRot = currentRotation.current;
    const easeOut = (t) => 1 - Math.pow(1 - t, 4);

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOut(progress);
      const current = startRot + (targetRotation - startRot) * easedProgress;

      currentRotation.current = current;
      draw(current);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        const arc = (2 * Math.PI) / namesRef.current.length;
        const normalizedAngle =
          ((2 * Math.PI - (current % (2 * Math.PI))) + 2 * Math.PI) %
          (2 * Math.PI);
        const index = Math.floor(normalizedAngle / arc) % namesRef.current.length;
        onResult?.(namesRef.current[index]);
        onSpinEnd?.();
      }
    };

    animRef.current = requestAnimationFrame(animate);
  }, [draw, onResult, onSpinEnd, onSpinStart, spinning]);

  useImperativeHandle(ref, () => ({ spin }), [spin]);

  return (
    <div className="relative flex items-center justify-center">
      <div className="absolute -right-2 top-1/2 z-10 -translate-y-1/2">
        <div
          className="h-0 w-0"
          style={{
            borderTop: "16px solid transparent",
            borderBottom: "16px solid transparent",
            borderRight: "28px solid hsl(195, 80%, 45%)",
            filter: "drop-shadow(-2px 0 6px rgba(0,0,0,0.28))",
          }}
        />
      </div>

      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="cursor-pointer rounded-full"
        style={{
          width: size,
          height: size,
          filter: "drop-shadow(0 0 40px rgba(34, 211, 238, 0.18))",
        }}
        onClick={!spinning ? spin : undefined}
      />
    </div>
  );
});

export default SpinWheel;
