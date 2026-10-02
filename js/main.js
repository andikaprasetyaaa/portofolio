import { initAudio, playClickSound, toggleMusic, setVolume } from './audio.js';
import { initCanvas } from './canvas.js';

let appData = null;

// Audio unlock wrapper
let audioUnlocked = false;
function unlockAudio() {
  if (audioUnlocked) return;
  initAudio();
  audioUnlocked = true;
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('data/content.json');
        appData = await response.json();
        
        setupTitleScreen();
        setupInteractions();
        
        // Wait a small delay to simulate loading
        const isReturning = localStorage.getItem('zoro_visited') === 'true';
        const loadTime = isReturning ? 100 : 1200;
        
        setTimeout(() => {
            document.querySelector('.loading-bar-container').style.display = 'none';
            document.querySelector('.title-buttons').style.display = 'flex';
            document.getElementById('title-tagline').innerText = appData.hero.taglines[Math.floor(Math.random() * appData.hero.taglines.length)];
        }, loadTime);

    } catch (e) {
        console.error("Failed to load content.json", e);
    }
});

function setupTitleScreen() {
    const titleScreen = document.getElementById('title-screen');
    const btnEnter = document.getElementById('btn-enter');
    const btnSilent = document.getElementById('btn-silent');
    
    const enterWorld = (playMusic = true) => {
        unlockAudio();
        
        if (playMusic) {
            toggleMusic(true);
            document.getElementById('toggle-music').textContent = '🔊';
        } else {
            toggleMusic(false);
            document.getElementById('toggle-music').textContent = '🔇';
        }
        
        playClickSound();
        
        localStorage.setItem('zoro_visited', 'true');
        
        titleScreen.style.opacity = '0';
        setTimeout(() => {
            titleScreen.style.display = 'none';
            document.getElementById('hud').setAttribute('aria-hidden', 'false');
            
            renderHero();
            renderAbout();
            renderSkills();
            renderProjects();
            renderContact();
            
            initCanvas();
        }, 500);
    };

    btnEnter.addEventListener('click', () => enterWorld(true));
    btnSilent.addEventListener('click', () => enterWorld(false));
}

