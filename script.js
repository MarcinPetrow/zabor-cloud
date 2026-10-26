(() => {
  const menu = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav');
  menu.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Zamknij menu' : 'Otwórz menu');
  });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('open');
    menu.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-label', 'Otwórz menu');
  }));
  const reveal = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: .08 });
    reveal.forEach(el => observer.observe(el));
  } else reveal.forEach(el => el.classList.add('visible'));
  let scheduled = false;
  const progress = document.querySelector('.progress');
  function updateProgress() {
    const scrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    progress.style.width = Math.min(100, Math.max(0, window.scrollY / scrollable * 100)) + '%';
    scheduled = false;
  }
  window.addEventListener('scroll', () => {
    if (!scheduled) { scheduled = true; requestAnimationFrame(updateProgress); }
  }, { passive: true });
  updateProgress();

  // Animated light packets travel along each connection, in both directions.
  // Pause when outside the viewport, when the page is hidden, or by user request.
  const network = document.querySelector('#cloud-network');
  const motionButton = network.querySelector('.motion-toggle');
  const motionLabel = network.querySelector('.motion-label');
  const motionIcon = network.querySelector('.motion-icon');
  const status = network.querySelector('.network-status');
  const layer = network.querySelector('.pulse-layer');
  const svgNS = 'http://www.w3.org/2000/svg';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const edges = [
    { id: 'edge-ab', color: '#49caff', speed: 0.000105 },
    { id: 'edge-bc', color: '#ffad5d', speed: 0.000095 },
    { id: 'edge-ac', color: '#24e6b5', speed: 0.00007 }
  ];
  const packets = [];
  edges.forEach((edge, edgeIndex) => {
    const path = network.querySelector('#' + edge.id);
    [0, 1].forEach((direction) => {
      const group = document.createElementNS(svgNS, 'g');
      group.setAttribute('class', 'pulse-light');
      const halo = document.createElementNS(svgNS, 'circle');
      halo.setAttribute('r', '14');
      halo.setAttribute('fill', edge.color);
      halo.setAttribute('class', 'pulse-halo');
      const dot = document.createElementNS(svgNS, 'circle');
      dot.setAttribute('r', '4.5');
      dot.setAttribute('fill', edge.color);
      dot.setAttribute('class', 'pulse-dot');
      group.append(halo, dot);
      layer.appendChild(group);
      packets.push({ path, group, direction, speed: edge.speed, phase: (edgeIndex * .23 + direction * .48) % 1 });
    });
  });
  let userPaused = reducedMotion.matches;
  let inView = false;
  let rafId = null;
  let lastFrame = null;
  let elapsed = 0;
  function paintPackets() {
    packets.forEach(packet => {
      const progress = (packet.phase + elapsed * packet.speed) % 1;
      const position = packet.direction ? 1 - progress : progress;
      const length = packet.path.getTotalLength();
      const point = packet.path.getPointAtLength(position * length);
      packet.group.setAttribute('transform', `translate(${point.x} ${point.y})`);
    });
  }
  function frame(now) {
    if (lastFrame !== null) elapsed += Math.min(now - lastFrame, 64);
    lastFrame = now;
    paintPackets();
    rafId = requestAnimationFrame(frame);
  }
  function syncMotion() {
    const paused = userPaused || reducedMotion.matches;
    network.classList.toggle('is-paused', paused);
    motionButton.setAttribute('aria-pressed', String(paused));
    motionButton.setAttribute('aria-label', paused ? 'Wznów animację połączeń' : 'Wstrzymaj animację połączeń');
    motionLabel.textContent = paused ? 'Wznów' : 'Pauza';
    motionIcon.textContent = paused ? '▶' : 'Ⅱ';
    status.textContent = paused ? 'Animacja wstrzymana' : 'Połączenia aktywne';
    const shouldRun = !paused && inView && !document.hidden;
    if (shouldRun && rafId === null) { lastFrame = null; rafId = requestAnimationFrame(frame); }
    if (!shouldRun && rafId !== null) { cancelAnimationFrame(rafId); rafId = null; lastFrame = null; }
  }
  motionButton.addEventListener('click', () => { userPaused = !userPaused; syncMotion(); });
  document.addEventListener('visibilitychange', syncMotion);
  if (reducedMotion.addEventListener) reducedMotion.addEventListener('change', syncMotion);
  if ('IntersectionObserver' in window) {
    const networkObserver = new IntersectionObserver(entries => {
      inView = entries[0].isIntersecting;
      syncMotion();
    }, { threshold: .05 });
    networkObserver.observe(network);
  } else inView = true;
  paintPackets();
  syncMotion();
})();