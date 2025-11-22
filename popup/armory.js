// Armory - 3D Weapon Selector
// Manages 3D weapon models, user interaction, and state synchronization

// Import Three.js libraries
import * as THREE from '../libs/three.module.min.js';
import { GLTFLoader } from '../libs/GLTFLoader.js';

// Configuration
const WEAPONS = [
    { id: 'pistol', name: 'Pistol', model: '../assets/models/pistol.glb' },
    { id: 'shotgun', name: 'Shotgun', model: '../assets/models/shotgun.glb' },
    { id: 'flamethrower', name: 'Flamethrower', model: '../assets/models/flamethrower.glb' },
    { id: 'rpg', name: 'RPG', model: '../assets/models/rpg.glb' },
    { id: 'rifle', name: 'Automatic Rifle', model: '../assets/models/rifle.glb' },
    { id: 'laser', name: 'Laser', model: '../assets/models/laser.glb' }
];

// Global state
let currentWeapon = 'pistol';
let loadedModels = {};
let scenes = {};
let renderers = {};
let cameras = {};
let controls = {};
let animationFrames = {};

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', async () => {
    await init();
});

async function init() {
    // Load current weapon from storage
    const result = await chrome.storage.local.get(['currentWeapon']);
    if (result.currentWeapon) {
        currentWeapon = result.currentWeapon;
    }

    // Set up close button
    const closeBtn = document.getElementById('close-btn');
    closeBtn.addEventListener('click', closeArmory);

    // ESC key to close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeArmory();
        }
    });

    // Load all weapon models
    await loadAllWeapons();

    // Update active weapon card
    updateActiveWeapon(currentWeapon);

    // Hide loading overlay
    const loadingOverlay = document.getElementById('loading-overlay');
    loadingOverlay.classList.add('hidden');
}

async function loadAllWeapons() {
    const loader = new GLTFLoader();

    for (const weapon of WEAPONS) {
        try {
            // Create scene for this weapon preview
            const previewContainer = document.getElementById(`preview-${weapon.id}`);
            if (!previewContainer) continue;

            // Set up Three.js scene
            const scene = new THREE.Scene();
            scenes[weapon.id] = scene;

            // Camera
            const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
            camera.position.set(0, 0, 3);
            cameras[weapon.id] = camera;

            // Renderer
            const renderer = new THREE.WebGLRenderer({
                antialias: true,
                alpha: true,
                powerPreference: 'high-performance'
            });
            renderer.setSize(previewContainer.offsetWidth, previewContainer.offsetHeight);
            renderer.setClearColor(0x000000, 0);
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            previewContainer.appendChild(renderer.domElement);
            renderers[weapon.id] = renderer;

            // Lighting
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
            scene.add(ambientLight);

            const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
            directionalLight.position.set(5, 5, 5);
            directionalLight.castShadow = true;
            scene.add(directionalLight);

            // Add accent light (red glow)
            const accentLight = new THREE.PointLight(0xff4444, 0.5, 10);
            accentLight.position.set(-2, 1, 2);
            scene.add(accentLight);

            // Load GLB model
            const gltf = await new Promise((resolve, reject) => {
                loader.load(
                    weapon.model,
                    (gltf) => resolve(gltf),
                    undefined,
                    (error) => reject(error)
                );
            });

            const model = gltf.scene;
            loadedModels[weapon.id] = model;

            // Center and scale model
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());

            model.position.sub(center);
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 2 / maxDim;
            model.scale.multiplyScalar(scale);

            scene.add(model);

            // Start animation loop for this weapon
            animateWeapon(weapon.id);

            // Add click handler to weapon card
            const weaponCard = document.querySelector(`[data-weapon="${weapon.id}"]`);
            if (weaponCard) {
                weaponCard.addEventListener('click', () => selectWeapon(weapon.id));
            }

        } catch (error) {
            console.error(`Failed to load weapon ${weapon.id}:`, error);
        }
    }
}

function animateWeapon(weaponId) {
    const scene = scenes[weaponId];
    const camera = cameras[weaponId];
    const renderer = renderers[weaponId];
    const model = loadedModels[weaponId];

    if (!scene || !camera || !renderer || !model) return;

    function animate() {
        animationFrames[weaponId] = requestAnimationFrame(animate);

        // Slowly rotate weapon
        model.rotation.y += 0.005;

        renderer.render(scene, camera);
    }

    animate();
}

function selectWeapon(weaponId) {
    currentWeapon = weaponId;

    // Play selection sound
    playSelectionSound();

    // Update UI
    updateActiveWeapon(weaponId);

    // Save to storage
    chrome.storage.local.set({ currentWeapon: weaponId });

    // Notify content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, {
                type: 'CHANGE_WEAPON',
                weapon: weaponId
            });
        }
    });

    // Visual feedback
    const card = document.querySelector(`[data-weapon="${weaponId}"]`);
    if (card) {
        card.style.transform = 'scale(1.05)';
        setTimeout(() => {
            card.style.transform = '';
        }, 200);
    }
}

function playSelectionSound() {
    // Create Web Audio context
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    // Create oscillator for the beep
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Configure sound (higher pitch, short duration)
    oscillator.frequency.value = 800; // Hz
    oscillator.type = 'sine';

    // Envelope for smooth sound
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

    // Play sound
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
}

function updateActiveWeapon(weaponId) {
    const weaponCards = document.querySelectorAll('.weapon-card');
    weaponCards.forEach(card => {
        if (card.dataset.weapon === weaponId) {
            card.classList.add('active');
        } else {
            card.classList.remove('active');
        }
    });
}

function closeArmory() {
    // Stop all animations
    Object.keys(animationFrames).forEach(weaponId => {
        if (animationFrames[weaponId]) {
            cancelAnimationFrame(animationFrames[weaponId]);
        }
    });

    // Clean up renderers
    Object.values(renderers).forEach(renderer => {
        renderer.dispose();
    });

    // Close window
    window.close();
}

// Handle window resize
window.addEventListener('resize', () => {
    Object.keys(renderers).forEach(weaponId => {
        const previewContainer = document.getElementById(`preview-${weaponId}`);
        const renderer = renderers[weaponId];
        const camera = cameras[weaponId];

        if (previewContainer && renderer && camera) {
            const width = previewContainer.offsetWidth;
            const height = previewContainer.offsetHeight;

            renderer.setSize(width, height);
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
        }
    });
});
