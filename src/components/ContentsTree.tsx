interface Props {
  headings: HeadingItem[];
  onSelect: (id: string) => void;
  selectedId: string;
}

export default function ContentsTree({ headings, onSelect, selectedId }: Props) {
  return (
    <div>
      <h3 className="font-semibold p-2">Contents</h3>
      <ul>
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
