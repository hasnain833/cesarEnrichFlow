import Image from "next/image";

const logos = [
  {
    img: "/langchain.svg",
    name: "LangChain",
  },
  {
    img: "/athenaintel.webp",
    name: "AthenaIntel",
  },
  {
    img: "/browseruse.svg",
    name: "BrowserUse",
  },
  {
    img: "/stack.svg",
    name: "Stack",
  },
];

export const LogoCloud = () => {
  return (
    <section className="py-12 px-4">
      <div className="container mx-auto max-w-8xl">
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 mb-4">
          {logos.map((logo, index) => (
            <div
              key={index}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-all duration-200 cursor-pointer group opacity-60 hover:opacity-100">
              <div className="relative w-36 h-36 md:w-44 md:h-44">
                <Image
                  src={logo.img}
                  alt={logo.name}
                  fill
                  className="object-contain filter grayscale group-hover:grayscale-0 transition-all duration-200"
                  sizes="(max-width: 768px) 144px, 176px"
                />
              </div>
            </div>
          ))}
        </div>
        <p className="text-center text-muted-foreground text-sm">
          and teams everywhere
        </p>
      </div>
    </section>
  );
};