function renderHero() {
    document.getElementById('hero-name').innerText = appData.hero.name;
    document.getElementById('hero-title').innerText = appData.hero.title;
    document.getElementById('hero-tagline').innerText = appData.hero.tagline;
    
    // Typewriter effect
    const dialogueBox = document.getElementById('dialogue-text');
    const nextBtn = document.getElementById('dialogue-next');
    const lines = appData.hero.dialogue;
    let currentLine = 0;
    
    const typeLine = (index) => {
        const text = lines[index];
        dialogueBox.innerHTML = '';
        nextBtn.style.display = 'none';
        
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            dialogueBox.innerHTML = text;
            if (currentLine < lines.length - 1) {
                nextBtn.style.display = 'inline-block';
            }
            return;
        }

        let i = 0;
        const interval = setInterval(() => {
            if (i < text.length) {
                dialogueBox.innerHTML += text.charAt(i);
                // Optional: play blip sound
                i++;
            } else {
                clearInterval(interval);
                if (currentLine < lines.length - 1) {
                    nextBtn.style.display = 'inline-block';
                }
            }
        }, 30);
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

function renderAbout() {
    const statList = document.getElementById('stat-list');
    appData.about.stats.forEach(stat => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${stat.label}:</span> ${stat.value}`;
        statList.appendChild(li);
    });
    
    const textContent = document.getElementById('about-text-content');
    appData.about.text.forEach(p => {
        const pEl = document.createElement('p');
        pEl.innerHTML = p;
        textContent.appendChild(pEl);
    });
    
    const achievementsList = document.getElementById('achievements-list');
    appData.about.achievements.forEach(ach => {
        const div = document.createElement('div');
        div.className = 'achievement-item';
        div.innerHTML = `<strong>${ach.title}</strong><br><span style="font-size:0.9rem; color:#aaa;">${ach.description}</span>`;
        achievementsList.appendChild(div);
    });
}

function getRarityClass(rarityName) {
    const map = {
        'Cyan': 'rarity-cyan',
        'Light Purple': 'rarity-light-purple',
        'Pink': 'rarity-pink',
        'Light Red': 'rarity-light-red',
        'Orange': 'rarity-orange',
        'Green': 'rarity-green',
        'Blue': 'rarity-blue'
    };
    return map[rarityName] || '';
}

function renderSkills(filter = 'all') {
    const grid = document.getElementById('inventory-grid');
    grid.innerHTML = '';
    
    appData.skills.forEach(skill => {
        if (filter !== 'all' && skill.category !== filter) return;
        
        const slot = document.createElement('div');
        slot.className = 'slot';
        slot.innerHTML = `<div class="slot-icon" style="background-color: ${getSkillColor(skill.category)};"></div>`;
        
        // Tooltip logic
        slot.addEventListener('mouseenter', (e) => showTooltip(e, skill));
        slot.addEventListener('mouseleave', hideTooltip);
        
        // Mobile tap
        slot.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                showTooltip(e, skill, true);
            }
        });
        
        grid.appendChild(slot);
    });

    // Core skills hotbar logic
    if (filter === 'all') {
        const coreGrid = document.getElementById('core-skills-hotbar');
        if (coreGrid) {
            coreGrid.innerHTML = '';
            const coreSkills = appData.skills.slice(0, 5); // first 5
            coreSkills.forEach(skill => {
                const slot = document.createElement('div');
                slot.className = 'slot';
                slot.innerHTML = `<div class="slot-icon" style="background-color: ${getSkillColor(skill.category)};"></div>`;
                slot.addEventListener('mouseenter', (e) => showTooltip(e, skill));
                slot.addEventListener('mouseleave', hideTooltip);
                slot.addEventListener('click', (e) => {
                    if (window.innerWidth <= 768) showTooltip(e, skill, true);
                });
                coreGrid.appendChild(slot);
            });
        }
    }
}

function getSkillColor(cat) {
    if (cat === 'AI/ML') return '#e8262d';
    if (cat === 'Data Engineering') return '#3a6dff';
    return '#3fa535';
}

function showTooltip(e, data, isMobile = false) {
    const tt = document.getElementById('dynamic-tooltip');
    document.getElementById('tt-name').textContent = data.name;
    document.getElementById('tt-name').className = getRarityClass(data.rarity);
    
    if (data.category) {
        document.getElementById('tt-type').textContent = data.category;
    }
    
    document.getElementById('tt-desc').textContent = data.desc;
    
    tt.setAttribute('aria-hidden', 'false');
    
    if (!isMobile) {
        // Follow cursor
        const updatePos = (ev) => {
            let x = ev.clientX + 15;
            let y = ev.clientY + 15;
            if (x + tt.offsetWidth > window.innerWidth) x = ev.clientX - tt.offsetWidth - 5;
            if (y + tt.offsetHeight > window.innerHeight) y = ev.clientY - tt.offsetHeight - 5;
            tt.style.left = x + 'px';
            tt.style.top = y + 'px';
        };
        updatePos(e);
        e.target.addEventListener('mousemove', updatePos);
        e.target.addEventListener('mouseleave', () => {
            e.target.removeEventListener('mousemove', updatePos);
            hideTooltip();
        }, { once: true });
    } else {
        // Center on screen for mobile
        tt.style.left = '50%';
        tt.style.top = '50%';
        tt.style.transform = 'translate(-50%, -50%)';
        
        // click outside to close
        const closeHandler = (ev) => {
            if (!tt.contains(ev.target) && ev.target !== e.target) {
                hideTooltip();
                document.removeEventListener('click', closeHandler);
            }
        };
        setTimeout(() => document.addEventListener('click', closeHandler), 10);
    }
}

function hideTooltip() {
    const tt = document.getElementById('dynamic-tooltip');
    tt.setAttribute('aria-hidden', 'true');
    tt.style.transform = 'none'; // reset mobile transform
}

function renderProjects() {
    const cavePath = document.getElementById('cave-path');
    
    appData.projects.forEach(proj => {
        const chest = document.createElement('div');
        chest.className = 'chest-item';
        chest.innerHTML = `
            <div class="chest-sprite"></div>
            <div class="chest-title ${getRarityClass(proj.rarity)}">${proj.title}</div>
        `;
        
        chest.addEventListener('click', () => {
            playClickSound();
            openProjectModal(proj);
        });
        
        cavePath.appendChild(chest);
    });
}

function openProjectModal(proj) {
    const modal = document.getElementById('project-modal');
    document.getElementById('modal-title').textContent = proj.title;
    document.getElementById('modal-title').className = getRarityClass(proj.rarity);
    document.getElementById('modal-subtitle').textContent = proj.subtitle;
    document.getElementById('modal-desc').textContent = proj.description;
    
    const techContainer = document.getElementById('modal-tech');
    techContainer.innerHTML = '';
    proj.tech.forEach(t => {
        const span = document.createElement('span');
        span.className = 'tech-tag';
        span.textContent = t;
        techContainer.appendChild(span);
    });
    
    const githubBtn = document.getElementById('modal-github');
    githubBtn.href = `https://github.com/andikaprasetyaaa/${proj.repo}`;
    
    modal.setAttribute('aria-hidden', 'false');
}

function renderContact() {
    const linksContainer = document.getElementById('contact-links');
    const hireBtn = document.getElementById('hire-btn');
    
    const c = appData.contact;
    
    if (c.github && c.github !== 'REPLACE_ME') {
        linksContainer.innerHTML += `<a href="${c.github}" target="_blank" class="pixel-button">GitHub</a>`;
    }
    if (c.linkedin && c.linkedin !== 'REPLACE_ME') {
        linksContainer.innerHTML += `<a href="${c.linkedin}" target="_blank" class="pixel-button">LinkedIn</a>`;
    }
    
    if (c.email && c.email !== 'REPLACE_ME') {
        hireBtn.href = `mailto:${c.email}`;
    } else {
        hireBtn.style.display = 'none'; // Hide if placeholder
    }
}

function setupInteractions() {
    // Modal Close
    document.querySelector('.close-modal').addEventListener('click', () => {
        playClickSound();
        document.getElementById('project-modal').setAttribute('aria-hidden', 'true');
    });
    document.getElementById('project-modal').addEventListener('click', (e) => {
        if (e.target.id === 'project-modal') {
            document.getElementById('project-modal').setAttribute('aria-hidden', 'true');
        }
    });
    
    // Skill Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            playClickSound();
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            renderSkills(e.target.getAttribute('data-category'));
        });
    });
    
    // Hotbar Navigation
    const hotbarSlots = document.querySelectorAll('.hotbar .slot');
    hotbarSlots.forEach(slot => {
        slot.addEventListener('click', () => {
            playClickSound();
            const targetId = slot.getAttribute('data-target');
            document.getElementById(targetId).scrollIntoView({ behavior: 'smooth' });
        });
    });
    
    // Keybinds (1-5)
    document.addEventListener('keydown', (e) => {
        if (e.key >= '1' && e.key <= '5') {
            const index = parseInt(e.key) - 1;
            if (hotbarSlots[index]) {
                hotbarSlots[index].click();
            }
        }
    });

    // Scroll Depth Meter & Hotbar active state
    const sections = ['section-hero', 'section-about', 'section-skills', 'section-projects', 'section-contact'];
    const depths = ['Surface', 'Surface', 'Underground', 'Caverns', 'Underworld'];
    const depthMeter = document.querySelector('.depth-meter');
    
    window.addEventListener('scroll', () => {
        let current = '';
        let currentIdx = 0;
        
        for (let i = 0; i < sections.length; i++) {
            const el = document.getElementById(sections[i]);
            const rect = el.getBoundingClientRect();
            if (rect.top <= window.innerHeight / 2) {
                current = sections[i];
                currentIdx = i;
            }
        }
        
        hotbarSlots.forEach(s => s.classList.remove('active'));
        const activeSlot = document.querySelector(`.hotbar .slot[data-target="${current}"]`);
        if (activeSlot) activeSlot.classList.add('active');
        
        depthMeter.textContent = `Depth: ${depths[currentIdx]}`;
        
        // Achievement Observer fallback
        checkAchievements();
    });
    
    // Back to top
    document.getElementById('btn-back-to-top').addEventListener('click', () => {
        playClickSound();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    
    // HUD Toggles
    const toggleDayNight = document.getElementById('toggle-day-night');
    toggleDayNight.addEventListener('click', () => {
        playClickSound();
        const isNight = document.documentElement.getAttribute('data-theme') === 'night';
        document.documentElement.setAttribute('data-theme', isNight ? 'light' : 'night');
    });

    const toggleMusicBtn = document.getElementById('toggle-music');
    toggleMusicBtn.addEventListener('click', () => {
        unlockAudio();
        const isPlaying = toggleMusicBtn.textContent === '🔊';
        toggleMusic(!isPlaying);
        toggleMusicBtn.textContent = !isPlaying ? '🔊' : '🔇';
    });

    const volSlider = document.getElementById('volume-slider');
    volSlider.addEventListener('input', (e) => {
        setVolume(parseFloat(e.target.value));
    });
    
    // Mobile menu
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const closeMenuBtn = document.querySelector('.close-menu');
    
    mobileBtn.addEventListener('click', () => {
        mobileMenu.setAttribute('aria-hidden', 'false');
    });
    closeMenuBtn.addEventListener('click', () => {
        mobileMenu.setAttribute('aria-hidden', 'true');
    });
    mobileMenu.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => {
            mobileMenu.setAttribute('aria-hidden', 'true');
        });
    });
}

const achievementShown = new Set();
function checkAchievements() {
    const aboutSection = document.getElementById('section-about');
    const rect = aboutSection.getBoundingClientRect();
    if (rect.top < window.innerHeight && !achievementShown.has('about')) {
        achievementShown.add('about');
        showToast("Achievement Unlocked: Guide's House Found!");
    }
}

function showToast(message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);
    
    // optional ding
    playClickSound();
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.5s';
        setTimeout(() => toast.remove(), 500);
    }, 4000);
}
