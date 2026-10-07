let audioContext: AudioContext | null = null

function getAudioContext() {
  if (typeof window === "undefined") return null
  const AudioContextClass = window.AudioContext
  if (!AudioContextClass) return null
  audioContext ??= new AudioContextClass()
  return audioContext
}

export async function unlockNotificationSound() {
  const context = getAudioContext()
  if (context?.state === "suspended") {
    await context.resume().catch(() => undefined)
  }
}

export async function playNotificationSound() {
  const context = getAudioContext()
  if (!context) return

  if (context.state === "suspended") {
    await context.resume().catch(() => undefined)
  }
  if (context.state !== "running") return

  const start = context.currentTime
  const gain = context.createGain()
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(0.16, start + 0.015)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.42)
  gain.connect(context.destination)

  ;[740, 988].forEach((frequency, index) => {
    const oscillator = context.createOscillator()
    oscillator.type = "sine"
    oscillator.frequency.value = frequency
    oscillator.connect(gain)
    oscillator.start(start + index * 0.12)
    oscillator.stop(start + 0.26 + index * 0.12)
  })
}
