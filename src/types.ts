export interface HeroData {
  name: string;
  title: string;
  tagline: string;
  dialogue: string[];
  taglines: string[];
}

export interface AboutStat {
  label: string;
  value: string;
}

export interface Achievement {
  title: string;
  description: string;
}

export interface AboutData {
  stats: AboutStat[];
  text: string[];
  achievements: Achievement[];
}

export interface Skill {
  name: string;
  category: 'AI/ML' | 'Data Engineering' | 'Backend & DevOps' | string;
  desc: string;
  rarity: 'Cyan' | 'Light Purple' | 'Pink' | 'Light Red' | 'Orange' | 'Green' | 'Blue' | string;
  icon: string;
}

export interface Project {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  tech: string[];
  rarity: string;
  repo: string;
  flagship?: boolean;
}

export interface ContactData {
  github?: string;
  linkedin?: string;
  email?: string;
}

export interface PortfolioContent {
  hero: HeroData;
  about: AboutData;
  skills: Skill[];
  projects: Project[];
  contact: ContactData;
}

export type BiomeType = 'surface' | 'underground' | 'caverns' | 'underworld';

export interface Particle {
  type: 'leaf' | 'butterfly' | 'slime' | 'bat' | 'dust' | 'ember' | 'sparkle' | 'bubble';
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  color?: string;
  size?: number;
  frame?: number;
  jumpTimer?: number;
}
