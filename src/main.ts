import { initAudio, playClickSound, playItemSwitchSound, playChestOpenSound, playCoinSound, toggleMusic, setVolume } from './audio.js';
import { initCanvas, player } from './canvas.js';
import { PortfolioContent, Project, Skill } from './types.js';

let appData: PortfolioContent | null = null;

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const response = await fetch('data/content.json');
    appData = (await response.json()) as PortfolioContent;

    // Direct render immediately - NO blocking "Enter World" screen!
    renderHero();
    renderAbout();
    renderSkills();
    renderProjects();
    renderContact();
    setupInteractions();

    // Start canvas with animated Terraria world & walking character
    initCanvas();

    // Initialize audio listeners on user gesture
    const unlockAudio = () => {
      initAudio();
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
    window.addEventListener('click', unlockAudio, { once: true });
    window.addEventListener('keydown', unlockAudio, { once: true });

  } catch (err) {
    console.error('Failed to load content.json', err);
  }
});

function getRarityClass(rarityName: string): string {
  const map: Record<string, string> = {
    'Cyan': 'rarity-cyan',
    'Light Purple': 'rarity-light-purple',
    'Pink': 'rarity-pink',
    'Light Red': 'rarity-light-red',
    'Orange': 'rarity-orange',
    'Green': 'rarity-green',
    'Blue': 'rarity-blue'
  };
  return map[rarityName] || 'rarity-white';
}

function getSkillColor(cat: string): string {
  if (cat === 'AI/ML') return '#05c8ff';
  if (cat === 'Data Engineering') return '#ffd24a';
  return '#3fa535';
}

function renderHero(): void {
  if (!appData) return;
  const nameEl = document.getElementById('hero-name');
  const titleEl = document.getElementById('hero-title');
  const taglineEl = document.getElementById('hero-tagline');

  if (nameEl) nameEl.innerText = appData.hero.name;
  if (titleEl) titleEl.innerText = appData.hero.title;
  if (taglineEl) taglineEl.innerText = appData.hero.tagline;

  // Terraria Guide Typewriter Dialogue
  const dialogueBox = document.getElementById('dialogue-text');
  const nextBtn = document.getElementById('dialogue-next');
  if (!dialogueBox || !nextBtn) return;

  const lines = appData.hero.dialogue;
  let currentLine = 0;

  const typeLine = (index: number) => {
    const text = lines[index];
    dialogueBox.innerHTML = '';
    nextBtn.style.display = 'none';

    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        dialogueBox.innerHTML += text.charAt(i);
        i++;
      } else {
        clearInterval(interval);
        if (currentLine < lines.length - 1) {
          nextBtn.style.display = 'inline-block';
        }
      }
    }, 25);
  };

  nextBtn.addEventListener('click', () => {
    playClickSound();
    if (currentLine < lines.length - 1) {
      currentLine++;
      typeLine(currentLine);
    }
  });

  typeLine(0);
}

function renderAbout(): void {
  if (!appData) return;

  const statList = document.getElementById('stat-list');
  if (statList) {
    statList.innerHTML = '';
    appData.about.stats.forEach(stat => {
      const li = document.createElement('li');
      li.innerHTML = `<span>${stat.label}:</span> ${stat.value}`;
      statList.appendChild(li);
    });
  }

  const textContent = document.getElementById('about-text-content');
  if (textContent) {
    textContent.innerHTML = '';
    appData.about.text.forEach(p => {
      const pEl = document.createElement('p');
      pEl.innerHTML = p;
      textContent.appendChild(pEl);
    });
  }

  const achievementsList = document.getElementById('achievements-list');
  if (achievementsList) {
    achievementsList.innerHTML = '';
    appData.about.achievements.forEach(ach => {
      const div = document.createElement('div');
      div.className = 'achievement-item';
      div.innerHTML = `<strong>🏆 ${ach.title}</strong><br><span style="font-size:0.95rem; color:#ffd24a;">${ach.description}</span>`;
      div.addEventListener('mouseenter', () => playCoinSound());
      achievementsList.appendChild(div);
    });
  }
}

function renderSkills(filter = 'all'): void {
  if (!appData) return;
  const grid = document.getElementById('inventory-grid');
  if (!grid) return;
  grid.innerHTML = '';

  appData.skills.forEach(skill => {
    if (filter !== 'all' && skill.category !== filter) return;

    const slot = document.createElement('div');
    slot.className = 'slot';
    slot.innerHTML = `
      <div class="slot-item-icon" style="border-color: ${getSkillColor(skill.category)};">
        <span>${skill.name.slice(0, 3).toUpperCase()}</span>
      </div>
    `;

    slot.addEventListener('mouseenter', (e) => {
      playClickSound();
      showTooltip(e, skill);
    });
    slot.addEventListener('mouseleave', hideTooltip);

    slot.addEventListener('click', (e) => {
      showTooltip(e, skill, true);
    });

    grid.appendChild(slot);
  });
}

