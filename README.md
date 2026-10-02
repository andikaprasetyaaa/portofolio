# Zoro's World

A single-page personal portfolio website built to look and feel like a Terraria-themed adventure.

## Editing Content

All textual content, projects, and skills are stored in `data/content.json`. You can edit this file to update your portfolio without modifying any code. Make sure to keep the JSON syntax valid.

## Adding Music

By default, the site will play a procedurally generated chiptune loop using the Web Audio API. 
If you want to use a specific music track:
1. Obtain an mp3 file.
2. Place it at `assets/audio/theme.mp3`.
3. The site will automatically attempt to load and loop this file instead of the fallback synthesizer.

## Deployment

This site is a static HTML/CSS/JS project with no build step. 

To deploy to GitHub Pages:
1. Push this repository to GitHub.
2. Go to the repository **Settings** > **Pages**.
3. Select the `main` branch (or whichever branch you pushed to) as the source.
4. Save. GitHub Pages will build and deploy the site automatically.
5. Alternatively, you can use any static host like Netlify, Vercel, or simply serve it from any basic web server.

---
*Fan-made tribute. Terraria is a trademark of Re-Logic. Not affiliated or endorsed.*
