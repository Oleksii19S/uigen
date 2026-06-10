"use client";

import { useState } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { FileSystemProvider } from "@/lib/contexts/file-system-context";
import { ChatProvider } from "@/lib/contexts/chat-context";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { FileTree } from "@/components/editor/FileTree";
import { CodeEditor } from "@/components/editor/CodeEditor";
import { PreviewFrame } from "@/components/preview/PreviewFrame";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HeaderActions } from "@/components/HeaderActions";

interface MainContentProps {
  user?: {
    id: string;
    email: string;
  } | null;
  project?: {
    id: string;
    name: string;
    messages: any[];
    data: any;
    createdAt: Date;
    updatedAt: Date;
  };
}

export function MainContent({ user, project }: MainContentProps) {
  const [activeView, setActiveView] = useState<"preview" | "code">("preview");

  return (
    <FileSystemProvider initialData={project?.data}>
      <ChatProvider projectId={project?.id} initialMessages={project?.messages}>
        <div className="h-screen w-screen overflow-hidden bg-neutral-950">
          <ResizablePanelGroup direction="horizontal" className="h-full">
            {/* Left Panel - Chat */}
            <ResizablePanel defaultSize={35} minSize={25} maxSize={50}>
              <div className="h-full flex flex-col bg-neutral-900">
                {/* Chat Header */}
                <div className="h-14 flex items-center px-6 border-b border-neutral-800/60">
                  <h1 className="text-lg font-semibold text-neutral-100 tracking-tight">React Component Generator</h1>
                </div>

                {/* Chat Content */}
                <div className="flex-1 overflow-hidden">
                  <ChatInterface />
                </div>
              </div>
            </ResizablePanel>

            <ResizableHandle className="w-[1px] bg-neutral-800 hover:bg-neutral-700 transition-colors" />

            {/* Right Panel - Preview/Code */}
            <ResizablePanel defaultSize={65}>
              <div className="h-full flex flex-col bg-neutral-900">
                {/* Top Bar */}
                <div className="h-14 border-b border-neutral-800/60 px-6 flex items-center justify-between bg-neutral-950/50">
                  <Tabs
                    value={activeView}
                    onValueChange={(v) =>
                      setActiveView(v as "preview" | "code")
                    }
                  >
                    <TabsList className="bg-neutral-900/60 border border-neutral-800/60 p-0.5 h-9 shadow-sm">
                      <TabsTrigger value="preview" className="data-[state=active]:bg-neutral-800 data-[state=active]:text-neutral-100 data-[state=active]:shadow-sm text-neutral-400 px-4 py-1.5 text-sm font-medium transition-all">Preview</TabsTrigger>
                      <TabsTrigger value="code" className="data-[state=active]:bg-neutral-800 data-[state=active]:text-neutral-100 data-[state=active]:shadow-sm text-neutral-400 px-4 py-1.5 text-sm font-medium transition-all">Code</TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <HeaderActions user={user} projectId={project?.id} />
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-hidden bg-neutral-950">
                  {activeView === "preview" ? (
                    <div className="h-full bg-neutral-950">
                      <PreviewFrame />
                    </div>
                  ) : (
                    <ResizablePanelGroup
                      direction="horizontal"
                      className="h-full"
                    >
                      {/* File Tree */}
                      <ResizablePanel
                        defaultSize={30}
                        minSize={20}
                        maxSize={50}
                      >
                        <div className="h-full bg-neutral-950 border-r border-neutral-800">
                          <FileTree />
                        </div>
                      </ResizablePanel>

                      <ResizableHandle className="w-[1px] bg-neutral-800 hover:bg-neutral-700 transition-colors" />

                      {/* Code Editor */}
                      <ResizablePanel defaultSize={70}>
                        <div className="h-full bg-neutral-900">
                          <CodeEditor />
                        </div>
                      </ResizablePanel>
                    </ResizablePanelGroup>
                  )}
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </ChatProvider>
    </FileSystemProvider>
  );
}
