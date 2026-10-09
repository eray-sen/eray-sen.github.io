(() => {
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  /* ---------------- Network canvas ---------------- */
  const canvas = document.getElementById("network");
  const ctx = canvas.getContext("2d");

  const LINK_DIST = 140;
  const MOUSE_DIST = 190;
  const mouse = { x: -9999, y: -9999 };

  let w = 0,
    h = 0,
    nodes = [],
    packets = [],
    lastSpawn = 0;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = Math.min(115, Math.max(28, Math.floor((w * h) / 15000)));
    nodes = Array.from({ length: count }, () => {
      const hub = Math.random() < 0.12; // "routers" are larger and brighter
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.34,
        vy: (Math.random() - 0.5) * 0.34,
        r: hub ? 3.2 : 1.6 + Math.random() * 0.8,
        hub,
      };
    });
    packets = [];
    if (reduceMotion) draw();
  }

  function spawnPacket(now) {
    if (now - lastSpawn < 450 || packets.length > 14) return;
    lastSpawn = now;
    const a = nodes[(Math.random() * nodes.length) | 0];
    const near = nodes.filter((b) => {
      if (b === a) return false;
      const dx = a.x - b.x,
        dy = a.y - b.y;
      return dx * dx + dy * dy < LINK_DIST * LINK_DIST;
    });
    if (!near.length) return;
    packets.push({ a, b: near[(Math.random() * near.length) | 0], t: 0 });
  }

  function step() {
    for (const n of nodes) {
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < -20) n.x = w + 20;
      if (n.x > w + 20) n.x = -20;
      if (n.y < -20) n.y = h + 20;
      if (n.y > h + 20) n.y = -20;

      // gentle pull toward the cursor
      const dx = mouse.x - n.x,
        dy = mouse.y - n.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < MOUSE_DIST * MOUSE_DIST && d2 > 1) {
        n.x += dx * 0.004;
        n.y += dy * 0.004;
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);

    // links between nodes
    ctx.lineWidth = 1;
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = a.x - b.x,
          dy = a.y - b.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < LINK_DIST) {
          ctx.strokeStyle = `rgba(91,140,255,${(1 - d / LINK_DIST) * 0.4})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
      // links to the cursor
      const mx = a.x - mouse.x,
        my = a.y - mouse.y;
      const md = Math.sqrt(mx * mx + my * my);
      if (md < MOUSE_DIST) {
        ctx.strokeStyle = `rgba(56,232,198,${(1 - md / MOUSE_DIST) * 0.6})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.stroke();
      }
    }

    // nodes
    for (const n of nodes) {
      if (n.hub) {
        ctx.fillStyle = "rgba(56,232,198,0.16)";
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * 3.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#38e8c6";
      } else {
        ctx.fillStyle = "rgba(150,180,255,0.75)";
      }
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // packets travelling along links
    for (const p of packets) {
      const x = p.a.x + (p.b.x - p.a.x) * p.t;
      const y = p.a.y + (p.b.y - p.a.y) * p.t;
      ctx.fillStyle = "rgba(56,232,198,0.25)";
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(x, y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function loop(now) {
    step();
    spawnPacket(now);
    for (const p of packets) p.t += 0.022;
    packets = packets.filter((p) => p.t < 1);
    draw();
    requestAnimationFrame(loop);
  }

  window.addEventListener("resize", resize);
  window.addEventListener("pointermove", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });
  window.addEventListener("pointerleave", () => {
    mouse.x = mouse.y = -9999;
  });
  resize();
  if (!reduceMotion) requestAnimationFrame(loop);

  /* ---------------- Typing effect ---------------- */
  const typedEl = document.getElementById("typed");
  const phrases = [
    "Computer Science Student",
    "Network Enthusiast",
    "CCNA Certified",
    "CCNA Automation Certified",
  ];

  if (!reduceMotion) {
    let pi = 0,
      ci = phrases[0].length,
      deleting = true;
    const tick = () => {
      const text = phrases[pi];
      typedEl.textContent = text.slice(0, ci);
      let delay = deleting ? 38 : 75;

      if (!deleting && ci === text.length) {
        deleting = true;
        delay = 1700;
      } else if (deleting && ci === 0) {
        deleting = false;
        pi = (pi + 1) % phrases.length;
        delay = 350;
      } else {
        ci += deleting ? -1 : 1;
      }
      setTimeout(tick, delay);
    };
    setTimeout(tick, 1800);
  }

  /* ---------------- Reveal on scroll ---------------- */
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15 },
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("visible"));
  }

  /* ---------------- Card spotlight ---------------- */
  document.querySelectorAll(".card").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", e.clientX - r.left + "px");
      card.style.setProperty("--my", e.clientY - r.top + "px");
    });
  });

  /* ---------------- Footer year ---------------- */
  document.getElementById("year").textContent = new Date().getFullYear();
})();
