"use client";

import { useState, useEffect, useRef } from "react";
import { useMutation } from "@apollo/client";
import { gql } from "@apollo/client";
import { PaperAirplaneIcon, XMarkIcon, ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
import { useProject } from "@/contexts/ProjectContext";
import { useApplicationContext } from "@/hooks/useApplicationContext";

const ASK_AI_ASSISTANT = gql`
  mutation AskAIAssistant($input: AIAssistantCommandInput!) {
    askAIAssistant(input: $input) {
      success
      message
      operations {
        type
        result
        error
      }
    }
  }
`;

interface ChatMessage {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface Operation {
  type: string;
  result?: string;
  error?: string;
}

interface AIAssistantResponse {
  success: boolean;
  message: string;
  operations: Operation[];
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [dimensions, setDimensions] = useState({ width: 384, height: 500 }); // Default: w-96 (384px), max-h-[500px]
  const [position, setPosition] = useState({ bottom: 16, right: 16 }); // Default: bottom-4 right-4
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<'top' | 'left' | 'top-left' | null>(null);
  const { context: appContext } = useApplicationContext();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const [askAIAssistant] = useMutation<{
    askAIAssistant: AIAssistantResponse;
  }>(ASK_AI_ASSISTANT);

  // Auto-scroll functionality
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 5; // 5px threshold
      setIsAtBottom(isAtBottom);
    }
  };

  // Auto-scroll when new messages are added and user is at bottom
  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom();
    }
  }, [messages, isAtBottom]);

  // Reset to bottom when opening chat
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        scrollToBottom();
        setIsAtBottom(true);
      }, 100);
    }
  }, [isOpen]);

  // Resize functionality
  const handleMouseDown = (e: React.MouseEvent, direction: 'top' | 'left' | 'top-left') => {
    e.preventDefault();
    setIsResizing(true);
    setResizeDirection(direction);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !popupRef.current) return;

      const rect = popupRef.current.getBoundingClientRect();
      const minWidth = 320;
      const maxWidth = window.innerWidth - position.right - 16; // Account for right margin
      const minHeight = 300;
      const maxHeight = window.innerHeight - position.bottom - 16; // Account for bottom margin

      if (resizeDirection === 'left' || resizeDirection === 'top-left') {
        const newWidth = Math.min(maxWidth, Math.max(minWidth, rect.right - e.clientX));
        setDimensions(prev => ({ ...prev, width: newWidth }));
      }

      if (resizeDirection === 'top' || resizeDirection === 'top-left') {
        const newHeight = Math.min(maxHeight, Math.max(minHeight, rect.bottom - e.clientY));
        setDimensions(prev => ({ ...prev, height: newHeight }));
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeDirection(null);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = resizeDirection === 'left' ? 'ew-resize' : 
                                   resizeDirection === 'top' ? 'ns-resize' : 'nwse-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, resizeDirection, dimensions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsProcessing(true);

    try {
      const { data } = await askAIAssistant({
        variables: {
          input: {
            command: userMessage.content,
            projectId: appContext.projectId,
            currentMode: appContext.currentMode,
            contextData: JSON.stringify({
              projectName: appContext.projectName,
              availableFixtures: appContext.availableFixtures,
              availableScenes: appContext.availableScenes,
              availableCueLists: appContext.availableCueLists,
            }),
          },
        },
      });

      const response = data?.askAIAssistant;
      if (response) {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: "assistant",
          content: response.message,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);

        // If there were operations performed, show a summary
        if (response.operations && response.operations.length > 0) {
          const operationsSummary = response.operations
            .map((op) => {
              if (op.error) {
                return `❌ ${op.type}: ${op.error}`;
              }
              return `✅ ${op.type}: Completed successfully`;
            })
            .join("\n");

          const operationsMessage: ChatMessage = {
            id: (Date.now() + 2).toString(),
            type: "assistant",
            content: `Operations performed:\n${operationsSummary}`,
            timestamp: new Date(),
          };

          setMessages((prev) => [...prev, operationsMessage]);
        }
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: `Sorry, I encountered an error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      {/* Floating AI Assistant Icon */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed w-14 h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-50"
          style={{ bottom: `${position.bottom}px`, right: `${position.right}px` }}
          aria-label="Open AI Assistant"
        >
          <ChatBubbleLeftRightIcon className="h-6 w-6" />
        </button>
      )}

      {/* AI Assistant Popup */}
      {isOpen && (
        <div 
          ref={popupRef}
          className="fixed bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 flex flex-col z-50"
          style={{ 
            bottom: `${position.bottom}px`,
            right: `${position.right}px`,
            width: `${dimensions.width}px`, 
            height: `${dimensions.height}px`,
            minWidth: '320px',
            minHeight: '300px'
          }}
        >
          {/* Header */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                AI Assistant
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {appContext.currentMode === 'fixtures' && 'Managing fixtures'}
                {appContext.currentMode === 'scenes' && 'Working with scenes'}
                {appContext.currentMode === 'cues' && 'Editing cue lists'}
                {appContext.currentMode === 'overview' && 'Project overview'}
                {appContext.projectName && ` • ${appContext.projectName}`}
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              aria-label="Close AI Assistant"
            >
              <XMarkIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Messages */}
          <div 
            ref={messagesContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-3 space-y-2"
            style={{ minHeight: '192px' }} // min-h-48 equivalent
          >
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 text-sm mt-8">
                <p>🤖 AI Assistant ready to help!</p>
                <p className="mt-2">
                  {appContext.currentMode === 'fixtures' && 'Try: "Add 6 Chauvet SlimPAR fixtures" or "Show me fixture details"'}
                  {appContext.currentMode === 'scenes' && 'Try: "Create a warm wash scene" or "Make all fixtures blue"'}
                  {appContext.currentMode === 'cues' && 'Try: "Add a 5-second fade cue" or "Optimize cue timing"'}
                  {appContext.currentMode === 'overview' && 'Try: "Create a new project" or "Show project status"'}
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.type === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                      message.type === "user"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    }`}
                  >
                    <p className="whitespace-pre-line">{message.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        message.type === "user"
                          ? "text-blue-100"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))
            )}
            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 rounded-lg text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    <span>Processing...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your command..."
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                disabled={isProcessing}
              />
              <button
                type="submit"
                disabled={!input.trim() || isProcessing}
                className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <PaperAirplaneIcon className="h-4 w-4" />
              </button>
            </div>
          </form>

          {/* Resize Handles */}
          {/* Top resize handle */}
          <div
            className="absolute left-0 right-0 top-0 h-1 cursor-ns-resize hover:bg-blue-500 hover:bg-opacity-50 transition-colors"
            onMouseDown={(e) => handleMouseDown(e, 'top')}
          />
          
          {/* Left resize handle */}
          <div
            className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-blue-500 hover:bg-opacity-50 transition-colors"
            onMouseDown={(e) => handleMouseDown(e, 'left')}
          />
          
          {/* Top-left corner resize handle */}
          <div
            className="absolute left-0 top-0 w-3 h-3 cursor-nwse-resize hover:bg-blue-500 hover:bg-opacity-50 transition-colors"
            onMouseDown={(e) => handleMouseDown(e, 'top-left')}
          />
        </div>
      )}
    </>
  );
}