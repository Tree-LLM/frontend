interface Props {
  headings: HeadingItem[];
  onSelect: (id: string) => void;
  selectedId: string;
}

export default function ContentsTree({ headings, onSelect, selectedId }: Props) {
  return (
    <div className="px-2">
      <h2 className="font-bold text-2xl md:text-3xl mb-3">Contents</h2>
      <ul className="text-lg md:text-xl list-none m-0 p-0 space-y-3">
        {headings.map((h) => (
          <li
            key={h.id}
            style={{
              marginLeft: `${(h.level - 1) * 16}px`,
              cursor: 'pointer',
              fontWeight: selectedId === h.id ? 'bold' : 'normal',
              color: selectedId === h.id ? '#3B82F6' : 'black',
            }}
            onClick={() => onSelect(h.id)}
          >
            {h.title}
          </li>
        ))}
      </ul>
    </div>
  );
}
