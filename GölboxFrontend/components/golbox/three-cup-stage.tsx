"use client"

import { useEffect, useRef } from "react"
// @ts-ignore
import * as THREE from "three"

function webglAvailable() {
  try {
    const probe = document.createElement("canvas")
    return Boolean(probe.getContext("webgl2") || probe.getContext("webgl"))
  } catch {
    return false
  }
}

function createBrandTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas")
  canvas.width = 1024
  canvas.height = 512
  const ctx = canvas.getContext("2d")
  if (ctx) {
    // Rich Brand Teal background gradient
    const grad = ctx.createLinearGradient(0, 0, 1024, 0)
    grad.addColorStop(0, "#123f40")
    grad.addColorStop(0.5, "#1d5f60")
    grad.addColorStop(1, "#123f40")
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 1024, 512)

    // Top & Bottom Metallic Gold Stripes
    ctx.fillStyle = "#b8913e"
    ctx.fillRect(0, 0, 1024, 22)
    ctx.fillRect(0, 490, 1024, 22)

    // Gold Trim Lines
    ctx.fillStyle = "#f3cf7a"
    ctx.fillRect(0, 26, 1024, 6)
    ctx.fillRect(0, 480, 1024, 6)

    // Front & Back repeats of ŞEHİTKAMİL BELEDİYESİ logo & text
    const centers = [256, 768]
    centers.forEach((cx) => {
      // Emblem Circle Shield
      ctx.beginPath()
      ctx.arc(cx, 140, 62, 0, Math.PI * 2)
      ctx.fillStyle = "#ffffff"
      ctx.fill()

      ctx.beginPath()
      ctx.arc(cx, 140, 54, 0, Math.PI * 2)
      ctx.fillStyle = "#1d5f60"
      ctx.fill()

      // Star / Emblem Symbol
      ctx.font = "bold 42px sans-serif"
      ctx.fillStyle = "#b8913e"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText("✦", cx, 140)

      // Title: ŞEHİTKAMİL BELEDİYESİ
      ctx.font = "bold 42px sans-serif"
      ctx.fillStyle = "#ffffff"
      ctx.fillText("ŞEHİTKAMİL BELEDİYESİ", cx, 260)

      // Subtitle: GÖLBOX KAFE
      ctx.font = "bold 52px serif"
      ctx.fillStyle = "#f3cf7a"
      ctx.fillText("GÖLBOX KAFE", cx, 340)

      // Subtitle detail
      ctx.font = "bold 24px sans-serif"
      ctx.fillStyle = "#e0f2f1"
      ctx.fillText("ÜCRETSİZ KAHVE İKRAMI", cx, 400)
    })
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  return texture
}

