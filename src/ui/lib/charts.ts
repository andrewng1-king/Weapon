import { GROUP_COLORS } from '@/domain/sports';

function css(v: string, fallback: string): string {
  if (typeof document === 'undefined') return fallback;
  return getComputedStyle(document.body).getPropertyValue(v).trim() || fallback;
}

function accent() { return css('--accent', '#c2a878'); }
function accentRGB() { return css('--accent-rgb', '194,168,120'); }
function accentInk() { return css('--accent-ink', '#15120b'); }
function cGrid() { return css('--grid', 'rgba(255,255,255,.10)'); }
function cInk() { return css('--ink', '#e9e7e3'); }
function cFaint() { return css('--faint', '#6a6a67'); }
function cTrack() { return css('--track', 'rgba(255,255,255,.08)'); }
function cMuted() { return css('--muted', '#9b9a96'); }

export function drawGauge(ctx: CanvasRenderingContext2D, W: number, H: number, pct: number) {
  const cx = W / 2, cy = H - 14, R = Math.max(0, Math.min(W / 2 - 12, H - 26));
  const segs = 30;

  for (let i = 0; i < segs; i++) {
    const t = i / (segs - 1);
    const ang = Math.PI + Math.PI * t;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(ang);
    ctx.fillStyle = t <= pct ? accent() : cGrid();
    ctx.beginPath();
    ctx.roundRect(R - 20, -4.5, 16, 9, 3);
    ctx.fill();
    ctx.restore();
  }
}

export function drawWeek(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  days: string[],
  trained: boolean[],
  today: string,
  selectedIdx?: number,
) {
  const a = accent();
  const r = 14;
  const gap = (W - days.length * r * 2) / (days.length + 1);

  days.forEach((d, i) => {
    const x = gap + r + i * (r * 2 + gap);
    const y = H / 2;
    if (selectedIdx === i) {
      ctx.beginPath();
      ctx.arc(x, y, r + 3, 0, Math.PI * 2);
      ctx.strokeStyle = a;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = trained[i]
      ? (d === today ? a : `rgba(${accentRGB()},.3)`)
      : cTrack();
    ctx.fill();

    ctx.fillStyle = trained[i] ? (d === today ? accentInk() : cInk()) : cFaint();
    ctx.font = '600 11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(+d.slice(-2)), x, y);
  });
}

export function drawSplit(ctx: CanvasRenderingContext2D, W: number, H: number, counts: Record<string, number>) {
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (!entries.length) return;
  const total = entries.reduce((s, [, c]) => s + c, 0) || 1;
  const max = entries[0][1] || 1;
  const barH = 18;
  const gap = 10;
  const labelW = 80;
  const valW = 40;

  entries.forEach(([g, c], i) => {
    const y = 10 + i * (barH + gap);

    ctx.fillStyle = cFaint();
    ctx.font = '600 11px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(g, 0, y + barH / 2);

    const trackW = W - labelW - valW;
    ctx.fillStyle = cGrid();
    ctx.beginPath();
    ctx.roundRect(labelW, y, trackW, barH, 4);
    ctx.fill();

    const barW = trackW * (c / max);
    ctx.fillStyle = GROUP_COLORS[g] || '#888';
    ctx.beginPath();
    ctx.roundRect(labelW, y, barW, barH, 4);
    ctx.fill();

    ctx.fillStyle = cMuted();
    ctx.font = '700 11px Archivo, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.round(c / total * 100)}%`, W, y + barH / 2);
  });
}

export function lineChart(ctx: CanvasRenderingContext2D, W: number, H: number, data: { d: string; v: number }[]) {
  if (!data.length) return;

  const pad = { t: 16, b: 28, l: 36, r: 14 };
  const cW = W - pad.l - pad.r;
  const cH = H - pad.t - pad.b;

  if (data.length === 1) {
    const x = pad.l + cW / 2, y = pad.t + cH / 2;
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fillStyle = accent();
    ctx.fill();
    ctx.fillStyle = cInk();
    ctx.font = '700 12px Archivo, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${data[0].v} kg`, x, y - 14);
    return;
  }

  const max = Math.max(...data.map((p) => p.v)) || 1;
  const min = Math.min(...data.map((p) => p.v));
  const range = max - min || 1;

  for (let i = 0; i <= 4; i++) {
    const y = pad.t + (cH * i) / 4;
    ctx.beginPath();
    ctx.moveTo(pad.l, y);
    ctx.lineTo(W - pad.r, y);
    ctx.strokeStyle = cGrid();
    ctx.lineWidth = 1;
    ctx.stroke();

    const val = Math.round(max - (range * i) / 4);
    ctx.fillStyle = cFaint();
    ctx.font = '600 9px Archivo, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(val), pad.l - 6, y);
  }

  const points = data.map((p, i) => ({
    x: pad.l + (i / (data.length - 1)) * cW,
    y: pad.t + cH - ((p.v - min) / range) * cH,
  }));

  const grad = ctx.createLinearGradient(0, pad.t, 0, H - pad.b);
  grad.addColorStop(0, `rgba(${accentRGB()},.28)`);
  grad.addColorStop(1, `rgba(${accentRGB()},0)`);

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  points.slice(1).forEach((p) => ctx.lineTo(p.x, p.y));
  ctx.strokeStyle = accent();
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.stroke();

  ctx.lineTo(points[points.length - 1].x, H - pad.b);
  ctx.lineTo(points[0].x, H - pad.b);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  points.forEach((p) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = accent();
    ctx.fill();
  });

  const last = points[points.length - 1];
  ctx.fillStyle = cInk();
  ctx.font = '700 11px Archivo, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`${data[data.length - 1].v} kg`, last.x, last.y - 10);

  ctx.fillStyle = cFaint();
  ctx.font = '600 9px Inter, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(data[0].d.slice(5), points[0].x, H - pad.b + 14);
  ctx.textAlign = 'right';
  ctx.fillText(data[data.length - 1].d.slice(5), last.x, H - pad.b + 14);
}

