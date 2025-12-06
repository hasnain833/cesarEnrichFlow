const testimonials = [
  {
    handle: "@LangChainAI",
    content:
      "Build stateful conversational AI agents with LangGraph and EnrichFlow.",
    avatar: "L",
    color: "bg-emerald-600",
  },
  {
    handle: "@js_craft_hq",
    content:
      "A huge shoutout to @simonfarshid for the cool stuff he makes at EnrichFlow",
    avatar: "D",
    color: "bg-amber-600",
  },
  {
    handle: "@keithschacht",
    content:
      "A great set of pre-built react components for building chatbot experiences.",
    avatar: "K",
    color: "bg-purple-600",
  },
  {
    handle: "@HowardBGil",
    content:
      "Stop building chat interfaces yourself... Just install EnrichFlow and you're done.",
    avatar: "H",
    color: "bg-blue-600",
  },
  {
    handle: "@hwchase17",
    content:
      "Pleasure to work with Simon... bring streaming, gen UI, and human-in-the-loop with LangGraph Cloud + EnrichFlow.",
    avatar: "H",
    color: "bg-rose-600",
  },
  {
    handle: "@adamsilverman",
    content: "EnrichFlow powered by LangGraph! It is awesome.",
    avatar: "A",
    color: "bg-cyan-600",
  },
  {
    handle: "@hwchase17",
    content:
      "Pleasure to work with Simon... bring streaming, gen UI, and human-in-the-loop with LangGraph Cloud + EnrichFlow.",
    avatar: "H",
    color: "bg-rose-600",
  },
  {
    handle: "@adamsilverman",
    content: "EnrichFlow powered by LangGraph! It is awesome.",
    avatar: "A",
    color: "bg-cyan-600",
  },
  {
    handle: "@HowardBGil",
    content:
      "Stop building chat interfaces yourself... Just install EnrichFlow and you're done.",
    avatar: "H",
    color: "bg-blue-600",
  },
];

export const TestimonialsSection = () => {
  return (
    <section className="py-16 px-4">
      <div className="container mx-auto max-w-8xl rounded-md  relative">
        <div className="columns-1 md:columns-2 lg:columns-4 gap-4 space-y-4 cursor-pointer">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="break-inside-avoid p-4 rounded-xl border border-border bg-card hover:bg-surface-elevated transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full ${testimonial.color} flex items-center justify-center text-foreground text-sm font-medium`}>
                    {testimonial.avatar}
                  </div>
                  <span className="text-foreground text-sm font-medium">
                    {testimonial.handle}
                  </span>
                </div>
                <svg
                  viewBox="0 0 24 24"
                  className="w-4 h-4 text-muted-foreground fill-current"
                  aria-label="X (Twitter)">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {testimonial.content}
              </p>
            </div>
          ))}
        </div>
        {/* Bottom fade overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none bg-gradient-to-t from-background via-background/80 to-transparent"></div>
      </div>
    </section>
  );
};
