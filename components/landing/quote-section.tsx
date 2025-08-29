"use client"

export function QuoteSection() {
  return (
    <section className="pt-64 pb-32 bg-gradient-to-b from-transparent via-background to-transparent">
      <div className="container max-w-4xl mx-auto px-8">
        <div className="relative">
          {/* Decorative elements - multiple quotes for comedic effect */}
          <div className="absolute inset-0 flex items-center justify-center opacity-5">
            <div className="text-[200px] font-serif text-foreground">&ldquo;</div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center -translate-x-32 -translate-y-20">
            <div className="text-[150px] font-serif text-rose-500/30 animate-spin" style={{ animationDuration: '8s', animationTimingFunction: 'cubic-bezier(0.4, 0, 0.6, 1)' }}>&ldquo;</div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center translate-x-40 translate-y-24">
            <div className="text-[180px] font-serif text-blue-500/30 animate-spin" style={{ animationDuration: '10s', animationDirection: 'reverse' }}>&ldquo;</div>
          </div>
          
          {/* Quote content */}
          <div className="relative text-center space-y-6">
            <blockquote className="text-2xl sm:text-3xl lg:text-4xl font-light text-foreground/90 leading-relaxed">
              Hellafocused is the best productivity app I&apos;ve ever used.
            </blockquote>
            
            <cite className="block text-sm text-muted-foreground font-medium tracking-wider uppercase">
              — Tyler Gee, creator of hellafocused
            </cite>
          </div>
          
          {/* Second quote with more spacing */}
          <div className="relative text-center space-y-6 mt-24">
            <blockquote className="text-2xl sm:text-3xl lg:text-4xl font-light text-foreground/90 leading-relaxed">
              ...and it&apos;s way better than all those other apps.
            </blockquote>
            
            <cite className="block text-sm text-muted-foreground font-medium tracking-wider uppercase">
              — Tyler Gee, creator of hellafocused
            </cite>
          </div>
          
          {/* Multiple decorative lines for emphasis */}
          <div className="mt-20 space-y-4">
            <div className="flex items-center justify-center">
              <div className="w-24 h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
            </div>
            <div className="flex items-center justify-center">
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent"></div>
            </div>
            <div className="flex items-center justify-center">
              <div className="w-8 h-px bg-gradient-to-r from-transparent via-border/30 to-transparent"></div>
            </div>
          </div>
          
          {/* Bonus mini quotes scattered around */}
          <div className="absolute -top-10 left-10 text-xs text-muted-foreground/30 rotate-3 hidden lg:block">
            &quot;5 stars&quot; - Tyler Gee
          </div>
          <div className="absolute top-20 right-20 text-xs text-muted-foreground/30 -rotate-6 hidden lg:block">
            &quot;Would recommend&quot; - Tyler Gee
          </div>
          <div className="absolute bottom-10 left-32 text-xs text-muted-foreground/30 rotate-12 hidden xl:block">
            &quot;My favorite app&quot; - Tyler Gee
          </div>
          <div className="absolute bottom-20 right-16 text-xs text-muted-foreground/30 -rotate-3 hidden lg:block">
            &quot;10/10&quot; - Tyler Gee
          </div>
        </div>
      </div>
      
      {/* Static wave transition */}
      <div className="relative py-28 overflow-hidden">
        <div className="absolute inset-0">
          {/* Layered gradient waves - static with updated colors */}
          <div className="absolute inset-0">
            {/* First wave layer */}
            <div className="absolute top-0 left-0 w-full h-48 opacity-[0.25]">
              <div className="absolute inset-0 bg-gradient-to-b from-blue-500/40 to-transparent transform -skew-y-3"></div>
            </div>
            
            {/* Second wave layer */}
            <div className="absolute top-10 left-0 w-full h-48 opacity-[0.20]">
              <div className="absolute inset-0 bg-gradient-to-b from-purple-500/35 to-transparent transform skew-y-2"></div>
            </div>
            
            {/* Third wave layer */}
            <div className="absolute top-20 left-0 w-full h-48 opacity-[0.18]">
              <div className="absolute inset-0 bg-gradient-to-b from-pink-500/30 to-transparent transform -skew-y-2"></div>
            </div>
            
            {/* Fourth wave layer */}
            <div className="absolute top-32 left-0 w-full h-48 opacity-[0.15]">
              <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/25 to-transparent transform skew-y-3"></div>
            </div>
            
            {/* Bottom wave layer */}
            <div className="absolute top-44 left-0 w-full h-48 opacity-[0.12]">
              <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-transparent transform -skew-y-1"></div>
            </div>
          </div>
          
          {/* Center accent lines */}
          <div className="absolute top-1/2 left-0 right-0 flex justify-center">
            <div className="w-full max-w-5xl px-8 space-y-2">
              <div className="h-px bg-gradient-to-r from-transparent via-border/20 to-transparent"></div>
              <div className="h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent"></div>
            </div>
          </div>
          
          {/* Gentle fade to next section */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent"></div>
        </div>
      </div>
    </section>
  )
}