export function drawRadar(ctx: CanvasRenderingContext2D, W: number, H: number, labels: string[], counts: Record<string, number>) {
  const cx = W / 2, cy = H / 2;
  const R = Math.min(cx, cy) - 30;
  const n = labels.length;
  const max = Math.max(...Object.values(counts), 1);
  const angleStep = (Math.PI * 2) / n;

  for (let ring = 1; ring <= 4; ring++) {
    const r = R * ring / 4;
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const a = -Math.PI / 2 + i * angleStep;
      const x = cx + r * Math.cos(a);
      const y = cy + r * Math.sin(a);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.strokeStyle = cTrack();
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  ctx.beginPath();
  labels.forEach((_, i) => {
    const a = -Math.PI / 2 + i * angleStep;
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + R * Math.cos(a), cy + R * Math.sin(a));
  });
  ctx.strokeStyle = cTrack();
  ctx.stroke();

  const verts: { x: number; y: number }[] = [];
  ctx.beginPath();
  labels.forEach((g, i) => {
    const val = (counts[g] || 0) / max;
    const a = -Math.PI / 2 + i * angleStep;
    const x = cx + R * val * Math.cos(a);
    const y = cy + R * val * Math.sin(a);
    verts.push({ x, y });
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fillStyle = `rgba(${accentRGB()},.18)`;
  ctx.fill();
  ctx.strokeStyle = accent();
  ctx.lineWidth = 1.8;
  ctx.stroke();

  verts.forEach((v) => {
    ctx.beginPath();
    ctx.arc(v.x, v.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = accent();
    ctx.fill();
  });

  labels.forEach((g, i) => {
    const a = -Math.PI / 2 + i * angleStep;
    const x = cx + (R + 18) * Math.cos(a);
    const y = cy + (R + 18) * Math.sin(a);
    ctx.fillStyle = cMuted();
    ctx.font = '600 10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(g, x, y);
  });
}
