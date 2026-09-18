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
  g.lineStyle(7 * pulse, color, 0.22);
  for (let i = 1; i < pts.length; i += 1) g.lineBetween(pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y);
  g.lineStyle(3.2 * pulse, 0xffffff, 0.75);
  for (let i = 1; i < pts.length; i += 1) g.lineBetween(pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y);
  const last = pts[pts.length - 1];
  g.fillStyle(color, 0.85);
  g.fillCircle(last.x, last.y, 4.5 * pulse);
}
