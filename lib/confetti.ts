import confetti from "canvas-confetti"

export const triggerConfetti = () => {
  if (typeof window === "undefined") return
  
  // Get confetti colors from CSS variables (theme-aware)
  const getConfettiColors = () => {
    const root = document.documentElement
    const computedStyle = getComputedStyle(root)
    
    // Get all 6 confetti color variables
    const colors = []
    for (let i = 1; i <= 6; i++) {
      const color = computedStyle.getPropertyValue(`--confetti-${i}`).trim()
      if (color) colors.push(color)
    }
    
    // Fallback to default pink colors if CSS variables not found
    return colors.length > 0 ? colors : ["#ec4899", "#f472b6", "#f9a8d4", "#fce7f3", "#be185d", "#9d174d"]
  }
  
  const confettiColors = getConfettiColors()
  
  // Diverse animation weights for variety
  const animations = [
    { type: 'simple-burst', weight: 40 },      // 40% chance - most common
    { type: 'gentle-falling', weight: 25 },    // 25% chance - gentle cascade
    { type: 'side-bursts', weight: 20 },       // 20% chance - dramatic side bursts
    { type: 'bottom-bursts', weight: 15 },     // 15% chance - upward celebration
  ]
  
  // Select random animation based on weights using cumulative approach
  const totalWeight = animations.reduce((sum, anim) => sum + anim.weight, 0)
  const randomValue = Math.random() * totalWeight
  let selectedAnimation = animations[0].type
  let cumulativeWeight = 0
  
  for (const anim of animations) {
    cumulativeWeight += anim.weight
    if (randomValue <= cumulativeWeight) {
      selectedAnimation = anim.type
      break
    }
  }

  // Animation 1: Simple burst (most common) - single clean burst from top
  const simpleBurst = () => {
    confetti({
      particleCount: 25,
      angle: 270, // Straight down
      spread: 160, // Very wide spread for maximum coverage
      origin: { x: 0.5, y: -0.2 }, // Center, higher above screen
      colors: confettiColors,
      gravity: 0.4, // Gentle gravity
      drift: 0.1, // Slight horizontal drift
      scalar: 0.7, // Consistent particle size
      startVelocity: 15, // Consistent starting velocity
      decay: 0.94, // Slower decay for longer fall
    })
  }

  // Animation 2: Gentle falling across top of screen - left to right sequential
  const gentleFalling = () => {
    // Spawn confetti evenly across the top of the screen - left to right sequentially
    const positions = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9] // Even distribution
    
    positions.forEach((x, index) => {
      // Stagger the spawn times for left-to-right sequential effect
      setTimeout(() => {
        confetti({
          particleCount: 3, // Very few particles per position for gentleness
          angle: 270, // Straight down
          spread: 10, // Very narrow spread for gentle fall
          origin: { x, y: -0.1 }, // Each position at top, above screen
          colors: confettiColors,
          gravity: 0.3, // Very gentle gravity
          drift: 0, // No horizontal drift for straight fall
          scalar: 0.5 + Math.random() * 0.3, // Small particles
          startVelocity: 5 + Math.random() * 5, // Very gentle starting velocity
          decay: 0.95, // Slower decay for longer fall
        })
      }, index * 80) // 80ms between each position for smooth wave
    })
  }

  // Animation 2: Bottom positioned bursts
  const bottomBursts = () => {
    const positions = [0.1, 0.3, 0.5, 0.7, 0.9]
    
    positions.forEach((x, index) => {
      setTimeout(() => {
        confetti({
          particleCount: 30,
          angle: 90, // Upward
          spread: 60,
          origin: { x, y: 0.9 }, // Bottom of screen
          colors: confettiColors,
          startVelocity: 40 + Math.random() * 20,
          decay: 0.9,
          scalar: 0.8,
        })
      }, index * 100)
    })
  }

  // Animation 3: Simultaneous side bursts
  const sideBursts = () => {
    // Left side burst - angled higher and positioned further out
    confetti({
      particleCount: 50,
      angle: 45, // Angled up and right (was 0)
      spread: 90,
      origin: { x: -0.2, y: 0.6 }, // Further left and slightly lower
      colors: confettiColors,
      startVelocity: 60,
      decay: 0.9,
    })
    
    // Right side burst - angled higher and positioned further out
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 135, // Angled up and left (was 180)
        spread: 90,
        origin: { x: 1.2, y: 0.6 }, // Further right and slightly lower
        colors: confettiColors,
        startVelocity: 60,
        decay: 0.9,
      })
    }, 100)
  }


  // Execute selected animation
  switch (selectedAnimation) {
    case 'simple-burst':
      simpleBurst()
      break
    case 'gentle-falling':
      gentleFalling()
      break
    case 'bottom-bursts':
      bottomBursts()
      break
    case 'side-bursts':
      sideBursts()
      break
    default:
      simpleBurst()
  }
}
