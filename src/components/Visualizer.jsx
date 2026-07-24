import { useEffect, useRef } from 'react'

// Draws either an equalizer-bar or a waveform visualization from a Web Audio
// AnalyserNode onto a canvas. Purely presentational — analyser lifecycle is
// owned by the parent Player.
export default function Visualizer({ analyser, mode = 'bars', active }) {
  const canvasRef = useRef(null)
  const rafRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    function resize() {
      const dpr = window.devicePixelRatio || 1
      canvas.width = canvas.clientWidth * dpr
      canvas.height = canvas.clientHeight * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const bufferLength = analyser ? analyser.frequencyBinCount : 128
    const dataArray = new Uint8Array(bufferLength)

    function draw() {
      rafRef.current = requestAnimationFrame(draw)
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      ctx.clearRect(0, 0, w, h)

      if (analyser && active) {
        if (mode === 'bars') {
          analyser.getByteFrequencyData(dataArray)
          drawBars(ctx, dataArray, w, h)
        } else {
          analyser.getByteTimeDomainData(dataArray)
          drawWave(ctx, dataArray, w, h)
        }
      } else {
        drawIdle(ctx, w, h, mode)
      }
    }
    draw()

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [analyser, mode, active])

  return <canvas ref={canvasRef} className="w-full h-full block" />
}

function drawBars(ctx, dataArray, w, h) {
  const barCount = 40
  const step = Math.floor(dataArray.length / barCount)
  const barWidth = w / barCount
  for (let i = 0; i < barCount; i++) {
    const value = dataArray[i * step] / 255
    const barHeight = Math.max(2, value * h)
    const x = i * barWidth
    const y = h - barHeight
    const grad = ctx.createLinearGradient(0, y, 0, h)
    grad.addColorStop(0, '#E4C878')
    grad.addColorStop(1, '#C8963E')
    ctx.fillStyle = grad
    ctx.fillRect(x + barWidth * 0.15, y, barWidth * 0.7, barHeight)
  }
}

function drawWave(ctx, dataArray, w, h) {
  ctx.lineWidth = 2
  ctx.strokeStyle = '#4FB6A6'
  ctx.beginPath()
  const sliceWidth = w / dataArray.length
  let x = 0
  for (let i = 0; i < dataArray.length; i++) {
    const v = dataArray[i] / 128.0
    const y = (v * h) / 2
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
    x += sliceWidth
  }
  ctx.lineTo(w, h / 2)
  ctx.stroke()
}

function drawIdle(ctx, w, h, mode) {
  ctx.strokeStyle = 'rgba(242,236,225,0.15)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(0, h / 2)
  ctx.lineTo(w, h / 2)
  ctx.stroke()
}
