interface EditorPanelProps {
  title: string;
  content: string;
  headings: HeadingItem[];
  selectedId: string;
}

export default function EditorPanel({ title, content, headings, selectedId }: EditorPanelProps) {
  const lines = content.split('\n');

  return (
    <div className="p-4 whitespace-pre-wrap">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      {lines.map((line, index) => {
        const heading = headings.find((h) => h.id === `heading-${index}`);
        if (heading) {
          return (
            <h3
              key={index}
              id={heading.id}
              className={`font-bold mt-4 ${
                selectedId === heading.id ? 'text-blue-500' : ''
              }`}
            >
              {line}
            </h3>
          );
        }
        return <p key={index}>{line}</p>;
      })}
    </div>
  );
}
