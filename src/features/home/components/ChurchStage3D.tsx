import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

type StageProps = {
  progress: number;
  entering: boolean;
  onUnavailable: () => void;
  onEntered: () => void;
};

export default function ChurchStage({ progress, entering, onUnavailable, onEntered }: StageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ progress, entering, onEntered });
  useEffect(() => { stateRef.current = { progress, entering, onEntered }; }, [progress, entering, onEntered]);

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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 130);
    scene.add(new THREE.HemisphereLight(0xf5faff, 0xbfcbe2, 2.5));
    const sun = new THREE.DirectionalLight(0xfff7e6, 3.1);
    sun.position.set(-8, 14, 10);
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0xc9dfff, 1.4);
    fill.position.set(9, 6, -5);
    scene.add(fill);

    const modelPivot = new THREE.Group();
    scene.add(modelPivot);
    const loader = new GLTFLoader();
    let alive = true;
    let loadedModel: THREE.Group | null = null;
    loader.load('/models/iglesia-jerusalen-intro.glb', (gltf) => {
      if (!alive) return;
      loadedModel = gltf.scene;
      modelPivot.add(gltf.scene);
    }, undefined, () => {
      if (alive) onUnavailable();
    });

    let frame = 0;
    let current = 0;
    let zoom = 0;
    let entered = false;
    const size = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(size);
    observer.observe(canvas);
    size();

    const render = () => {
      const target = stateRef.current;
      current += (target.progress - current) * 0.18;
      zoom += ((target.entering ? 1 : 0) - zoom) * 0.055;
      const narrow = camera.aspect < 0.75;
      const modelScale = narrow ? 0.46 : 0.67 + current * 0.13;
      modelPivot.scale.setScalar(modelScale * (1 + zoom * 0.75));
      modelPivot.position.set(narrow ? 0 : 3.1, (1 - current) * (narrow ? 12 : 5.1) - zoom * 0.8, 0);
      modelPivot.rotation.y = (1 - current) * -1.25;
      modelPivot.rotation.z = (1 - current) * -0.08;
      const distance = narrow ? 21 : 19;
      camera.position.set(0, 5.7 + (1 - current) * 2.7 - zoom * 1.4, distance - zoom * 9);
      camera.lookAt(0, 3.55 + (1 - current) * 1.4, 0);
      renderer.render(scene, camera);
      if (target.entering && zoom > 0.985 && !entered) {
        entered = true;
        target.onEntered();
      }
      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);
    return () => {
      alive = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
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
    };
  }, [onUnavailable]);

  return <canvas ref={canvasRef} className="church-welcome__canvas" aria-hidden="true" />;
}
