import { Button } from "@/components/ui/button"
import { Play } from "lucide-react"

export function VideoDemoSection() {
  return (
    <section id="video-demo-section" className="py-20">
      <div className="container max-w-4xl mx-auto px-8 sm:px-12 lg:px-16">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-light text-foreground mb-4">
            A to-do app that tells you what to do.
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed max-w-4xl mx-auto">
            Hellafocused picks a task for you to work on. If you don't like it, you can reroll. If the task is too big,
            you can break it down until it's bite-sized.
          </p>
        </div>

        {/* Video Container */}
        <div className="relative">
          <div className="aspect-video bg-muted/20 rounded-2xl border border-border/50 overflow-hidden relative group cursor-pointer hover:shadow-2xl transition-all duration-300">
            {/* Video Thumbnail */}
            <img
              src="https://sjc.microlink.io/9YBdX_sY5-EUFAj8ybxXG5JS5i1_vdRzIpfwNj5tkjD8-aeMnW6fjWNAKuKI7p9FL2gzifeYVrtChfuV0oNsQw.jpeg"
              alt="Hellafocused demo video thumbnail"
              className="w-full h-full object-cover"
            />

            {/* Play Button Overlay */}
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-black/30 transition-all duration-300">
              <div className="bg-primary/90 hover:bg-primary text-primary-foreground rounded-full p-6 group-hover:scale-110 transition-all duration-300 shadow-2xl">
                <Play className="h-12 w-12 ml-1" />
              </div>
            </div>

            {/* Duration Badge */}
            <div className="absolute bottom-4 right-4 bg-black/80 text-white px-3 py-1 rounded text-sm font-medium">
              2:30
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center mt-8">
            <Button
              size="lg"
              variant="outline"
              className="px-8 py-4 text-lg rounded-full border-2 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300 bg-transparent"
            >
              <Play className="h-5 w-5 mr-2" />
              Watch Demo Video
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
