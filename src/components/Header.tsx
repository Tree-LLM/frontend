import { Button } from "./ui/button";

interface HeaderProps {
  onClickGenerate: () => void;
}

export default function Header({ onClickGenerate }: HeaderProps) {
  return (
  <header className="bg-[#EDEDED] py-4 w-full flex items-center">
  <div className="ml-16">
    <h1 className="text-4xl font-bold text-black tracking-tight">
      TreeLLM
    </h1>
  </div>


  <div className="ml-auto mr-16">
    <Button
  variant="default"
  size="lg"
  onClick={onClickGenerate}
  className="text-xl font-semibold">
      Modify Suggestion
    </Button>
  </div>
</header>
  );
}
