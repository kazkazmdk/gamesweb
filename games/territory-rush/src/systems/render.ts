/** Large authored capture loop: ~32×18 box (~40% of the 48×28 map). */
export function authoredCaptureLoop(cols = 48, rows = 28): Array<{ x: number; y: number }> {
  const x0 = 8;
  const y0 = 5;
  const w = 32;
  const h = 18;
  const pts: Array<{ x: number; y: number }> = [];
  const push = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= cols || y >= rows) return;
    pts.push({ x, y });
  };
  for (let x = x0; x < x0 + w; x += 1) push(x, y0);
  for (let y = y0 + 1; y < y0 + h; y += 1) push(x0 + w - 1, y);
  for (let x = x0 + w - 2; x >= x0; x -= 1) push(x, y0 + h - 1);
  for (let y = y0 + h - 2; y > y0; y -= 1) push(x0, y);
  return pts;
}

export function contourSpans(grid: number[], cols: number, rows: number, owner: number) {
  const spans: Array<{ x: number; y: number; w: number }> = [];
  for (let y = 0; y < rows; y += 1) {
    let x = 0;
    while (x < cols) {
      if (grid[y * cols + x] !== owner) {
        x += 1;
        continue;
      }
      const start = x;
      while (x < cols && grid[y * cols + x] === owner) x += 1;
      spans.push({ x: start, y, w: x - start });
    }
  }
  return spans;
}

export function ribbonPoints(cells: Array<{ x: number; y: number }>, cell: number) {
  return cells.map((c) => ({ x: c.x * cell + cell / 2, y: c.y * cell + cell / 2 }));
}

export function drawRibbon(
  g: { lineStyle: (w: number, c: number, a?: number) => void; lineBetween: (x1: number, y1: number, x2: number, y2: number) => void; fillStyle: (c: number, a?: number) => void; fillCircle: (x: number, y: number, r: number) => void },
  pts: Array<{ x: number; y: number }>,
  color: number,
  pulse = 1,
) {
  if (pts.length < 2) return;
  g.lineStyle(14 * pulse, color, 0.38);
  for (let i = 1; i < pts.length; i += 1) g.lineBetween(pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y);
  g.lineStyle(7.5 * pulse, 0xffffff, 0.95);
  for (let i = 1; i < pts.length; i += 1) g.lineBetween(pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y);
  g.lineStyle(3.4 * pulse, color, 1);
  for (let i = 1; i < pts.length; i += 1) g.lineBetween(pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y);
  const last = pts[pts.length - 1];
  g.fillStyle(0xffffff, 1);
  g.fillCircle(last.x, last.y, 7.2 * pulse);
  g.fillStyle(color, 0.95);
  g.fillCircle(last.x, last.y, 4.8 * pulse);
}
