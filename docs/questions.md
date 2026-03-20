# Clarifying Questions

## Answered (from design description)

These are resolved — captured in the other docs:

- **Name/title:** Tyler Hawthorn, AKA Calcite, Full Stack Developer & Game Enthusiast
- **Color palette:** Deep navy `#0B0F1A` + cyan→blue→purple gradient + pink + gold for Calcite branding
- **Interactive effects:** Star field, cyber mountains with parallax, floating UFO, pixel rocket, neon glow cards, scroll reveals, pixel-art avatar
- **Dark/light mode:** Dark-first (light mode as optional future enhancement)
- **Nav links:** About, Projects, Skills, Contact
- **Social links:** GitHub, Twitter/X, LinkedIn

---

## Still Open

Answer these when you're ready — we can iterate.

### Content

1. **How many projects do you want to showcase initially?**
   Do you have screenshots/thumbnails ready, or should we plan for placeholder visuals?

add placeholder visuals for development and layout, make sure they are easy to swap out with real project images later.

2. **What are your key skill categories?**
   e.g., Frontend (Angular, React, TS), Backend (Node, Python, Java), DevOps, Databases, etc.

heres just a full list:
Languages: typescript, javascript, java
Frontend development: angular, react, RxJS, SCSS
Backend development: node.js, express.js, rest apis, websockets, authentication
Databases: PostgreSQL
DevOps: Docker, CI/CD pipelines, cloud deployment (Render, AWS)
Testing and quality: TDD, unit testing, integration testing
Git and version control: Git, GitHub, branching strategies, code reviews
Architectures and concepts: full-stack development, RESTful APIs, client-server architecture, responsive design


3. **Do you want a timeline/experience section on the About page?**
   (Education, jobs, milestones — or just bio + skills?)
just bio + skills for now, we can add a timeline later

4. **Do you have pixel-art assets already, or do we need to source/create them?**
   (Avatar, UFO, rocket, card icons — these could be hand-made, commissioned, or from a pixel-art asset pack.)
Currently do not have- I will make these, but for development we can use placeholders and i will create the art in parallel to swap in when ready.

### Functionality

5. **Contact method: form or just links?**
   - Formspree / EmailJS (no backend needed)
   - Just display email + social links (no form)
Just display email + social links for now

6. **Downloadable resume (PDF link)?**
Not required for now

7. **Blog section — now or later?**
   Not required, but if you want one eventually we can plan the route now.
Not required for now

8. **Third-party integrations?**
   - GitHub API (auto-fetch repos, stars, etc.)
   - Analytics (Google Analytics, Plausible, etc.)
Not required for now

### Deployment

9. **Render deployment preference?**
   - **Static site** (pre-rendered at build time — simpler, free tier friendly)
   - **Node SSR service** (server-side rendering on each request — better SEO, more complex)
static site

10. **Custom domain?**
    Do you have a domain name, or will you use `*.onrender.com` for now?
custom domain is registered: calcitedev.me

### Optional Enhancements (from your description)

11. **Interactive pixel Easter eggs** — any specific ideas? (e.g., Konami code, clickable sprites)
- Lots of hover interactivity (eg ufo spins when hovered, stars nearby cursor pulse, cards glow and tilt with mouse movement)
- movable stars, text, and icons with gravity and collision physics after touched
- arrow keys make the rocket controllable with physics
- peelable corner to reveal "professional" version of the site underneath

12. **Sound effects** — your description mentioned "very subtle, optional." Do you want to include these, or skip for v1?
- subtle sound effects for easter egg interactions

---

Reply with answers and we'll lock in the final plan and start scaffolding.
