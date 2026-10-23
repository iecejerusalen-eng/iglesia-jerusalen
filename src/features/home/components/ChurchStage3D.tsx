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
    renderer.toneMappingExposure = 0.9;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    scene.add(new THREE.HemisphereLight(0xfff8eb, 0xd5dbe2, 1.35));
    const sun = new THREE.DirectionalLight(0xffefd9, 1.8);
    sun.position.set(-8, 14, 10);
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0xc9dfff, 0.6);
    fill.position.set(9, 6, -5);
    scene.add(fill);

    const pivot = new THREE.Group();
    scene.add(pivot);
    let alive = true;
    let loadedModel: THREE.Group | null = null;
    let modelWidth = 8;
    let modelHeight = 5;
    let modelDepth = 5;
    let contactShadow: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial> | null = null;
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

      const shadowCanvas = document.createElement('canvas');
      shadowCanvas.width = 128;
      shadowCanvas.height = 128;
      const shadowContext = shadowCanvas.getContext('2d');
      if (shadowContext) {
        const gradient = shadowContext.createRadialGradient(64, 64, 8, 64, 64, 64);
        gradient.addColorStop(0, 'rgba(25, 51, 72, 0.34)');
        gradient.addColorStop(0.55, 'rgba(25, 51, 72, 0.15)');
        gradient.addColorStop(1, 'rgba(25, 51, 72, 0)');
        shadowContext.fillStyle = gradient;
        shadowContext.fillRect(0, 0, 128, 128);
        const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
        const shadowMaterial = new THREE.MeshBasicMaterial({
          map: shadowTexture,
          transparent: true,
          depthWrite: false,
          side: THREE.DoubleSide,
        });
        contactShadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), shadowMaterial);
        contactShadow.rotation.x = -Math.PI / 2;
        contactShadow.position.y = -modelHeight / 2 - 0.025;
        contactShadow.scale.set(modelWidth * 1.3, modelDepth * 1.3, 1);
        scene.add(contactShadow);
      }
    }, undefined, () => { if (alive) onUnavailable(); });

    let frame = 0;
    let lastTime = 0;
    let orbit = 0;
    let introElapsed = 0;
    let scrollVelocity = 0;
    let dragYaw = 0;
    let dragPitch = 0;
    let targetYaw = 0;
    let targetPitch = 0;
    let cameraDistance = 0;
    let dragging = false;
    let lastPointerX = 0;
    let lastPointerY = 0;
    let lastScrollY = window.scrollY;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

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
        if (currentMode === 'intro' && !reducedMotion.matches) {
          introElapsed += dt;
          orbit += dt * 0.32 * THREE.MathUtils.smoothstep(introElapsed, 0.7, 2.3);
        }
        if (currentMode === 'companion') orbit += scrollVelocity * dt;
      }
      scrollVelocity *= Math.exp(-dt * 3.5);
      const ease = 1 - Math.exp(-dt * (dragging ? 18 : 5));
      dragYaw += (targetYaw - dragYaw) * ease;
      dragPitch += (targetPitch - dragPitch) * ease;
      pivot.rotation.set(dragPitch, orbit + dragYaw, 0);

      const aspect = Math.max(camera.aspect, 0.25);
      const vertical = THREE.MathUtils.degToRad(camera.fov) / 2;
      const yaw = orbit + dragYaw;
      const widthForRotation = currentMode === 'companion'
        ? Math.max(modelWidth, modelDepth)
        : Math.abs(modelWidth * Math.cos(yaw)) + Math.abs(modelDepth * Math.sin(yaw));
      const targetDistance = Math.max(
        modelHeight / (2 * Math.tan(vertical)),
        widthForRotation / (2 * Math.tan(vertical) * aspect),
      ) * (currentMode === 'companion' ? 1.7 : aspect < 0.8 ? 1.28 : 1.8);
      cameraDistance = cameraDistance
        ? THREE.MathUtils.lerp(cameraDistance, targetDistance, 1 - Math.exp(-dt * 3))
        : targetDistance;
      camera.position.set(0, cameraDistance * 0.1, cameraDistance);
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
      if (contactShadow) {
        scene.remove(contactShadow);
        contactShadow.geometry.dispose();
        contactShadow.material.map?.dispose();
        contactShadow.material.dispose();
      }
      renderer.dispose();
      dracoLoader.dispose();
    };
  }, [onUnavailable]);

  return <canvas ref={canvasRef} className="church-welcome__canvas" aria-label="Modelo 3D interactivo de Iglesia Jerusalén" />;
}
