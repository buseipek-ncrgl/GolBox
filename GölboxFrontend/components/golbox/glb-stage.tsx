"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"

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

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: "low-power",
      })
    } catch {
      onError()
      return
    }

    renderer.setClearColor(0x000000, 0)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 50)
    camera.position.set(0, 0.35, 2.6)

    scene.add(new THREE.AmbientLight(0xffffff, 0.95))
    const key = new THREE.DirectionalLight(0xfff1d0, 1.35)
    key.position.set(2.2, 3.4, 4)
    scene.add(key)
    const fill = new THREE.DirectionalLight(0x9fd4d0, 0.55)
    fill.position.set(-2, 1.2, 1.5)
    scene.add(fill)

    let model: THREE.Object3D | null = null
    let cancelled = false
    let raf = 0
    const loader = new GLTFLoader()

    const fit = (object: THREE.Object3D) => {
      const box = new THREE.Box3().setFromObject(object)
      const size = box.getSize(new THREE.Vector3())
      const center = box.getCenter(new THREE.Vector3())
      object.position.sub(center)
      const longest = Math.max(size.x, size.y, size.z, 0.001)
      object.scale.setScalar(1.35 / longest)
      object.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          const materials = Array.isArray(child.material) ? child.material : [child.material]
          for (const material of materials) {
            if ("metalness" in material) material.metalness = Math.max(Number(material.metalness) || 0, 0.35)
            if ("roughness" in material) material.roughness = Math.min(Number(material.roughness) || 1, 0.45)
          }
        }
      })
    }

    loader.load(
      src,
      (gltf) => {
        if (cancelled) {
          gltf.scene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.geometry.dispose()
            }
          })
          return
        }
        model = gltf.scene
        fit(model)
        scene.add(model)
      },
      undefined,
      () => {
        if (!cancelled) onError()
      }
    )

    const tick = () => {
      const parent = canvas.parentElement
      const width = Math.max(1, parent?.clientWidth || canvas.clientWidth || 1)
      const height = Math.max(1, parent?.clientHeight || canvas.clientHeight || 1)
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      if (model) model.rotation.y += 0.012
      renderer.render(scene, camera)
      raf = requestAnimationFrame(tick)
    }
    tick()

    return () => {
      cancelled = true
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

  return <canvas ref={canvasRef} className="h-full w-full" aria-hidden />
}
