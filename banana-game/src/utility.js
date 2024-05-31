export function isPointInsideRect(point, rect) {
  return (
    point.x >= rect.left &&
    point.x <= rect.right &&
    point.y >= rect.top &&
    point.y <= rect.bottom
  );
}

export function isAnyPointInside(div1, div2) {
  const rect1 = div1.getBoundingClientRect();
  const rect2 = div2.getBoundingClientRect();

  const points = [
    { x: rect1.left, y: rect1.top },
    { x: rect1.right, y: rect1.top },
    { x: rect1.left, y: rect1.bottom },
    { x: rect1.right, y: rect1.bottom },
    { x: (rect1.left + rect1.right) / 2, y: (rect1.top + rect1.bottom) / 2 },
  ];

  return points.some((point) => isPointInsideRect(point, rect2));
}
