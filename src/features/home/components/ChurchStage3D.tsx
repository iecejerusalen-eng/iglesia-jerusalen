import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

type StageProps = {
  mode: 'intro' | 'entering' | 'companion';
  onUnavailable: () => void;
  autoRotate: boolean;
  command: { id: number; action: 'zoom-in' | 'zoom-out' | 'reset' } | null;
};

export default function ChurchStage({ mode, onUnavailable, autoRotate, command }: StageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modeRef = useRef(mode);
  const autoRotateRef = useRef(autoRotate);
  const commandRef = useRef(command);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { autoRotateRef.current = autoRotate; }, [autoRotate]);
  useEffect(() => { commandRef.current = command; }, [command]);

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
    let yaw = 0;
    let pitch = 0;
    let yawVelocity = 0;
    let autoSpeed = 0;
    let targetZoom = 1;
    let zoom = 1;
    let handledCommand = 0;
    let resetting = false;
    let lastInteraction = performance.now();
    let hasInteracted = false;
    let scrollVelocity = 0;
    let cameraDistance = 0;
    const pointers = new Map<number, { x: number; y: number }>();
    let pinchDistance = 0;
    let lastPointerTime = 0;
    let lastScrollY = window.scrollY;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const clampZoom = (value: number) => THREE.MathUtils.clamp(value, 0.72, 2.1);

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
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      lastInteraction = performance.now();
      hasInteracted = true;
      lastPointerTime = event.timeStamp;
      yawVelocity = 0;
      resetting = false;
      canvas.setPointerCapture(event.pointerId);
      canvas.classList.add('is-dragging');
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinchDistance = Math.hypot(a.x - b.x, a.y - b.y);
      }
    };
    const pointerMove = (event: PointerEvent) => {
      const previous = pointers.get(event.pointerId);
      if (!previous) return;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      lastInteraction = performance.now();
      if (pointers.size === 2 && modeRef.current === 'intro') {
        const [a, b] = [...pointers.values()];
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinchDistance > 0) targetZoom = clampZoom(targetZoom * distance / pinchDistance);
        pinchDistance = distance;
        yawVelocity = 0;
        return;
      }
      const dx = event.clientX - previous.x;
      yaw += dx * 0.008;
      pitch = THREE.MathUtils.clamp(pitch + (event.clientY - previous.y) * 0.006, -0.55, 0.55);
      const elapsed = (event.timeStamp - lastPointerTime) / 1000;
      if (elapsed > 0.005 && elapsed < 0.12) {
        const instantaneous = THREE.MathUtils.clamp(dx * 0.008 / elapsed, -1.7, 1.7);
        yawVelocity = THREE.MathUtils.lerp(yawVelocity, instantaneous, 0.55);
      }
      lastPointerTime = event.timeStamp;
    };
    const pointerUp = (event: PointerEvent) => {
      pointers.delete(event.pointerId);
      if (event.timeStamp - lastPointerTime > 90) yawVelocity = 0;
      lastInteraction = performance.now();
      if (pointers.size < 2) pinchDistance = 0;
      if (pointers.size === 1) lastPointerTime = event.timeStamp;
      if (pointers.size === 0) canvas.classList.remove('is-dragging');
    };
    const wheel = (event: WheelEvent) => {
      if (modeRef.current === 'intro' && event.currentTarget === canvas) {
        event.preventDefault();
        targetZoom = clampZoom(targetZoom * Math.exp(-THREE.MathUtils.clamp(event.deltaY, -300, 300) * 0.001));
        lastInteraction = performance.now();
        hasInteracted = true;
        return;
      }
      if (modeRef.current !== 'companion' || event.currentTarget === canvas) return;
      scrollVelocity += THREE.MathUtils.clamp(event.deltaY, -450, 450) * 0.0022;
      scrollVelocity = THREE.MathUtils.clamp(scrollVelocity, -3.2, 3.2);
    };
    const keyboard = (event: globalThis.KeyboardEvent) => {
      if (modeRef.current !== 'intro') return;
      let handled = true;
      if (event.key === 'ArrowLeft') yaw -= 0.18;
      else if (event.key === 'ArrowRight') yaw += 0.18;
      else if (event.key === 'ArrowUp') pitch = THREE.MathUtils.clamp(pitch - 0.12, -0.55, 0.55);
      else if (event.key === 'ArrowDown') pitch = THREE.MathUtils.clamp(pitch + 0.12, -0.55, 0.55);
      else if (event.key === '+' || event.key === '=') targetZoom = clampZoom(targetZoom * 1.18);
      else if (event.key === '-') targetZoom = clampZoom(targetZoom / 1.18);
      else handled = false;
      if (handled) {
        event.preventDefault();
        yawVelocity = 0;
        resetting = false;
        lastInteraction = performance.now();
        hasInteracted = true;
      }
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
    canvas.addEventListener('wheel', wheel, { passive: false });
    canvas.addEventListener('keydown', keyboard);
    window.addEventListener('wheel', wheel, { passive: true });
    window.addEventListener('scroll', scroll, { passive: true });

    const render = (time: number) => {
      const dt = Math.min((time - (lastTime || time)) / 1000, 0.05);
      lastTime = time;
      const currentMode = modeRef.current;
      const requested = commandRef.current;
      if (requested && requested.id !== handledCommand) {
        handledCommand = requested.id;
        lastInteraction = time;
        hasInteracted = true;
        yawVelocity = 0;
        if (requested.action === 'zoom-in') targetZoom = clampZoom(targetZoom * 1.25);
        else if (requested.action === 'zoom-out') targetZoom = clampZoom(targetZoom / 1.25);
        else {
          targetZoom = 1;
          resetting = true;
        }
      }
      const dragging = pointers.size > 0;
      if (!dragging) {
        if (resetting) {
          const front = Math.round(yaw / (Math.PI * 2)) * Math.PI * 2;
          yaw = THREE.MathUtils.damp(yaw, front, 6, dt);
          pitch = THREE.MathUtils.damp(pitch, 0, 6, dt);
          if (Math.abs(yaw - front) < 0.002 && Math.abs(pitch) < 0.002) resetting = false;
        } else {
          yaw += yawVelocity * dt;
          yawVelocity *= Math.exp(-dt * 4.2);
        }
        if (currentMode === 'companion') yaw += scrollVelocity * dt;
      }
      const canOrbit = currentMode === 'intro' && autoRotateRef.current && !reducedMotion.matches &&
        !dragging && !resetting && time - lastInteraction > (hasInteracted ? 850 : 1800);
      autoSpeed = THREE.MathUtils.damp(autoSpeed, canOrbit ? 0.24 : 0, 3, dt);
      if (!dragging && !resetting) yaw += autoSpeed * dt;
      scrollVelocity *= Math.exp(-dt * 3.5);
      zoom = THREE.MathUtils.damp(zoom, currentMode === 'intro' ? targetZoom : 1, 6, dt);
      pivot.rotation.set(pitch, yaw, 0);

      const aspect = Math.max(camera.aspect, 0.25);
      const vertical = THREE.MathUtils.degToRad(camera.fov) / 2;
      // Una caja de encuadre fija evita que la cámara parezca «respirar» al girar.
      const widthForRotation = Math.hypot(modelWidth, modelDepth);
      const targetDistance = Math.max(
        modelHeight / (2 * Math.tan(vertical)),
        widthForRotation / (2 * Math.tan(vertical) * aspect),
      ) * (currentMode === 'companion' ? 1.7 : aspect < 0.8 ? 0.94 : 1.5) / zoom;
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
      canvas.removeEventListener('wheel', wheel);
      canvas.removeEventListener('keydown', keyboard);
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

  return <canvas ref={canvasRef} className="church-welcome__canvas" tabIndex={mode === 'intro' ? 0 : -1} aria-label="Modelo 3D interactivo de Iglesia Jerusalén. Usa las flechas para girar y las teclas más y menos para acercar o alejar." />;
}
