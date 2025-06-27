import { randomFrom } from "./utils"

export const triggerConfetti = () => {
  if (typeof window === "undefined") return
  
  const colors = ["#10b981", "#6ee7b7", "#a7f3d0", "#34d399", "#059669", "#065f46"]
  const confettiContainer = document.createElement("div")
  confettiContainer.style.position = "fixed"
  confettiContainer.style.top = "0"
  confettiContainer.style.left = "0"
  confettiContainer.style.width = "100%"
  confettiContainer.style.height = "100%"
  confettiContainer.style.pointerEvents = "none"
  confettiContainer.style.zIndex = "9999"
  document.body.appendChild(confettiContainer)

  // Create multiple confetti pieces
  for (let i = 0; i < 30; i++) {
    const confetti = document.createElement("div")
    confetti.style.position = "absolute"
    confetti.style.width = "8px"
    confetti.style.height = "8px"
    confetti.style.backgroundColor = randomFrom(colors) || "#10b981"
    confetti.style.left = Math.random() * 100 + "%"
    confetti.style.top = "-10px"
    confetti.style.borderRadius = "50%"
    confetti.style.opacity = "0.7"
    confetti.style.transform = `rotate(${Math.random() * 360}deg)`

    confettiContainer.appendChild(confetti)

    // Animate the confetti
    const animation = confetti.animate(
      [
        {
          transform: `translateY(0px) rotate(0deg)`,
          opacity: 0.7,
        },
        {
          transform: `translateY(${window.innerHeight + 100}px) rotate(${180 + Math.random() * 180}deg)`,
          opacity: 0,
        },
      ],
      {
        duration: 4000 + Math.random() * 2000,
        easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      },
    )

    animation.onfinish = () => {
      confetti.remove()
    }
  }

  // Clean up container after animations
  setTimeout(() => {
    if (confettiContainer.parentNode) {
      confettiContainer.remove()
    }
  }, 7000)
}
