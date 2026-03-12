// === MOTEUR 3D THREE.JS (APPLE-STYLE) ===
let scene, camera, renderer, nodes = [], links = [], particles = [];

function init3D() {
  // Scène avec brouillard
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x020617, 0.015);

  // Caméra
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);
  camera.position.set(0, 0, 120);

  // Canvas WebGL
  const canvas = document.getElementById('cyber-canvas');
  renderer = new THREE.WebGLRenderer({ 
    canvas: canvas, 
    antialias: true, 
    alpha: true,
    premultipliedAlpha: false
  });
  renderer.setClearColor(0x000000, 0); // fond totalement transparent
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  // Éclairage pro Apple-style
  const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
  scene.add(ambientLight);

  const pointLight1 = new THREE.PointLight(0x22d3ee, 1.2, 300);
  pointLight1.position.set(50, 50, 50);
  scene.add(pointLight1);

  const pointLight2 = new THREE.PointLight(0x4ade80, 0.8, 200);
  pointLight2.position.set(-50, -30, 80);
  scene.add(pointLight2);

  // NŒUDS CYBER (sphères métalliques PBR)
  const nodeGeometry = new THREE.SphereGeometry(1.8, 32, 32);
  const nodeMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x22d3ee,
    metalness: 0.85,
    roughness: 0.15,
    emissive: 0x22d3ee,
    emissiveIntensity: 0.3,
    clearcoat: 1,
    clearcoatRoughness: 0.1
  });

  // 12 nœuds en formation 3D
  const nodePositions = [
    [-25, 15, -30], [25, 15, -30], [0, 25, -40],
    [-35, 0, -20], [35, 0, -20], [0, -10, -25],
    [-20, -25, 0], [20, -25, 0], [-10, 10, 20],
    [10, 10, 20], [0, 0, 35], [-15, 20, 10]
  ];

  nodePositions.forEach((pos) => {
    const node = new THREE.Mesh(nodeGeometry, nodeMaterial.clone());
    node.position.set(...pos);
    scene.add(node);
    nodes.push(node);
  });

  // LIENS (cylindres entre nœuds)
  const linkGeometry = new THREE.CylinderGeometry(0.15, 0.15, 1, 8);
  const linkMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x22d3ee,
    metalness: 0.9,
    roughness: 0.2,
    emissive: 0x22d3ee,
    emissiveIntensity: 0.15,
    transparent: true,
    opacity: 0.8
  });

  const connections = [[0,1],[0,3],[1,4],[2,5],[3,6],[4,7],[5,8],[6,9],[7,10],[8,11],[9,2]];
  connections.forEach(([i1, i2]) => {
    const link = new THREE.Mesh(linkGeometry, linkMaterial.clone());
    const pos1 = nodes[i1].position;
    const pos2 = nodes[i2].position;
    link.position.lerpVectors(pos1, pos2, 0.5);
    link.scale.y = pos1.distanceTo(pos2);
    link.lookAt(pos2);
    scene.add(link);
    links.push(link);
  });

  // PARTICULES réseau
  const particleCount = 150;
  const particleGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const velocities = [];

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 100;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 60;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 80;
    velocities.push(new THREE.Vector3(
      (Math.random() - 0.5) * 0.4,
      (Math.random() - 0.5) * 0.3,
      (Math.random() - 0.5) * 0.5
    ));
  }

  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particleMaterial = new THREE.PointsMaterial({
    color: 0x4ade80,
    size: 1.2,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.9
  });
  const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(particleSystem);
  particles.push(particleSystem);

  // Boucle d'animation
  function animate() {
    requestAnimationFrame(animate);

    // Caméra orbitale fluide
    const time = Date.now() * 0.0003;
    camera.position.x = Math.cos(time) * 120;
    camera.position.z = Math.sin(time) * 120;
    camera.lookAt(0, 0, 0);

    // Animation nœuds
    nodes.forEach((node, i) => {
      const scale = 1 + Math.sin(Date.now() * 0.005 + i) * 0.15;
      node.scale.setScalar(scale);
    });

    // Animation liens
    links.forEach((link) => {
      link.rotation.z += 0.01;
      link.material.emissiveIntensity = 0.15 + Math.sin(Date.now() * 0.004) * 0.05;
    });

    // Animation particules
    const positions = particles[0].geometry.attributes.position.array;
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] += velocities[i].x;
      positions[i * 3 + 1] += velocities[i].y;
      positions[i * 3 + 2] += velocities[i].z;

      if (Math.abs(positions[i * 3]) > 60) velocities[i].x *= -1;
      if (Math.abs(positions[i * 3 + 1]) > 40) velocities[i].y *= -1;
      if (Math.abs(positions[i * 3 + 2]) > 50) velocities[i].z *= -1;
    }
    particles[0].geometry.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);
  }
  animate();

  // Responsive
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

