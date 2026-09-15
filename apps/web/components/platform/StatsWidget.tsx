export function StatsWidget({
  items,
}: {
  items: Array<{ value: string | number; label: string }>;
}) {
  return (
    <ul className="flex flex-wrap gap-x-8 gap-y-4">
      {items.map((item) => (
        <li key={item.label}>
          <p className="metric text-[36px] md:text-[44px]">{item.value}</p>
          <p className="meta mt-1">{item.label}</p>
        </li>
      ))}
    </ul>
  );
}
