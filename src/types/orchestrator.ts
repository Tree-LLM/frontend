// frontend/src/types/orchestrator.ts
export type OrchestratorResponse = {
  steps: {
    split?: any;
    build?: any;
    fuse?: any;
    audit?: { suggestion?: string; details?: string };
    editPass1?: { suggestion?: string };
    globalCheck?: { suggestion?: string };
    editPass2?: { suggestion?: string };
    finalize?: { finalText: string };
  };
  suggestion?: string;
  finalText?: string;
};