// === ANIMATIONS BOOT + HERO ===
function typeText(element, text, speed, callback) {
  let i = 0;
  element.textContent = "";
  const interval = setInterval(() => {
    element.textContent += text.charAt(i);
    i++;
    if (i >= text.length) {
      clearInterval(interval);
      if (callback) callback();
    }
  }, speed);
}

const heroPhrases = [
  "Étudiant en Cybersécurité à Ingetis.",
  "CEO & IT manager de la marque Vatier.",
  "Passionné par la sécurité et les systèmes."
];
let heroIndex = 0;

function startHeroTyping() {
  const el = document.getElementById("hero-typed");
  if (!el) return;

  const showPhrase = () => {
    const phrase = heroPhrases[heroIndex];
    typeText(el, phrase, 55, () => {
      setTimeout(() => {
        let text = el.textContent;
        const interval = setInterval(() => {
          text = text.slice(0, -1);
          el.textContent = text;
          if (text.length === 0) {
            clearInterval(interval);
            heroIndex = (heroIndex + 1) % heroPhrases.length;
            setTimeout(showPhrase, 300);
          }
        }, 25);
      }, 1200);
    });
  };
  showPhrase();
}

// === INITIALISATION ===
document.addEventListener("DOMContentLoaded", () => {
  init3D();

  const bootScreen = document.getElementById("boot-screen");
  const portfolio  = document.getElementById("portfolio");
  const yearSpan   = document.getElementById("year");
  if (yearSpan) yearSpan.textContent = new Date().getFullYear();

  // Retour depuis un jeu (?hub=1) -> skip le boot, ouvre direct le hub
  if (new URLSearchParams(window.location.search).get("hub") === "1") {
    bootScreen.style.display = "none";
    portfolio.classList.remove("hidden");
    startHeroTyping();
    const hub = document.getElementById("game-hub");
    if (hub) hub.classList.add("open");
    history.replaceState(null, "", window.location.pathname);
    return;
  }

  // Boot sequence normale
  const bootCommand = "sudo apt embauche lemiere-dorian";
  const bootCommandEl  = document.getElementById("boot-command");
  const bootCursor     = document.getElementById("boot-cursor");
  const line2          = document.getElementById("boot-line-2");
  const line3          = document.getElementById("boot-line-3");
  const progressContainer = document.getElementById("boot-progress");
  const progressBar    = document.getElementById("progress-bar");

  typeText(bootCommandEl, bootCommand, 70, () => {
    bootCursor.style.display = "none";
    setTimeout(() => {
      line2.classList.remove("hidden");
      progressContainer.classList.remove("hidden");

      let progress = 0;
      const duration = 3200;
      const step = 40;
      const increment = (step / duration) * 100;

      const interval = setInterval(() => {
        progress = Math.min(progress + increment, 100);
        progressBar.style.width = progress + "%";

        if (progress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            line3.classList.remove("hidden");
            setTimeout(() => {
              bootScreen.style.opacity = "0";
              bootScreen.style.transition = "opacity 0.8s ease";
              setTimeout(() => {
                bootScreen.style.display = "none";
                portfolio.classList.remove("hidden");
                startHeroTyping();
              }, 800);
            }, 600);
          }, 400);
        }
      }, step);
    }, 450);
  });
});

// Formulaire demo
document.addEventListener("submit", (e) => {
  const form = e.target.closest(".contact-form");
  if (!form) return;
  e.preventDefault();
  alert("Formulaire de démonstration.\nConnecte-le plus tard à un service d'envoi d'email 😉");
});
// === GAME HUB — touche M ===
document.addEventListener("keydown", (e) => {
  if (e.key === "m" || e.key === "M") {
    // Ignorer si on tape dans un input / textarea
    const tag = document.activeElement?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;

    const hub = document.getElementById("game-hub");
    if (!hub) return;
    hub.classList.toggle("open");
  }

  if (e.key === "Escape") {
    const hub = document.getElementById("game-hub");
    if (hub) hub.classList.remove("open");
  }
});
