// client/src/components/ModelViewer.jsx
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import './ModelViewer.css';

function ModelViewer({ modelData }) {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current || !modelData) return;

    // Create scene, camera, and renderer
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0xf0f0f0);

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Setup camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    cameraRef.current = camera;
    camera.position.z = 50;

    // Setup renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    // Add orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // Handle window resize
    const handleResize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // Clean up function
    return () => {
      window.removeEventListener('resize', handleResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Load and display model data
  useEffect(() => {
    if (!sceneRef.current || !modelData || !cameraRef.current) return;

    const scene = sceneRef.current;
    const camera = cameraRef.current;

    // Clear any existing model
    scene.children = scene.children.filter(child => !(child instanceof THREE.Mesh));

    // Option 1: Load from OBJ data directly
    if (modelData.format === 'obj' && modelData.data) {
      const loader = new OBJLoader();
      const objBlob = new Blob([modelData.data], { type: 'text/plain' });
      const objUrl = URL.createObjectURL(objBlob);
      
      loader.load(objUrl, (object) => {
        // Add material to meshes
        object.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.material = new THREE.MeshPhongMaterial({
              color: 0xffffff,
              vertexColors: true,
              flatShading: true,
            });
          }
        });

        // Center the model
        const box = new THREE.Box3().setFromObject(object);
        const center = box.getCenter(new THREE.Vector3());
        object.position.sub(center);

        // Add to scene
        scene.add(object);

        // Adjust camera to fit the model
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const distance = maxDim * 2;
        camera.position.set(distance, distance, distance);
        camera.lookAt(new THREE.Vector3(0, 0, 0));

        // Clean up
        URL.revokeObjectURL(objUrl);
      });
    } 
    // Option 2: Create from preview data directly
    else if (modelData.previewData) {
      // Create a group to hold all voxels
      const group = new THREE.Group();

      // Create a material for the voxels
      const material = new THREE.MeshPhongMaterial({
        vertexColors: true,
        flatShading: true,
      });

      // Add each voxel to the scene
      modelData.previewData.forEach(voxel => {
        const [x, y, z] = voxel.position;
        const [width, depth, height] = voxel.size;
        const [r, g, b] = voxel.color;

        // Create a box geometry for the voxel
        const geometry = new THREE.BoxGeometry(width, depth, height);
        
        // Set the color for the voxel
        const color = new THREE.Color(r / 255, g / 255, b / 255);
        
        // Create a mesh with the geometry and material
        const mesh = new THREE.Mesh(geometry, material.clone());
        mesh.material.color = color;
        
        // Position the mesh
        mesh.position.set(x + width / 2, y + depth / 2, z + height / 2);
        
        // Add to the group
        group.add(mesh);
      });

      // Center the group
      const box = new THREE.Box3().setFromObject(group);
      const center = box.getCenter(new THREE.Vector3());
      group.position.sub(center);

      // Add the group to the scene
      scene.add(group);

      // Adjust camera to fit the model
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const distance = maxDim * 3;
      camera.position.set(distance, distance, distance);
      camera.lookAt(new THREE.Vector3(0, 0, 0));
    }

  }, [modelData]);

  return (
    <div className="model-viewer" ref={containerRef}></div>
  );
}

export default ModelViewer;