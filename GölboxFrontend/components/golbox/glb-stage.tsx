"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"

function webglAvailable() {
  try {
    const probe = document.createElement("canvas")
    return Boolean(probe.getContext("webgl2") || probe.getContext("webgl"))
  } catch {
    return false
  }
}

export function GlbStage({
  src,
  onError,
}: {
  src: string
  onError: () => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (!webglAvailable()) {
      onError()
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
        powerPreference: "default",
      })
    } catch {
      onError()
      return
    }

    const gl = renderer.getContext()
    if (!gl || gl.isContextLost()) {
      renderer.dispose()
      onError()
      return
    }

    renderer.setClearColor(0x000000, 0)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 50)
    camera.position.set(0, 0.45, 2.8)

    scene.add(new THREE.AmbientLight(0xffffff, 1.05))
    const key = new THREE.DirectionalLight(0xfff1d0, 1.5)
    key.position.set(2.2, 3.4, 4)
    scene.add(key)
    const fill = new THREE.DirectionalLight(0x9fd4d0, 0.7)
    fill.position.set(-2, 1.2, 1.5)
    scene.add(fill)

    let model: THREE.Object3D | null = null
    let cancelled = false
    let raf = 0
    let loadTimer = 0
    const loader = new GLTFLoader()

    const fit = (object: THREE.Object3D) => {
      const box = new THREE.Box3().setFromObject(object)
      const size = box.getSize(new THREE.Vector3())
      const center = box.getCenter(new THREE.Vector3())
      object.position.sub(center)
      const longest = Math.max(size.x, size.y, size.z, 0.001)
      object.scale.setScalar(1.25 / longest)
    }

    canvas.style.opacity = "0"
    canvas.style.pointerEvents = "none"

    loadTimer = window.setTimeout(() => {
      if (!cancelled && !model) onError()
    }, 4000)

    loader.load(
      src,
      (gltf) => {
        window.clearTimeout(loadTimer)
        if (cancelled) return
        model = gltf.scene
        fit(model)
        scene.add(model)
        canvas.style.opacity = "1"
      },
      undefined,
      () => {
        window.clearTimeout(loadTimer)
        if (!cancelled) onError()
      }
    )

    const tick = () => {
      const parent = canvas.parentElement
      const width = Math.max(0, parent?.clientWidth || 0)
      const height = Math.max(0, parent?.clientHeight || 0)
      if (width >= 8 && height >= 8) {
        renderer.setSize(width, height, false)
        camera.aspect = width / height
        camera.updateProjectionMatrix()
        if (model) model.rotation.y += 0.012
        renderer.render(scene, camera)
      }
      raf = requestAnimationFrame(tick)
    }
    tick()

    return () => {
      cancelled = true
      window.clearTimeout(loadTimer)
      cancelAnimationFrame(raf)
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose()
          const materials = Array.isArray(child.material) ? child.material : [child.material]
          for (const material of materials) material.dispose()
        }
      })
      renderer.dispose()
    }
  }, [src, onError])

  return <canvas ref={canvasRef} className="h-full w-full bg-transparent" aria-hidden />
}