export function ThreeCupStage({
  onError,
}: {
  onError?: () => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (!webglAvailable()) {
      onError?.()
      return
    }

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        premultipliedAlpha: false,
        failIfMajorPerformanceCaveat: false,
        powerPreference: "high-performance",
      })
    } catch {
      onError?.()
      return
    }

    renderer.setClearColor(0x000000, 0)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50)
    camera.position.set(0, 0.2, 3.2)

    // Lighting setup for rich 3D look
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2)
    scene.add(ambientLight)

    const keyLight = new THREE.DirectionalLight(0xfff5e6, 1.8)
    keyLight.position.set(3, 4, 3)
    scene.add(keyLight)

    const goldFillLight = new THREE.DirectionalLight(0xb8913e, 1.4)
    goldFillLight.position.set(-3, -1, 2)
    scene.add(goldFillLight)

    const topRimLight = new THREE.PointLight(0xffffff, 2, 5)
    topRimLight.position.set(0, 2.5, 1)
    scene.add(topRimLight)

    // 3D Cup Group Container
    const cupGroup = new THREE.Group()
    scene.add(cupGroup)

    // 1. Cup Main Body (Paper / Acrylic Cup)
    const cupGeo = new THREE.CylinderGeometry(0.55, 0.42, 1.25, 32)
    const cupMat = new THREE.MeshStandardMaterial({
      color: 0xf5f8f8,
      roughness: 0.25,
      metalness: 0.1,
    })
    const cupMesh = new THREE.Mesh(cupGeo, cupMat)
    cupGroup.add(cupMesh)

    // 2. Brand Teal Sleeve Band with Şehitkamil Municipality Texture
    const sleeveGeo = new THREE.CylinderGeometry(0.56, 0.48, 0.65, 32)
    const sleeveTexture = createBrandTexture()
    const sleeveMat = new THREE.MeshStandardMaterial({
      map: sleeveTexture,
      roughness: 0.3,
      metalness: 0.15,
    })
    const sleeveMesh = new THREE.Mesh(sleeveGeo, sleeveMat)
    sleeveMesh.position.y = 0.02
    cupGroup.add(sleeveMesh)

    // 3. Gold Accent Band
    const goldRingGeo = new THREE.CylinderGeometry(0.563, 0.545, 0.08, 32)
    const goldRingMat = new THREE.MeshStandardMaterial({
      color: 0xb8913e, // Brand Gold
      roughness: 0.2,
      metalness: 0.85,
    })
    const goldRingMesh = new THREE.Mesh(goldRingGeo, goldRingMat)
    goldRingMesh.position.y = 0.36
    cupGroup.add(goldRingMesh)

    // 4. Cup Lid (Kapak)
    const lidGeo = new THREE.CylinderGeometry(0.59, 0.58, 0.12, 32)
    const lidMat = new THREE.MeshStandardMaterial({
      color: 0x123f40,
      roughness: 0.15,
      metalness: 0.3,
      transparent: true,
      opacity: 0.95,
    })
    const lidMesh = new THREE.Mesh(lidGeo, lidMat)
    lidMesh.position.y = 0.68
    cupGroup.add(lidMesh)

    // Lid Rim Ring
    const lidRimGeo = new THREE.TorusGeometry(0.59, 0.03, 16, 32)
    const lidRimMat = new THREE.MeshStandardMaterial({ color: 0x123f40, roughness: 0.2 })
    const lidRimMesh = new THREE.Mesh(lidRimGeo, lidRimMat)
    lidRimMesh.rotation.x = Math.PI / 2
    lidRimMesh.position.y = 0.62
    cupGroup.add(lidRimMesh)

    // 5. Straw (Pipet)
    const strawGroup = new THREE.Group()
    const strawGeo = new THREE.CylinderGeometry(0.035, 0.035, 1.1, 16)
    const strawMat = new THREE.MeshStandardMaterial({
      color: 0xb8913e,
      roughness: 0.3,
      metalness: 0.7,
    })
    const strawMesh = new THREE.Mesh(strawGeo, strawMat)
    strawGroup.add(strawMesh)
    strawGroup.position.set(0.14, 0.95, 0)
    strawGroup.rotation.z = -0.28
    cupGroup.add(strawGroup)

    // 6. Orbiting Gold Sparkle Particles
    const particleCount = 18
    const particlesGroup = new THREE.Group()
    const particleGeo = new THREE.SphereGeometry(0.025, 8, 8)
    const particleMat = new THREE.MeshStandardMaterial({
      color: 0xf3cf7a,
      emissive: 0xb8913e,
      emissiveIntensity: 0.8,
    })

    const particleNodes: { mesh: THREE.Mesh; speed: number; radius: number; angle: number; yOffset: number }[] = []
    for (let i = 0; i < particleCount; i++) {
      const pMesh = new THREE.Mesh(particleGeo, particleMat)
      const radius = 0.8 + Math.random() * 0.4
      const angle = (i / particleCount) * Math.PI * 2
      const yOffset = (Math.random() - 0.5) * 1.2
      pMesh.position.set(Math.cos(angle) * radius, yOffset, Math.sin(angle) * radius)
      particlesGroup.add(pMesh)
      particleNodes.push({ mesh: pMesh, speed: 0.01 + Math.random() * 0.02, radius, angle, yOffset })
    }
    cupGroup.add(particlesGroup)

    // Position cup group in center
    cupGroup.position.y = -0.1

    let cancelled = false
    let raf = 0
    let clock = new THREE.Clock()

    const tick = () => {
      if (cancelled) return
      const elapsed = clock.getElapsedTime()

      // Smooth floating bob & rotation
      cupGroup.rotation.y = elapsed * 0.8
      cupGroup.position.y = -0.1 + Math.sin(elapsed * 2.2) * 0.08
      cupGroup.rotation.z = Math.sin(elapsed * 1.5) * 0.04

      // Straw subtle wiggle
      strawGroup.rotation.z = -0.28 + Math.sin(elapsed * 3) * 0.02

      // Orbit particles
      particleNodes.forEach((p) => {
        p.angle += p.speed
        p.mesh.position.x = Math.cos(p.angle) * p.radius
        p.mesh.position.z = Math.sin(p.angle) * p.radius
        p.mesh.position.y = p.yOffset + Math.sin(elapsed * 2 + p.angle) * 0.05
      })

      const parent = canvas.parentElement
      const width = Math.max(0, parent?.clientWidth || 0)
      const height = Math.max(0, parent?.clientHeight || 0)
      if (width >= 8 && height >= 8) {
        renderer.setSize(width, height, false)
        camera.aspect = width / height
        camera.updateProjectionMatrix()
        renderer.render(scene, camera)
      }
      raf = requestAnimationFrame(tick)
    }

    tick()

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      scene.traverse((child: any) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose()
          const materials = Array.isArray(child.material) ? child.material : [child.material]
          for (const mat of materials) mat.dispose()
        }
      })
      if (sleeveTexture) sleeveTexture.dispose()
      renderer.dispose()
    }
  }, [onError])

  return <canvas ref={canvasRef} className="h-full w-full bg-transparent outline-none" aria-hidden />
}
