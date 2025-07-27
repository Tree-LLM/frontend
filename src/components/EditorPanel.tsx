import React from 'react';

interface EditorPanelProps {
  title: string;
  content: string;
}

const EditorPanel: React.FC<EditorPanelProps> = ({ title, content }) => {
  return (
    <div className="p-4 overflow-y-auto bg-white">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <pre className="bg-gray-50 p-4 rounded text-lg text-gray-800 whitespace-pre-wrap">
        {content}
      </pre>
    </div>
  );
};

export default EditorPanel;
