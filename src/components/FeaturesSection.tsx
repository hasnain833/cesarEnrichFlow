import { MessageSquare, Settings, Zap, Terminal } from "lucide-react";

const features = [
  {
    icon: MessageSquare,
    title: "Instant Chat UI",
    description: "Drop in ChatGPT-style UX with theming and sensible defaults.",
  },
  {
    icon: Settings,
    title: "State Management",
    description: "Streaming, interruptions, retries, and multi-turn conversations.",
  },
  {
    icon: Zap,
    title: "High Performance",
    description: "Optimized rendering and minimal bundle size for responsive streaming.",
  },
  {
    icon: Terminal,
    title: "Works Everywhere",
    description: "Vercel AI SDK, LangChain, or any LLM provider. React-based.",
  },
];

export const FeaturesSection = () => {
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-8xl">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Everything you need to ship{" "}
            <span className="text-gradient">AI chat</span>
          </h2>
          <p className="text-muted-foreground">
            Production-ready components and state management.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-6"
            >
              <feature.icon className="w-6 h-6 text-foreground mb-4" />
              <h3 className="text-foreground font-semibold mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
