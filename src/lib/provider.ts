import { anthropic } from "@ai-sdk/anthropic";
import {
  LanguageModelV1,
  LanguageModelV1StreamPart,
  LanguageModelV1Message,
} from "@ai-sdk/provider";

const MODEL = "claude-haiku-4-5";

export class MockLanguageModel implements LanguageModelV1 {
  readonly specificationVersion = "v1" as const;
  readonly provider = "mock";
  readonly modelId: string;
  readonly defaultObjectGenerationMode = "tool" as const;

  constructor(modelId: string) {
    this.modelId = modelId;
  }

  private async delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private extractUserPrompt(messages: LanguageModelV1Message[]): string {
    // Find the last user message
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      if (message.role === "user") {
        const content = message.content;
        if (Array.isArray(content)) {
          // Extract text from content parts
          const textParts = content
            .filter((part: any) => part.type === "text")
            .map((part: any) => part.text);
          return textParts.join(" ");
        } else if (typeof content === "string") {
          return content;
        }
      }
    }
    return "";
  }

  private getLastToolResult(messages: LanguageModelV1Message[]): any {
    // Find the last tool message
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "tool") {
        const content = messages[i].content;
        if (Array.isArray(content) && content.length > 0) {
          return content[0];
        }
      }
    }
    return null;
  }

  private countCurrentTurnToolMessages(messages: LanguageModelV1Message[]): number {
    let lastUserIndex = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "user") { lastUserIndex = i; break; }
    }
    if (lastUserIndex === -1) return 0;
    return messages.slice(lastUserIndex + 1).filter((m) => m.role === "tool").length;
  }

  private async *generateMockStream(
    messages: LanguageModelV1Message[],
    userPrompt: string,
    turnId: string
  ): AsyncGenerator<LanguageModelV1StreamPart> {
    const toolMessageCount = this.countCurrentTurnToolMessages(messages);

    // Determine component type from the original user prompt
    const promptLower = userPrompt.toLowerCase();
    let componentType = "counter";
    let componentName = "Counter";

    if (promptLower.includes("form")) {
      componentType = "form";
      componentName = "ContactForm";
    } else if (promptLower.includes("card")) {
      componentType = "card";
      componentName = "Card";
    }

    // Step 1: Create component file
    if (toolMessageCount === 1) {
      const text = `I'll create a ${componentName} component for you.`;
      for (const char of text) {
        yield { type: "text-delta", textDelta: char };
        await this.delay(25);
      }

      yield {
        type: "tool-call",
        toolCallType: "function",
        toolCallId: `call_${turnId}_1`,
        toolName: "str_replace_editor",
        args: JSON.stringify({
          command: "create",
          path: `/components/${componentName}.jsx`,
          file_text: this.getComponentCode(componentType),
        }),
      };

      yield {
        type: "finish",
        finishReason: "tool-calls",
        usage: {
          promptTokens: 50,
          completionTokens: 30,
        },
      };
      return;
    }

    // Step 2: Enhance component
    if (toolMessageCount === 2) {
      const text = `Now let me enhance the component with better styling.`;
      for (const char of text) {
        yield { type: "text-delta", textDelta: char };
        await this.delay(25);
      }

      yield {
        type: "tool-call",
        toolCallType: "function",
        toolCallId: `call_${turnId}_2`,
        toolName: "str_replace_editor",
        args: JSON.stringify({
          command: "str_replace",
          path: `/components/${componentName}.jsx`,
          old_str: this.getOldStringForReplace(componentType),
          new_str: this.getNewStringForReplace(componentType),
        }),
      };

      yield {
        type: "finish",
        finishReason: "tool-calls",
        usage: {
          promptTokens: 50,
          completionTokens: 30,
        },
      };
      return;
    }

    // Step 3: Create App.jsx
    if (toolMessageCount === 0) {
      const text = `This is a static response. You can place an Anthropic API key in the .env file to use the Anthropic API for component generation. Let me create an App.jsx file to display the component.`;
      for (const char of text) {
        yield { type: "text-delta", textDelta: char };
        await this.delay(15);
      }

      yield {
        type: "tool-call",
        toolCallType: "function",
        toolCallId: `call_${turnId}_3`,
        toolName: "str_replace_editor",
        args: JSON.stringify({
          command: "create",
          path: "/App.jsx",
          file_text: this.getAppCode(componentName),
        }),
      };

      yield {
        type: "finish",
        finishReason: "tool-calls",
        usage: {
          promptTokens: 50,
          completionTokens: 30,
        },
      };
      return;
    }

    // Step 4: Final summary (no tool call)
    if (toolMessageCount >= 3) {
      const text = `Perfect! I've created:

1. **${componentName}.jsx** - A fully-featured ${componentType} component
2. **App.jsx** - The main app file that displays the component

The component is now ready to use. You can see the preview on the right side of the screen.`;

      for (const char of text) {
        yield { type: "text-delta", textDelta: char };
        await this.delay(30);
      }

      yield {
        type: "finish",
        finishReason: "stop",
        usage: {
          promptTokens: 50,
          completionTokens: 50,
        },
      };
      return;
    }
  }

  private getComponentCode(componentType: string): string {
    switch (componentType) {
      case "form":
        return `import { useState } from 'react';

const ContactForm = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
  };

  if (sent) {
    return (
      <div className="bg-zinc-900 rounded-2xl p-8 border border-white/10 max-w-md w-full text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
          <span className="text-emerald-400 text-xl">✓</span>
        </div>
        <h3 className="text-white font-semibold text-lg mb-2">Message sent</h3>
        <p className="text-white/50 text-sm">We'll get back to you within 24 hours.</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 rounded-2xl p-8 border border-white/10 max-w-md w-full">
      <h2 className="text-white text-2xl font-bold mb-1">Get in touch</h2>
      <p className="text-white/50 text-sm mb-6">We reply to every message.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-white/60 text-xs font-medium mb-1.5 uppercase tracking-wider">Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Your name"
            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-violet-500/60 focus:bg-white/8 transition-all text-sm"
          />
        </div>
        <div>
          <label className="block text-white/60 text-xs font-medium mb-1.5 uppercase tracking-wider">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="you@example.com"
            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-violet-500/60 transition-all text-sm"
          />
        </div>
        <div>
          <label className="block text-white/60 text-xs font-medium mb-1.5 uppercase tracking-wider">Message</label>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            required
            rows={4}
            placeholder="How can we help?"
            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-violet-500/60 transition-all text-sm resize-none"
          />
        </div>
        <button
          type="submit"
          className="w-full py-2.5 rounded-lg bg-gradient-to-r from-violet-500 to-indigo-500 text-white font-medium text-sm hover:opacity-90 transition-opacity"
        >
          Send message
        </button>
      </form>
    </div>
  );
};

export default ContactForm;`;

      case "card":
        return `import { useState } from 'react';

const Card = () => {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <div className="bg-zinc-900 rounded-2xl overflow-hidden border border-white/10 w-80">
      <div className="relative">
        <div className="h-48 bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
            <span className="text-3xl">✦</span>
          </div>
        </div>
        <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-sm rounded-full px-2.5 py-1 text-xs text-white/80 border border-white/10">
          Featured
        </div>
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-white font-semibold text-lg leading-tight">Aurora Pro</h3>
            <p className="text-white/50 text-sm mt-0.5">Design toolkit</p>
          </div>
          <span className="text-violet-400 font-bold text-lg">$49</span>
        </div>
        <p className="text-white/60 text-sm leading-relaxed mb-4">
          A curated set of components and templates built for modern product teams.
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setLiked(!liked)}
            className={\`flex-1 py-2 rounded-lg text-sm font-medium transition-all \${liked ? 'bg-violet-500 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'}\`}
          >
            {liked ? '♥ Liked' : '♡ Like'}
          </button>
          <button
            onClick={() => setSaved(!saved)}
            className={\`flex-1 py-2 rounded-lg text-sm font-medium transition-all \${saved ? 'bg-indigo-500 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'}\`}
          >
            {saved ? '✓ Saved' : '+ Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Card;`;

      default:
        return `import { useState } from 'react';

const Counter = () => {
  const [count, setCount] = useState(0);

  return (
    <div className="flex flex-col items-center gap-8 px-10 py-10 bg-zinc-900 rounded-2xl border border-white/10">
      <div className="text-center">
        <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Count</p>
        <div className={\`text-7xl font-bold tabular-nums transition-all \${count > 0 ? 'text-violet-400' : count < 0 ? 'text-rose-400' : 'text-white'}\`}>
          {count}
        </div>
      </div>
      <div className="flex gap-3">
        <button
          onClick={() => setCount(c => c - 1)}
          className="w-11 h-11 rounded-full bg-white/5 border border-white/10 text-white/70 text-xl hover:bg-white/10 hover:text-white transition-all"
        >
          −
        </button>
        <button
          onClick={() => setCount(0)}
          className="px-5 h-11 rounded-full bg-white/5 border border-white/10 text-white/50 text-sm hover:bg-white/10 hover:text-white transition-all"
        >
          Reset
        </button>
        <button
          onClick={() => setCount(c => c + 1)}
          className="w-11 h-11 rounded-full bg-violet-500 text-white text-xl hover:bg-violet-400 transition-all"
        >
          +
        </button>
      </div>
    </div>
  );
};

export default Counter;`;
    }
  }

  private getOldStringForReplace(componentType: string): string {
    switch (componentType) {
      case "form":
        return "    console.log('Form submitted:', formData);";
      case "card":
        return '    <div className="bg-zinc-900 rounded-2xl overflow-hidden border border-white/10 w-80">';
      default:
        return "  const increment = () => setCount(count + 1);";
    }
  }

  private getNewStringForReplace(componentType: string): string {
    switch (componentType) {
      case "form":
        return "    console.log('Form submitted:', formData);\n    alert('Thank you! We\\'ll get back to you soon.');";
      case "card":
        return '    <div className="bg-zinc-900 rounded-2xl overflow-hidden border border-white/5 w-80">';
      default:
        return "  const increment = () => setCount(prev => prev + 1);";
    }
  }

  private getAppCode(componentName: string): string {
    return `import ${componentName} from '@/components/${componentName}';

export default function App() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-8">
      <${componentName} />
    </div>
  );
}`;
  }

  async doGenerate(
    options: Parameters<LanguageModelV1["doGenerate"]>[0]
  ): Promise<Awaited<ReturnType<LanguageModelV1["doGenerate"]>>> {
    const userPrompt = this.extractUserPrompt(options.prompt);

    // Collect all stream parts
    const parts: LanguageModelV1StreamPart[] = [];
    const turnId = Math.random().toString(36).slice(2, 8);
    for await (const part of this.generateMockStream(
      options.prompt,
      userPrompt,
      turnId
    )) {
      parts.push(part);
    }

    // Build response from parts
    const textParts = parts
      .filter((p) => p.type === "text-delta")
      .map((p) => (p as any).textDelta)
      .join("");

    const toolCalls = parts
      .filter((p) => p.type === "tool-call")
      .map((p) => ({
        toolCallType: "function" as const,
        toolCallId: (p as any).toolCallId,
        toolName: (p as any).toolName,
        args: (p as any).args,
      }));

    // Get finish reason from finish part
    const finishPart = parts.find((p) => p.type === "finish") as any;
    const finishReason = finishPart?.finishReason || "stop";

    return {
      text: textParts,
      toolCalls,
      finishReason: finishReason as any,
      usage: {
        promptTokens: 100,
        completionTokens: 200,
      },
      warnings: [],
      rawCall: {
        rawPrompt: options.prompt,
        rawSettings: {
          maxTokens: options.maxTokens,
          temperature: options.temperature,
        },
      },
    };
  }

  async doStream(
    options: Parameters<LanguageModelV1["doStream"]>[0]
  ): Promise<Awaited<ReturnType<LanguageModelV1["doStream"]>>> {
    const userPrompt = this.extractUserPrompt(options.prompt);
    const turnId = Math.random().toString(36).slice(2, 8);
    const self = this;

    const stream = new ReadableStream<LanguageModelV1StreamPart>({
      async start(controller) {
        try {
          const generator = self.generateMockStream(options.prompt, userPrompt, turnId);
          for await (const chunk of generator) {
            controller.enqueue(chunk);
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return {
      stream,
      warnings: [],
      rawCall: {
        rawPrompt: options.prompt,
        rawSettings: {},
      },
      rawResponse: { headers: {} },
    };
  }
}

export function getLanguageModel() {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();

  if (!apiKey || apiKey === "your-api-key-here") {
    console.log(
      "ANTHROPIC_API_KEY is not set (or is still the placeholder). " +
        "Using the mock provider — responses will be canned. " +
        "Set a real key in .env to generate components with Claude."
    );
    return new MockLanguageModel("mock-" + MODEL);
  }

  return anthropic(MODEL);
}
