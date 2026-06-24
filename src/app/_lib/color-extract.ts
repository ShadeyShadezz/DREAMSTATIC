export interface RGB { r: number; g: number; b: number }

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.round(n).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function hexToRgb(hex: string): RGB {
  const h = hex.replace('#', '')
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  }
}

function colorDistance(a: RGB, b: RGB): number {
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2)
}

function averageColor(pixels: RGB[]): RGB {
  const total = pixels.length
  if (total === 0) return { r: 0, g: 0, b: 0 }
  const sum = pixels.reduce(
    (acc, p) => ({ r: acc.r + p.r, g: acc.g + p.g, b: acc.b + p.b }),
    { r: 0, g: 0, b: 0 }
  )
  return { r: sum.r / total, g: sum.g / total, b: sum.b / total }
}

function dominantColors(pixels: RGB[], count: number): RGB[] {
  if (pixels.length === 0) return []
  if (pixels.length <= count) return pixels

  const maxIterations = 20
  let centroids: RGB[] = pixels
    .sort(() => Math.random() - 0.5)
    .slice(0, count)

  for (let iter = 0; iter < maxIterations; iter++) {
    const clusters: RGB[][] = Array.from({ length: count }, () => [])

    for (const pixel of pixels) {
      let minDist = Infinity
      let closestIdx = 0
      for (let i = 0; i < centroids.length; i++) {
        const dist = colorDistance(pixel, centroids[i])
        if (dist < minDist) {
          minDist = dist
          closestIdx = i
        }
      }
      clusters[closestIdx].push(pixel)
    }

    let moved = false
    for (let i = 0; i < count; i++) {
      if (clusters[i].length === 0) continue
      const newCenter = averageColor(clusters[i])
      const dist = colorDistance(newCenter, centroids[i])
      if (dist > 1) moved = true
      centroids[i] = newCenter
    }

    if (!moved) break
  }

  centroids.sort((a, b) => {
    const countA = pixels.filter(p => colorDistance(p, a) < colorDistance(p, b)).length
    const countB = pixels.length - countA
    return countB - countA
  })

  return centroids.slice(0, count)
}

export function extractColors(img: HTMLImageElement, colorCount: number = 5): string[] {
  const canvas = document.createElement('canvas')
  const maxSize = 200
  let w = img.naturalWidth
  let h = img.naturalHeight
  if (w > maxSize || h > maxSize) {
    const ratio = Math.min(maxSize / w, maxSize / h)
    w = Math.round(w * ratio)
    h = Math.round(h * ratio)
  }
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return []

  ctx.drawImage(img, 0, 0, w, h)

  const imageData = ctx.getImageData(0, 0, w, h)
  const data = imageData.data
  const pixels: RGB[] = []

  for (let i = 0; i < data.length; i += 16) {
    pixels.push({ r: data[i], g: data[i + 1], b: data[i + 2] })
  }

  if (pixels.length === 0) return []

  const dominant = dominantColors(pixels, colorCount)
  return dominant.map(c => rgbToHex(c.r, c.g, c.b))
}

const KNOWN_THEMES: { name: string; matcher: (colors: string[]) => boolean }[] = [
  {
    name: 'Y2K',
    matcher: (c) => {
      const hex = c.map(h => h.toLowerCase())
      return hex.some(h => ['#ff00ff', '#ff69b4', '#ff1493'].includes(h))
    },
  },
  {
    name: 'Cyber',
    matcher: (c) => {
      const hex = c.map(h => h.toLowerCase())
      return hex.some(h => ['#00ffff', '#00ced1', '#00bfff'].includes(h))
    },
  },
  {
    name: 'Synthwave',
    matcher: (c) => {
      const hex = c.map(h => h.toLowerCase())
      return hex.some(h => ['#ff00ff', '#ff6b6b', '#ff4500', '#ff1493'].includes(h)) &&
             hex.some(h => ['#00ffff', '#4ecdc4', '#00bfff'].includes(h))
    },
  },
  {
    name: 'Liminal',
    matcher: (c) => {
      const avg = c.reduce((a, b) => {
        const [r, g, bl] = [parseInt(b.slice(1, 3), 16), parseInt(b.slice(3, 5), 16), parseInt(b.slice(5, 7), 16)]
        return { r: a.r + r, g: a.g + g, b: a.b + bl }
      }, { r: 0, g: 0, b: 0 })
      const count = c.length
      avg.r /= count; avg.g /= count; avg.b /= count
      const isDesaturated = Math.abs(avg.r - avg.g) < 40 && Math.abs(avg.g - avg.b) < 40
      return isDesaturated && avg.r > 80 && avg.r < 200
    },
  },
  {
    name: 'Nature',
    matcher: (c) => {
      const hex = c.map(h => h.toLowerCase())
      return hex.some(h => ['#228b22', '#32cd32', '#2e8b57', '#556b2f', '#8fbc8f', '#6b8e23'].includes(h))
    },
  },
  {
    name: 'Neon',
    matcher: (c) => {
      const hex = c.map(h => h.toLowerCase())
      return hex.some(h => ['#ff00ff', '#00ff00', '#00ffff', '#ff0000', '#ffff00'].includes(h))
    },
  },
  {
    name: 'Pastel',
    matcher: (c) => c.every(h => {
      const [r, g, b] = [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]
      return r > 150 && g > 150 && b > 150
    }),
  },
  {
    name: 'Dark',
    matcher: (c) => c.every(h => {
      const [r, g, b] = [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]
      return r < 80 && g < 80 && b < 80
    }),
  },
  {
    name: 'Grunge',
    matcher: (c) => {
      const hex = c.map(h => h.toLowerCase())
      return hex.some(h => ['#8b0000', '#800000', '#556b2f', '#8b4513', '#a0522d', '#6b8e23'].includes(h))
    },
  },
  {
    name: 'Vaporwave',
    matcher: (c) => {
      const hex = c.map(h => h.toLowerCase())
      return hex.some(h => ['#ff00ff', '#8a2be2', '#9400d3', '#ff72b6', '#f0f8ff'].includes(h))
    },
  },
  {
    name: 'Tropical',
    matcher: (c) => {
      const hex = c.map(h => h.toLowerCase())
      return hex.some(h => ['#00ced1', '#20b2aa', '#ff6347', '#ffd700', '#00ff7f'].includes(h))
    },
  },
  {
    name: 'Retro',
    matcher: (c) => {
      const hex = c.map(h => h.toLowerCase())
      return hex.some(h => ['#ff9ff3', '#feca57', '#ff6b6b', '#48dbfb', '#1dd1a1'].includes(h)) ||
             hex.some(h => ['#d1d5db', '#9ca3af', '#4b5563'].includes(h))
    },
  },
  {
    name: 'Futuristic',
    matcher: (c) => {
      const hex = c.map(h => h.toLowerCase())
      return hex.some(h => ['#00fff6', '#6c4bff', '#00d47a', '#ff66c4'].includes(h))
    },
  },
]

export function suggestTags(colors: string[]): string[] {
  const tags: string[] = []
  for (const theme of KNOWN_THEMES) {
    if (theme.matcher(colors)) {
      tags.push(theme.name)
    }
  }
  if (tags.length === 0) tags.push('Custom')
  return tags
}