function showTooltip(e: MouseEvent, data: Skill, isMobile = false): void {
  const tt = document.getElementById('dynamic-tooltip');
  if (!tt) return;

  const nameEl = document.getElementById('tt-name');
  const typeEl = document.getElementById('tt-type');
  const descEl = document.getElementById('tt-desc');

  if (nameEl) {
    nameEl.textContent = data.name;
    nameEl.className = getRarityClass(data.rarity);
  }
  if (typeEl) typeEl.textContent = `[${data.category}] - ${data.rarity} Rarity`;
  if (descEl) descEl.textContent = data.desc;

  tt.setAttribute('aria-hidden', 'false');

  if (!isMobile) {
    const updatePos = (ev: MouseEvent) => {
      let x = ev.clientX + 16;
      let y = ev.clientY + 16;
      if (x + tt.offsetWidth > window.innerWidth) x = ev.clientX - tt.offsetWidth - 8;
      if (y + tt.offsetHeight > window.innerHeight) y = ev.clientY - tt.offsetHeight - 8;
      tt.style.left = `${x}px`;
      tt.style.top = `${y}px`;
    };
    updatePos(e);
    const target = e.currentTarget as HTMLElement;
    const moveHandler = (ev: Event) => updatePos(ev as MouseEvent);
    target.addEventListener('mousemove', moveHandler);
    target.addEventListener('mouseleave', () => {
      target.removeEventListener('mousemove', moveHandler);
      hideTooltip();
    }, { once: true });
  } else {
    tt.style.left = '50%';
    tt.style.top = '50%';
    tt.style.transform = 'translate(-50%, -50%)';
  }
}

function hideTooltip(): void {
  const tt = document.getElementById('dynamic-tooltip');
  if (tt) {
    tt.setAttribute('aria-hidden', 'true');
    tt.style.transform = 'none';
  }
}

function renderProjects(): void {
  if (!appData) return;
  const cavePath = document.getElementById('cave-path');
  if (!cavePath) return;
  cavePath.innerHTML = '';

  appData.projects.forEach(proj => {
    const chest = document.createElement('div');
    chest.className = 'chest-item';
    chest.innerHTML = `
      <div class="chest-sprite">
        <div class="chest-glow"></div>
      </div>
      <div class="chest-title ${getRarityClass(proj.rarity)}">${proj.title}</div>
      <div class="chest-sub">${proj.subtitle}</div>
    `;

    chest.addEventListener('click', () => {
      playChestOpenSound();
      openProjectModal(proj);
    });

    cavePath.appendChild(chest);
  });
}

function openProjectModal(proj: Project): void {
  const modal = document.getElementById('project-modal');
  if (!modal) return;

  const titleEl = document.getElementById('modal-title');
  const subEl = document.getElementById('modal-subtitle');
  const descEl = document.getElementById('modal-desc');
  const techEl = document.getElementById('modal-tech');
  const githubBtn = document.getElementById('modal-github') as HTMLAnchorElement | null;

  if (titleEl) {
    titleEl.textContent = proj.title;
    titleEl.className = getRarityClass(proj.rarity);
  }
  if (subEl) subEl.textContent = proj.subtitle;
  if (descEl) descEl.textContent = proj.description;

  if (techEl) {
    techEl.innerHTML = '';
    proj.tech.forEach(t => {
      const span = document.createElement('span');
      span.className = 'tech-tag';
      span.textContent = t;
      techEl.appendChild(span);
    });
  }

  if (githubBtn) {
    githubBtn.href = `https://github.com/andikaprasetyaaa/${proj.repo}`;
  }

  modal.setAttribute('aria-hidden', 'false');
}

function renderContact(): void {
  if (!appData) return;
  const linksContainer = document.getElementById('contact-links');
  const hireBtn = document.getElementById('hire-btn') as HTMLAnchorElement | null;

  if (linksContainer) {
    linksContainer.innerHTML = '';
    const c = appData.contact;
    if (c.github && c.github !== 'REPLACE_ME') {
      linksContainer.innerHTML += `<a href="${c.github}" target="_blank" rel="noopener noreferrer" class="pixel-button">GitHub</a>`;
    }
    if (c.linkedin && c.linkedin !== 'REPLACE_ME') {
      linksContainer.innerHTML += `<a href="${c.linkedin}" target="_blank" rel="noopener noreferrer" class="pixel-button">LinkedIn 🛡️</a>`;
    }
  }

  if (hireBtn && appData.contact.email && appData.contact.email !== 'REPLACE_ME') {
    hireBtn.href = `mailto:${appData.contact.email}`;
  }
}

