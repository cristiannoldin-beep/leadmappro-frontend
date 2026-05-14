'use client'

import { useEffect, useRef } from 'react'

interface Node {
  x: number; y: number; vx: number; vy: number
  radius: number; opacity: number; isPin: boolean
  pulseTimer: number; isPulsing: boolean; pulseRadius: number; pulseOpacity: number
  streamTimer: number; streamActive: boolean; streamTarget: number; streamProgress: number
}

const EMERALD = { r: 62, g: 207, b: 142 }
const TEAL = { r: 20, g: 184, b: 166 }
const COUNT = 55
const MAX_DIST = 140

export const HeroBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    let nodes: Node[] = []

    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight }

    const init = () => {
      nodes = []
      for (let i = 0; i < COUNT; i++) {
        nodes.push({
          x: Math.random() * canvas.width, y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
          radius: Math.random() * 1.5 + 1, opacity: Math.random() * 0.4 + 0.2,
          isPin: Math.random() < 0.25, pulseTimer: Math.floor(Math.random() * 250),
          isPulsing: false, pulseRadius: 0, pulseOpacity: 0,
          streamTimer: Math.floor(Math.random() * 400), streamActive: false, streamTarget: -1, streamProgress: 0,
        })
      }
    }

    const drawPin = (x: number, y: number, radius: number, opacity: number) => {
      const r = radius * 2.5
      ctx.beginPath(); ctx.arc(x, y - r * 0.4, r, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(${EMERALD.r},${EMERALD.g},${EMERALD.b},${opacity})`; ctx.fill()
      ctx.beginPath(); ctx.moveTo(x - r * 0.5, y - r * 0.4); ctx.lineTo(x, y + r * 0.8); ctx.lineTo(x + r * 0.5, y - r * 0.4)
      ctx.fillStyle = `rgba(${EMERALD.r},${EMERALD.g},${EMERALD.b},${opacity * 0.7})`; ctx.fill()
      ctx.beginPath(); ctx.arc(x, y - r * 0.4, r * 0.35, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(0,0,0,${opacity * 0.6})`; ctx.fill()
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < MAX_DIST) {
            ctx.beginPath(); ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(nodes[j].x, nodes[j].y)
            ctx.strokeStyle = `rgba(${EMERALD.r},${EMERALD.g},${EMERALD.b},${(1 - dist / MAX_DIST) * 0.12})`
            ctx.lineWidth = 0.5; ctx.stroke()
          }
        }
      }
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i]
        n.x += n.vx; n.y += n.vy
        if (n.x < 0 || n.x > canvas.width) n.vx *= -1
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1
        n.pulseTimer--
        if (n.pulseTimer <= 0) { n.isPulsing = true; n.pulseRadius = 0; n.pulseOpacity = 0.5; n.pulseTimer = 180 + Math.floor(Math.random() * 350) }
        if (n.isPulsing) {
          n.pulseRadius += 0.7; n.pulseOpacity = Math.max(0, 0.5 - n.pulseRadius / 28)
          if (n.pulseOpacity > 0) { ctx.beginPath(); ctx.arc(n.x, n.y, n.pulseRadius, 0, Math.PI * 2); ctx.strokeStyle = `rgba(${EMERALD.r},${EMERALD.g},${EMERALD.b},${n.pulseOpacity})`; ctx.lineWidth = 1; ctx.stroke() }
          if (n.pulseRadius > 28) n.isPulsing = false
        }
        n.streamTimer--
        if (n.streamTimer <= 0 && !n.streamActive) {
          let closest = -1, closestDist = MAX_DIST
          for (let j = 0; j < nodes.length; j++) {
            if (j === i) continue
            const dx = nodes[j].x - n.x, dy = nodes[j].y - n.y, d = Math.sqrt(dx * dx + dy * dy)
            if (d < closestDist) { closestDist = d; closest = j }
          }
          if (closest >= 0) { n.streamActive = true; n.streamTarget = closest; n.streamProgress = 0 }
          n.streamTimer = 300 + Math.floor(Math.random() * 500)
        }
        if (n.streamActive && n.streamTarget >= 0) {
          const target = nodes[n.streamTarget]; n.streamProgress += 0.012
          if (n.streamProgress >= 1) { n.streamActive = false; n.streamProgress = 0 }
          else {
            const sx = n.x + (target.x - n.x) * n.streamProgress, sy = n.y + (target.y - n.y) * n.streamProgress
            ctx.beginPath(); ctx.arc(sx, sy, 2, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(${TEAL.r},${TEAL.g},${TEAL.b},${Math.sin(n.streamProgress * Math.PI) * 0.8})`; ctx.fill()
          }
        }
        if (n.isPin) drawPin(n.x, n.y, n.radius, n.opacity)
        else { ctx.beginPath(); ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2); ctx.fillStyle = `rgba(${EMERALD.r},${EMERALD.g},${EMERALD.b},${n.opacity})`; ctx.fill() }
      }
      animId = requestAnimationFrame(draw)
    }

    resize(); init(); draw()
    window.addEventListener('resize', () => { resize(); init() })
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', () => { resize(); init() }) }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-70" aria-hidden="true" />
}
