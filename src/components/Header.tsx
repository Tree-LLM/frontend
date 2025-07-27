import { Button } from "./ui/button";

interface HeaderProps {
  onClickGenerate: () => void;
  currentFileUrl: string;
  currentFileName: string;
}

export default function Header({ onClickGenerate, currentFileUrl, currentFileName }: HeaderProps) {
  return (
    <header className="bg-[#EDEDED] py-4 w-full flex items-center">
      <div className="ml-16 flex items-center space-x-3">
        <img src="/TREE.png" alt="Logo" className="w-20 h-20" />
        <h1 className="text-5xl font-bold text-black tracking-tight">TreePaper</h1>
      </div>

      <div className="ml-auto mr-16 flex space-x-4">
        <Button
          variant="default"
          size="lg"
          onClick={onClickGenerate}
          className="text-3xl font-bold px-10 py-8"
        >
          Modify Suggestion
        </Button>
        <a
          href={currentFileUrl}
          download={currentFileName}
          className="bg-gray-300 hover:bg-gray-400 text-black font-medium py-4 px-6 rounded-lg text-xl"
        >
          Download Current File
        </a>
      </div>
    </header>
  );
}