function setupInteractions(): void {
  // Modal Close
  const closeModalBtn = document.querySelector('.close-modal');
  const modal = document.getElementById('project-modal');
  if (closeModalBtn && modal) {
    closeModalBtn.addEventListener('click', () => {
      playClickSound();
      modal.setAttribute('aria-hidden', 'true');
    });
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.setAttribute('aria-hidden', 'true');
      }
    });
  }

  // Skill Tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      playClickSound();
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      const target = e.currentTarget as HTMLElement;
      target.classList.add('active');
      renderSkills(target.getAttribute('data-category') || 'all');
    });
  });

  // 10-Slot Terraria Hotbar
  const hotbarSlots = document.querySelectorAll('.hotbar .slot');
  hotbarSlots.forEach((slot, idx) => {
    slot.addEventListener('click', () => {
      selectHotbarSlot(idx);
    });
  });

  // Hotbar Numeric Keybinds (1 to 9, and 0 for 10th slot)
  window.addEventListener('keydown', (e) => {
    if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;

    if (e.key >= '1' && e.key <= '9') {
      const idx = parseInt(e.key) - 1;
      selectHotbarSlot(idx);
    } else if (e.key === '0') {
      selectHotbarSlot(9);
    }
  });

  // Scroll Depth Meter & Active Hotbar


  // Removed scroll-based depth meter since we are using a static dashboard layout.

  // Back to Surface Button
  const backToTop = document.getElementById('btn-back-to-top');
  if (backToTop) {
    backToTop.addEventListener('click', () => {
      playClickSound();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // HUD Day/Night Toggle
  const toggleDayNight = document.getElementById('toggle-day-night');
  if (toggleDayNight) {
    toggleDayNight.addEventListener('click', () => {
      playClickSound();
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'night' ? 'light' : 'night';
      document.documentElement.setAttribute('data-theme', next);
      toggleDayNight.textContent = next === 'night' ? '☀️' : '🌙';
    });
  }

  // HUD Music Toggle
  const toggleMusicBtn = document.getElementById('toggle-music');
  if (toggleMusicBtn) {
    toggleMusicBtn.addEventListener('click', () => {
      const isNowPlaying = toggleMusic();
      toggleMusicBtn.textContent = isNowPlaying ? '🔊' : '🔇';
    });
  }

  // Volume Slider
  const volSlider = document.getElementById('volume-slider') as HTMLInputElement | null;
  if (volSlider) {
    volSlider.addEventListener('input', (e) => {
      setVolume(parseFloat((e.target as HTMLInputElement).value));
    });
  }
}

function selectHotbarSlot(idx: number): void {
  const hotbarSlots = document.querySelectorAll('.hotbar .slot');
  if (!hotbarSlots[idx]) return;

  hotbarSlots.forEach((s, i) => s.classList.toggle('active', i === idx));
  playItemSwitchSound();

  const leftPanel = document.getElementById('panel-left');
  const rightPanel = document.getElementById('panel-right');

  if (idx === 0) {
    if (leftPanel) leftPanel.scrollTo({ top: 0, behavior: 'smooth' });
    if (rightPanel) rightPanel.scrollTo({ top: 0, behavior: 'smooth' });
  } else if (idx === 1) { // About
    if (rightPanel) {
       const about = document.querySelector('.chat-container') as HTMLElement;
       if (about) rightPanel.scrollTo({ top: about.offsetTop - 50, behavior: 'smooth' });
    }
  } else if (idx === 2) { // Skills
    if (leftPanel) {
       const skills = document.querySelector('.inventory-tabs') as HTMLElement;
       if (skills) leftPanel.scrollTo({ top: skills.offsetTop - 50, behavior: 'smooth' });
    }
  } else if (idx === 3) { // Projects
    if (rightPanel) {
       const projects = document.getElementById('cave-path');
       if (projects) rightPanel.scrollTo({ top: projects.offsetTop - 80, behavior: 'smooth' });
    }
  } else if (idx === 4) { // Contact
    if (rightPanel) {
       const contact = document.getElementById('contact-links');
       if (contact) rightPanel.scrollTo({ top: contact.offsetTop - 80, behavior: 'smooth' });
    }
  } else if (idx === 5) {
    player.toggleWeapon();
  } else if (idx === 6) {
    player.triggerEmote();
  } else if (idx === 7) {
    const toggleDayNight = document.getElementById('toggle-day-night');
    toggleDayNight?.click();
  } else if (idx === 8) {
    const toggleMusicBtn = document.getElementById('toggle-music');
    toggleMusicBtn?.click();
  } else if (idx === 9) {
    if (leftPanel) leftPanel.scrollTo({ top: 0, behavior: 'smooth' });
    if (rightPanel) rightPanel.scrollTo({ top: 0, behavior: 'smooth' });
    player.triggerEmote("🌀 Used Magic Mirror!");
  }
}
