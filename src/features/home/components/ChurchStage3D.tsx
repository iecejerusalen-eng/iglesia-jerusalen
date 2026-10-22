import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

type StageProps = {
  mode: 'intro' | 'entering' | 'companion';
  onUnavailable: () => void;
};

export default function ChurchStage({ mode, onUnavailable }: StageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modeRef = useRef(mode);
  useEffect(() => { modeRef.current = mode; }, [mode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch {
      onUnavailable();
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    scene.add(new THREE.HemisphereLight(0xf5faff, 0xbfcbe2, 1.8));
    const sun = new THREE.DirectionalLight(0xfff7e6, 2.2);
    sun.position.set(-8, 14, 10);
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0xc9dfff, 0.9);
    fill.position.set(9, 6, -5);
    scene.add(fill);

    const pivot = new THREE.Group();
    scene.add(pivot);
    let alive = true;
    let loadedModel: THREE.Group | null = null;
    let modelWidth = 8;
    let modelHeight = 5;
    let modelDepth = 5;
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/');
    dracoLoader.setDecoderConfig({ type: 'wasm' });
    new GLTFLoader().setDRACOLoader(dracoLoader).load('/models/iglesia-jerusalen-intro.glb', (gltf) => {
      if (!alive) return;
      const model = gltf.scene;
      const box = new THREE.Box3().setFromObject(model);
      const dimensions = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const factor = 8 / Math.max(dimensions.x, dimensions.y, dimensions.z);
      model.position.copy(center).multiplyScalar(-factor);
      model.scale.setScalar(factor);
      modelWidth = dimensions.x * factor;
      modelHeight = dimensions.y * factor;
      modelDepth = dimensions.z * factor;
      loadedModel = model;
      pivot.add(model);
    }, undefined, () => { if (alive) onUnavailable(); });

    let frame = 0;
    let lastTime = 0;
    let orbit = 0;
    let scrollVelocity = 0;
    let dragYaw = 0;
    let dragPitch = 0;
    let targetYaw = 0;
    let targetPitch = 0;
    let dragging = false;
    let lastPointerX = 0;
    let lastPointerY = 0;
    let lastScrollY = window.scrollY;

    const resize = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    const pointerDown = (event: PointerEvent) => {
      if (modeRef.current === 'entering') return;
      dragging = true;
      lastPointerX = event.clientX;
      lastPointerY = event.clientY;
      canvas.setPointerCapture(event.pointerId);
      canvas.classList.add('is-dragging');
    };
    const pointerMove = (event: PointerEvent) => {
      if (!dragging) return;
      targetYaw += (event.clientX - lastPointerX) * 0.009;
      targetPitch = THREE.MathUtils.clamp(targetPitch + (event.clientY - lastPointerY) * 0.007, -0.8, 0.8);
      lastPointerX = event.clientX;
      lastPointerY = event.clientY;
    };
    const pointerUp = () => {
      dragging = false;
      canvas.classList.remove('is-dragging');
      targetYaw = 0;
      targetPitch = 0;
    };
    const wheel = (event: WheelEvent) => {
      if (modeRef.current !== 'companion') return;
      scrollVelocity += THREE.MathUtils.clamp(event.deltaY, -450, 450) * 0.0022;
      scrollVelocity = THREE.MathUtils.clamp(scrollVelocity, -3.2, 3.2);
    };
    const scroll = () => {
      const delta = window.scrollY - lastScrollY;
      lastScrollY = window.scrollY;
      if (modeRef.current === 'companion' && Math.abs(delta) > 0.5) {
        scrollVelocity += THREE.MathUtils.clamp(delta, -260, 260) * 0.0011;
        scrollVelocity = THREE.MathUtils.clamp(scrollVelocity, -3.2, 3.2);
      }
    };
    canvas.addEventListener('pointerdown', pointerDown);
    canvas.addEventListener('pointermove', pointerMove);
    canvas.addEventListener('pointerup', pointerUp);
    canvas.addEventListener('pointercancel', pointerUp);
    window.addEventListener('wheel', wheel, { passive: true });
    window.addEventListener('scroll', scroll, { passive: true });

    const render = (time: number) => {
      const dt = Math.min((time - (lastTime || time)) / 1000, 0.05);
      lastTime = time;
      const currentMode = modeRef.current;
      if (!dragging) {
        if (currentMode === 'intro') orbit += dt * 0.42;
        if (currentMode === 'companion') orbit += scrollVelocity * dt;
      }
      scrollVelocity *= Math.exp(-dt * 3.5);
      const ease = 1 - Math.exp(-dt * (dragging ? 18 : 5));
      dragYaw += (targetYaw - dragYaw) * ease;
      dragPitch += (targetPitch - dragPitch) * ease;
      pivot.rotation.set(dragPitch, orbit + dragYaw, 0);

      const aspect = Math.max(camera.aspect, 0.25);
      const vertical = THREE.MathUtils.degToRad(camera.fov) / 2;
      const widthForRotation = Math.max(modelWidth, modelDepth);
      const distance = Math.max(
        modelHeight / (2 * Math.tan(vertical)),
        widthForRotation / (2 * Math.tan(vertical) * aspect),
      ) * (currentMode === 'companion' ? 1.7 : aspect < 0.8 ? 1.35 : 1.8);
      camera.position.set(0, distance * 0.1, distance);
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
      frame = window.requestAnimationFrame(render);
    };
    frame = window.requestAnimationFrame(render);
    return () => {
      alive = false;
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      canvas.removeEventListener('pointerdown', pointerDown);
      canvas.removeEventListener('pointermove', pointerMove);
      canvas.removeEventListener('pointerup', pointerUp);
      canvas.removeEventListener('pointercancel', pointerUp);
      window.removeEventListener('wheel', wheel);
      window.removeEventListener('scroll', scroll);
      if (loadedModel) {
        loadedModel.traverse((node) => {
          if (!(node instanceof THREE.Mesh)) return;
          node.geometry.dispose();
          const materials = Array.isArray(node.material) ? node.material : [node.material];
          materials.forEach((material) => {
            if (material instanceof THREE.MeshStandardMaterial) material.map?.dispose();
            material.dispose();
          });
        });
      }
      renderer.dispose();
      dracoLoader.dispose();
    };
  }, [onUnavailable]);

  return <canvas ref={canvasRef} className="church-welcome__canvas" aria-label="Modelo 3D interactivo de Iglesia Jerusalén" />;
}
