import { Button } from "@/components/ui/button"
import { Play } from "lucide-react"
import { useState, useRef } from "react"

export function VideoDemoSection() {
  const [showOverlay, setShowOverlay] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)

  const handlePlayClick = () => {
    if (videoRef.current) {
      videoRef.current.play()
      setShowOverlay(false)
    }
  }

  const handleVideoClick = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play()
      } else {
        videoRef.current.pause()
      }
    }
  }

  const handleVideoEnd = () => {
    setShowOverlay(true)
  }

  const handleVideoPause = () => {
    // Keep overlay hidden while paused - user can still use controls
  }

  return (
    <section id="video-demo-section" className="py-20">
      <div className="container max-w-4xl mx-auto px-8 sm:px-12 lg:px-16">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-light text-foreground mb-4">
            A to-do app that tells you what to do.
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed max-w-4xl mx-auto">
            Hellafocused picks a task for you to work on. If you don&apos;t like it, you can reroll. If the task is too big,
            you can break it down until it&apos;s bite-sized.
          </p>
        </div>

        {/* Video Container */}
        <div className="relative">
          <div className="aspect-video bg-muted/20 rounded-2xl border border-border/50 overflow-hidden relative group cursor-pointer hover:shadow-2xl transition-all duration-300">
            {/* Video */}
            <video
              ref={videoRef}
              src="/heroDemo_dark.mp4"
              className="w-full h-full object-cover"
              controls={!showOverlay}
              preload="metadata"
              poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 450'%3E%3Crect width='800' height='450' fill='%23000'/%3E%3C/svg%3E"
              onClick={handleVideoClick}
              onEnded={handleVideoEnd}
              onPause={handleVideoPause}
            >
              Your browser does not support the video tag.
            </video>

            {/* Play Button Overlay - only show when not playing */}
            {showOverlay && (
              <div 
                className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-black/30 transition-all duration-300"
                onClick={handlePlayClick}
              >
                <div className="bg-primary/90 hover:bg-primary text-primary-foreground rounded-full p-6 group-hover:scale-110 transition-all duration-300 shadow-2xl">
                  <Play className="h-12 w-12 ml-1" />
                </div>
              </div>
            )}

            {/* Duration Badge - only show when overlay is visible */}
            {showOverlay && (
              <div className="absolute bottom-4 right-4 bg-black/80 text-white px-3 py-1 rounded text-sm font-medium">
                2:30
              </div>
            )}
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
