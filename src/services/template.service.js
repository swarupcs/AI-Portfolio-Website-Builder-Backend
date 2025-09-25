import { themeService } from './theme.service.js';

// Main template generation function
export const generateTemplateService = async (templateData) => {
  const { content, projects, structure, theme } = templateData;

  try {
    console.log('📄 Generating HTML/CSS/JS templates...');

    // Generate HTML structure
    const html = generateHTML(content, projects, structure);

    // Generate CSS styles
    const css = generateCSS(theme, structure);

    // Generate JavaScript functionality
    const javascript = generateJavaScript(structure, projects);

    console.log('✅ Templates generated successfully');

    return {
      html,
      css,
      javascript,
    };
  } catch (error) {
    console.error('Template generation failed:', error);
    throw error;
  }
};

// Generate HTML structure
const generateHTML = (content, projects, structure) => {
  const sections = [];

  // Generate each section based on structure
  structure.sections.forEach((sectionType) => {
    switch (sectionType) {
      case 'hero':
        sections.push(generateHeroSection(content.hero, structure));
        break;
      case 'about':
        sections.push(generateAboutSection(content.about, structure));
        break;
      case 'skills':
        sections.push(generateSkillsSection(content, structure));
        break;
      case 'projects':
        sections.push(generateProjectsSection(projects, structure));
        break;
      case 'experience':
        sections.push(generateExperienceSection(content, structure));
        break;
      case 'services':
        sections.push(generateServicesSection(content.services, structure));
        break;
      case 'contact':
        sections.push(generateContactSection(content.contact, structure));
        break;
    }
  });

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Portfolio</title>
      <meta name="description" content="Professional portfolio showcasing skills and projects">
    </head>
    <body>
      ${generateNavigation(structure)}
      
      <main class="main-content">
        ${sections.join('\n        ')}
      </main>
      
      ${generateFooter()}
    </body>
    </html>
  `.trim();
};

// Generate navigation
const generateNavigation = (structure) => {
  if (structure.navigation === 'side-menu') {
    return `
      <nav class="side-nav">
        <div class="nav-brand">
          <a href="#hero" class="brand-link">Portfolio</a>
        </div>
        <ul class="nav-menu">
          ${structure.sections
            .map(
              (section) =>
                `<li><a href="#${section}" class="nav-link">${capitalizeFirst(
                  section
                )}</a></li>`
            )
            .join('\n          ')}
        </ul>
      </nav>
    `;
  }

  // Default: fixed-header or top-menu
  return `
    <header class="header ${
      structure.navigation === 'fixed-header' ? 'fixed-header' : ''
    }">
      <nav class="nav-container">
        <div class="nav-brand">
          <a href="#hero" class="brand-link">Portfolio</a>
        </div>
        <ul class="nav-menu">
          ${structure.sections
            .map(
              (section) =>
                `<li><a href="#${section}" class="nav-link">${capitalizeFirst(
                  section
                )}</a></li>`
            )
            .join('\n          ')}
        </ul>
        <button class="mobile-toggle" aria-label="Toggle navigation">
          <span></span>
          <span></span>
          <span></span>
        </button>
      </nav>
    </header>
  `;
};

// Generate hero section
const generateHeroSection = (heroContent, structure) => {
  return `
    <section id="hero" class="hero-section">
      <div class="container">
        <div class="hero-content">
          <h1 class="hero-headline fade-in">${heroContent.headline}</h1>
          <p class="hero-subheading fade-in">${heroContent.subheading}</p>
          <div class="hero-actions fade-in">
            <a href="#projects" class="btn btn-primary">${heroContent.cta}</a>
            <a href="#contact" class="btn btn-outline">Get in Touch</a>
          </div>
        </div>
        ${structure.type === 'developer' ? generateCodeBackground() : ''}
        ${structure.type === 'designer' ? generateDesignElements() : ''}
      </div>
    </section>
  `;
};

// Generate about section
const generateAboutSection = (aboutContent, structure) => {
  return `
    <section id="about" class="about-section">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">About Me</h2>
        </div>
        <div class="about-grid">
          <div class="about-content">
            <p class="about-intro">${aboutContent.introduction}</p>
            <div class="about-highlights">
              <h3>Key Highlights</h3>
              <ul class="highlights-list">
                ${aboutContent.highlights
                  .map(
                    (highlight) =>
                      `<li class="highlight-item">${highlight}</li>`
                  )
                  .join('\n                ')}
              </ul>
            </div>
          </div>
          <div class="about-visual">
            <div class="profile-card">
              <div class="profile-image-placeholder">
                <span class="profile-icon">👨‍💼</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
};

// Generate skills section
const generateSkillsSection = (content, structure) => {
  // This would be populated from resume data in real implementation
  const skillCategories = [
    {
      category: 'Technical Skills',
      skills: ['JavaScript', 'React', 'Node.js', 'Python', 'SQL'],
    },
    {
      category: 'Tools & Platforms',
      skills: ['Git', 'Docker', 'AWS', 'MongoDB', 'PostgreSQL'],
    },
  ];

  return `
    <section id="skills" class="skills-section">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">Skills & Expertise</h2>
        </div>
        <div class="skills-grid">
          ${skillCategories
            .map(
              (category) => `
            <div class="skill-category">
              <h3 class="category-title">${category.category}</h3>
              <div class="skills-list">
                ${category.skills
                  .map(
                    (skill) => `
                  <span class="skill-tag">${skill}</span>
                `
                  )
                  .join('')}
              </div>
            </div>
          `
            )
            .join('\n          ')}
        </div>
      </div>
    </section>
  `;
};

// Generate experience section
const generateExperienceSection = (content, structure) => {
  const experiences = content.experience || [];

  return `
    <section id="experience" class="experience-section">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">Experience</h2>
          <p class="section-subtitle">My professional journey</p>
        </div>
        <div class="timeline">
          ${experiences
            .map(
              (exp, index) => `
            <div class="timeline-item" data-index="${index}">
              <div class="timeline-marker"></div>
              <div class="timeline-content">
                <div class="timeline-header">
                  <h3 class="position-title">${exp.position || 'Position'}</h3>
                  <span class="company-name">${exp.company || 'Company'}</span>
                  <span class="duration">${exp.duration || 'Duration'}</span>
                </div>
                <p class="experience-description">${
                  exp.description || 'Experience description'
                }</p>
                ${
                  exp.achievements?.length
                    ? `
                  <ul class="achievements-list">
                    ${exp.achievements
                      .map(
                        (achievement) =>
                          `<li class="achievement-item">${achievement}</li>`
                      )
                      .join('\n                    ')}
                  </ul>
                `
                    : ''
                }
              </div>
            </div>
          `
            )
            .join('\n          ')}
        </div>
      </div>
    </section>
  `;
};

// Generate projects section
const generateProjectsSection = (projects, structure) => {
  return `
    <section id="projects" class="projects-section">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">Featured Projects</h2>
          <p class="section-subtitle">A selection of my recent work</p>
        </div>
        <div class="projects-grid">
          ${projects
            .map((project, index) =>
              generateProjectCard(project, index, structure)
            )
            .join('\n          ')}
        </div>
      </div>
    </section>
  `;
};

// Generate individual project card
const generateProjectCard = (project, index, structure) => {
  return `
    <article class="project-card" data-project="${index}">
      <div class="project-image">
        <img src="${
          project.images?.hero || 'https://via.placeholder.com/400x250'
        }" 
             alt="${project.name}" 
             loading="lazy">
        <div class="project-overlay">
          <div class="project-links">
            ${
              project.url
                ? `<a href="${project.url}" class="project-link" target="_blank" rel="noopener">
              <span class="link-icon">🔗</span> Live Demo
            </a>`
                : ''
            }
            ${
              project.github
                ? `<a href="${project.github}" class="project-link" target="_blank" rel="noopener">
              <span class="link-icon">📁</span> GitHub
            </a>`
                : ''
            }
          </div>
        </div>
      </div>
      <div class="project-content">
        <h3 class="project-title">${project.name}</h3>
        <p class="project-tagline">${project.tagline}</p>
        <p class="project-description">${project.description}</p>
        
        ${
          project.technologies?.length
            ? `
          <div class="project-tech">
            ${project.technologies
              .map((tech) => `<span class="tech-tag">${tech}</span>`)
              .join('')}
          </div>
        `
            : ''
        }
        
        ${
          project.metrics?.length
            ? `
          <div class="project-metrics">
            ${project.metrics
              .map((metric) => `<div class="metric">${metric}</div>`)
              .join('')}
          </div>
        `
            : ''
        }
      </div>
    </article>
  `;
};

// Generate services section
const generateServicesSection = (services, structure) => {
  return `
    <section id="services" class="services-section">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">Services</h2>
          <p class="section-subtitle">How I can help you succeed</p>
        </div>
        <div class="services-grid">
          ${services
            .map(
              (service) => `
            <div class="service-card">
              <div class="service-icon">
                <span class="icon">${getServiceIcon(service.icon)}</span>
              </div>
              <h3 class="service-title">${service.title}</h3>
              <p class="service-description">${service.description}</p>
            </div>
          `
            )
            .join('\n          ')}
        </div>
      </div>
    </section>
  `;
};

// Generate contact section
const generateContactSection = (contactContent, structure) => {
  return `
    <section id="contact" class="contact-section">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">${contactContent.cta}</h2>
          <p class="section-subtitle">${contactContent.description}</p>
        </div>
        <div class="contact-content">
          <div class="contact-info">
            <div class="contact-methods">
              <div class="contact-method">
                <span class="contact-icon">📧</span>
                <div class="contact-details">
                  <h4>Email</h4>
                  <a href="mailto:hello@example.com">hello@example.com</a>
                </div>
              </div>
              <div class="contact-method">
                <span class="contact-icon">💼</span>
                <div class="contact-details">
                  <h4>LinkedIn</h4>
                  <a href="#" target="_blank">Connect with me</a>
                </div>
              </div>
            </div>
          </div>
          <div class="contact-form">
            <form class="form" id="contact-form">
              <div class="form-group">
                <label for="name">Name</label>
                <input type="text" id="name" name="name" required>
              </div>
              <div class="form-group">
                <label for="email">Email</label>
                <input type="email" id="email" name="email" required>
              </div>
              <div class="form-group">
                <label for="message">Message</label>
                <textarea id="message" name="message" rows="5" required></textarea>
              </div>
              <button type="submit" class="btn btn-primary">Send Message</button>
            </form>
          </div>
        </div>
      </div>
    </section>
  `;
};

// Generate footer
const generateFooter = () => {
  return `
    <footer class="footer">
      <div class="container">
        <div class="footer-content">
          <p>&copy; ${new Date().getFullYear()} Portfolio. All rights reserved.</p>
          <div class="footer-links">
            <a href="#" class="footer-link">Privacy</a>
            <a href="#" class="footer-link">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  `;
};

// Generate CSS styles
const generateCSS = (theme, structure) => {
  const themeCSS = themeService.generateThemeCSS(theme);

  const layoutCSS = `
    /* Reset and base styles */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    html {
      scroll-behavior: smooth;
    }

    body {
      font-family: var(--font-primary);
      color: var(--color-text);
      background-color: var(--color-background);
      line-height: 1.6;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 2rem;
    }

    /* Navigation Styles */
    .header {
      background: var(--color-background);
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      z-index: 1000;
    }

    .header.fixed-header {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
    }

    .nav-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 2rem;
    }

    .nav-brand .brand-link {
      font-size: 1.5rem;
      font-weight: bold;
      text-decoration: none;
      color: var(--color-primary);
    }

    .nav-menu {
      display: flex;
      list-style: none;
      gap: 2rem;
    }

    .nav-link {
      text-decoration: none;
      color: var(--color-text);
      font-weight: 500;
      transition: color 0.3s ease;
    }

    .nav-link:hover {
      color: var(--color-primary);
    }

    .mobile-toggle {
      display: none;
      flex-direction: column;
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.5rem;
    }

    .mobile-toggle span {
      width: 25px;
      height: 3px;
      background: var(--color-text);
      margin: 3px 0;
      transition: 0.3s;
    }

    /* Side Navigation */
    .side-nav {
      position: fixed;
      top: 0;
      left: 0;
      width: 250px;
      height: 100vh;
      background: var(--color-background);
      box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      padding: 2rem 1rem;
    }

    .side-nav .nav-menu {
      flex-direction: column;
      gap: 1rem;
      margin-top: 2rem;
    }

    /* Main Content */
    .main-content {
      margin-left: ${structure.navigation === 'side-menu' ? '250px' : '0'};
      padding-top: ${structure.navigation === 'fixed-header' ? '80px' : '0'};
    }

    /* Section Styles */
    section {
      padding: 5rem 0;
    }

    .section-header {
      text-align: center;
      margin-bottom: 3rem;
    }

    .section-title {
      font-size: 2.5rem;
      margin-bottom: 1rem;
      color: var(--color-text);
    }

    .section-subtitle {
      font-size: 1.2rem;
      color: var(--color-text-light);
      max-width: 600px;
      margin: 0 auto;
    }

    /* Hero Section */
    .hero-section {
      min-height: 100vh;
      display: flex;
      align-items: center;
      position: relative;
      overflow: hidden;
    }

    .hero-content {
      text-align: center;
      max-width: 800px;
      margin: 0 auto;
    }

    .hero-headline {
      font-size: 3.5rem;
      font-weight: bold;
      margin-bottom: 1rem;
      color: var(--color-text);
    }

    .hero-subheading {
      font-size: 1.5rem;
      margin-bottom: 2rem;
      color: var(--color-text-light);
    }

    .hero-actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }

    /* Button Styles */
    .btn {
      display: inline-block;
      padding: 12px 30px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 600;
      transition: all 0.3s ease;
      border: 2px solid transparent;
      cursor: pointer;
      font-size: 1rem;
    }

    .btn-primary {
      background: var(--color-primary);
      color: white;
    }

    .btn-primary:hover {
      background: var(--color-primary-dark);
      transform: translateY(-2px);
    }

    .btn-outline {
      border: 2px solid var(--color-primary);
      color: var(--color-primary);
      background: transparent;
    }

    .btn-outline:hover {
      background: var(--color-primary);
      color: white;
    }

    /* About Section */
    .about-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 4rem;
      align-items: center;
    }

    .about-intro {
      font-size: 1.2rem;
      margin-bottom: 2rem;
      line-height: 1.8;
    }

    .about-highlights h3 {
      margin-bottom: 1rem;
      color: var(--color-text);
    }

    .highlights-list {
      list-style: none;
    }

    .highlight-item {
      padding: 0.5rem 0;
      border-left: 3px solid var(--color-primary);
      padding-left: 1rem;
      margin-bottom: 0.5rem;
    }

    .profile-card {
      background: var(--color-surface);
      border-radius: 12px;
      padding: 2rem;
      text-align: center;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    }

    .profile-image-placeholder {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      background: var(--color-primary);
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 3rem;
    }

    /* Skills Section */
    .skills-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
    }

    .skill-category {
      background: var(--color-surface);
      border-radius: 12px;
      padding: 2rem;
    }

    .category-title {
      margin-bottom: 1.5rem;
      color: var(--color-text);
    }

    .skills-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .skill-tag {
      background: var(--color-primary);
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-size: 0.9rem;
      font-weight: 500;
    }

    /* Experience Section */
    .timeline {
      position: relative;
      max-width: 800px;
      margin: 0 auto;
    }

    .timeline::before {
      content: '';
      position: absolute;
      left: 50%;
      top: 0;
      bottom: 0;
      width: 2px;
      background: var(--color-primary);
      transform: translateX(-50%);
    }

    .timeline-item {
      position: relative;
      margin-bottom: 3rem;
      display: flex;
      align-items: center;
    }

    .timeline-item:nth-child(odd) .timeline-content {
      margin-right: 2rem;
      text-align: right;
    }

    .timeline-item:nth-child(even) .timeline-content {
      margin-left: 2rem;
    }

    .timeline-marker {
      position: absolute;
      left: 50%;
      width: 20px;
      height: 20px;
      background: var(--color-primary);
      border-radius: 50%;
      transform: translateX(-50%);
      z-index: 1;
    }

    .timeline-content {
      flex: 1;
      background: var(--color-surface);
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    }

    .timeline-header {
      margin-bottom: 1rem;
    }

    .position-title {
      font-size: 1.3rem;
      color: var(--color-text);
      margin-bottom: 0.5rem;
    }

    .company-name {
      color: var(--color-primary);
      font-weight: 600;
    }

    .duration {
      color: var(--color-text-light);
      font-size: 0.9rem;
    }

    /* Projects Section */
    .projects-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 2rem;
    }

    .project-card {
      background: var(--color-surface);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
      transition: transform 0.3s ease;
    }

    .project-card:hover {
      transform: translateY(-5px);
    }

    .project-image {
      position: relative;
      overflow: hidden;
      height: 200px;
    }

    .project-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }

    .project-card:hover .project-image img {
      transform: scale(1.05);
    }

    .project-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .project-card:hover .project-overlay {
      opacity: 1;
    }

    .project-links {
      display: flex;
      gap: 1rem;
    }

    .project-link {
      color: white;
      text-decoration: none;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      background: var(--color-primary);
      transition: background 0.3s ease;
    }

    .project-link:hover {
      background: var(--color-primary-dark);
    }

    .project-content {
      padding: 2rem;
    }

    .project-title {
      font-size: 1.3rem;
      margin-bottom: 0.5rem;
      color: var(--color-text);
    }

    .project-tagline {
      color: var(--color-primary);
      font-weight: 600;
      margin-bottom: 1rem;
    }

    .project-description {
      color: var(--color-text-light);
      line-height: 1.6;
      margin-bottom: 1rem;
    }

    .project-tech {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .tech-tag {
      background: var(--color-background);
      color: var(--color-text);
      padding: 0.25rem 0.75rem;
      border-radius: 15px;
      font-size: 0.85rem;
      border: 1px solid var(--color-border);
    }

    /* Services Section */
    .services-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
    }

    .service-card {
      background: var(--color-surface);
      border-radius: 12px;
      padding: 2rem;
      text-align: center;
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
      transition: transform 0.3s ease;
    }

    .service-card:hover {
      transform: translateY(-5px);
    }

    .service-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
      display: block;
    }

    .service-title {
      margin-bottom: 1rem;
      color: var(--color-text);
    }

    /* Contact Section */
    .contact-content {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4rem;
      max-width: 1000px;
      margin: 0 auto;
    }

    .contact-methods {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .contact-method {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .contact-icon {
      font-size: 2rem;
      width: 60px;
      height: 60px;
      background: var(--color-primary);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .contact-details h4 {
      margin-bottom: 0.5rem;
      color: var(--color-text);
    }

    .contact-details a {
      color: var(--color-primary);
      text-decoration: none;
    }

    /* Form Styles */
    .form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
    }

    .form-group label {
      margin-bottom: 0.5rem;
      font-weight: 600;
      color: var(--color-text);
    }

    .form-group input,
    .form-group textarea {
      padding: 12px;
      border: 2px solid var(--color-border);
      border-radius: 6px;
      font-family: inherit;
      font-size: 1rem;
      transition: border-color 0.3s ease;
    }

    .form-group input:focus,
    .form-group textarea:focus {
      outline: none;
      border-color: var(--color-primary);
    }

    /* Footer */
    .footer {
      background: var(--color-surface);
      padding: 2rem 0;
      text-align: center;
      border-top: 1px solid var(--color-border);
    }

    .footer-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .footer-links {
      display: flex;
      gap: 2rem;
    }

    .footer-link {
      color: var(--color-text-light);
      text-decoration: none;
    }

    .footer-link:hover {
      color: var(--color-primary);
    }

    /* Animation Classes */
    .fade-in {
      opacity: 0;
      animation: fadeInUp 1s ease forwards;
    }

    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .container {
        padding: 0 1rem;
      }

      .nav-menu {
        display: none;
      }

      .mobile-toggle {
        display: flex;
      }

      .hero-headline {
        font-size: 2.5rem;
      }

      .hero-subheading {
        font-size: 1.2rem;
      }

      .hero-actions {
        flex-direction: column;
        align-items: center;
      }

      .about-grid {
        grid-template-columns: 1fr;
        text-align: center;
      }

      .contact-content {
        grid-template-columns: 1fr;
      }

      .timeline::before {
        left: 20px;
      }

      .timeline-item {
        flex-direction: column;
        align-items: flex-start;
      }

      .timeline-marker {
        left: 20px;
        transform: translateX(-50%);
      }

      .timeline-content {
        margin-left: 50px !important;
        margin-right: 0 !important;
        text-align: left !important;
      }

      .side-nav {
        transform: translateX(-100%);
        transition: transform 0.3s ease;
      }

      .side-nav.open {
        transform: translateX(0);
      }

      .main-content {
        margin-left: 0;
      }

      .footer-content {
        flex-direction: column;
        gap: 1rem;
      }
    }
  `;

  return `${themeCSS}\n${layoutCSS}`;
};

// Generate JavaScript functionality
const generateJavaScript = (structure, projects) => {
  return `
    // Portfolio JavaScript Functionality
    document.addEventListener('DOMContentLoaded', function() {
      console.log('🚀 Portfolio loaded successfully');
      
      // Initialize all functionality
      initNavigation();
      initScrollAnimations();
      initContactForm();
      initProjectFilters();
      initThemeToggle();
      
      ${structure.navigation === 'side-menu' ? 'initSideNavigation();' : ''}
    });

    // Navigation functionality
    function initNavigation() {
      const mobileToggle = document.querySelector('.mobile-toggle');
      const navMenu = document.querySelector('.nav-menu');
      
      if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', function() {
          navMenu.classList.toggle('open');
          this.classList.toggle('active');
        });
      }

      // Smooth scrolling for anchor links
      document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
          e.preventDefault();
          const target = document.querySelector(this.getAttribute('href'));
          if (target) {
            target.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
          }
        });
      });

      // Active navigation highlighting
      window.addEventListener('scroll', updateActiveNavigation);
    }

    // Side navigation functionality
    function initSideNavigation() {
      const sideNav = document.querySelector('.side-nav');
      const overlay = document.createElement('div');
      overlay.className = 'nav-overlay';
      document.body.appendChild(overlay);

      // Toggle side navigation on mobile
      const mobileToggle = document.querySelector('.mobile-toggle');
      if (mobileToggle) {
        mobileToggle.addEventListener('click', function() {
          sideNav.classList.toggle('open');
          overlay.classList.toggle('active');
        });
      }

      // Close on overlay click
      overlay.addEventListener('click', function() {
        sideNav.classList.remove('open');
        overlay.classList.remove('active');
      });
    }

    // Update active navigation item based on scroll position
    function updateActiveNavigation() {
      const sections = document.querySelectorAll('section[id]');
      const navLinks = document.querySelectorAll('.nav-link');
      
      let current = '';
      const scrollPosition = window.pageYOffset + 100;

      sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        
        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
          current = section.getAttribute('id');
        }
      });

      navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#' + current) {
          link.classList.add('active');
        }
      });
    }

    // Scroll animations
    function initScrollAnimations() {
      const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      };

      const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
            
            // Animate timeline items with delay
            if (entry.target.classList.contains('timeline-item')) {
              const index = parseInt(entry.target.dataset.index) || 0;
              entry.target.style.animationDelay = \`\${index * 0.2}s\`;
            }
            
            // Animate project cards with stagger
            if (entry.target.classList.contains('project-card')) {
              const index = parseInt(entry.target.dataset.project) || 0;
              entry.target.style.animationDelay = \`\${index * 0.1}s\`;
            }
          }
        });
      }, observerOptions);

      // Observe elements for animation
      const animateElements = document.querySelectorAll(
        '.section-header, .project-card, .timeline-item, .service-card, .skill-category'
      );
      
      animateElements.forEach(el => observer.observe(el));

      // Parallax effect for hero background
      window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const parallaxElements = document.querySelectorAll('.parallax-bg');
        
        parallaxElements.forEach(el => {
          const speed = 0.5;
          el.style.transform = \`translateY(\${scrolled * speed}px)\`;
        });
      });
    }

    // Contact form functionality
    function initContactForm() {
      const contactForm = document.getElementById('contact-form');
      
      if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
          e.preventDefault();
          
          // Get form data
          const formData = new FormData(this);
          const name = formData.get('name');
          const email = formData.get('email');
          const message = formData.get('message');
          
          // Validate form
          if (!name || !email || !message) {
            showNotification('Please fill in all fields', 'error');
            return;
          }
          
          if (!isValidEmail(email)) {
            showNotification('Please enter a valid email address', 'error');
            return;
          }
          
          // Simulate form submission
          const submitBtn = this.querySelector('button[type="submit"]');
          const originalText = submitBtn.textContent;
          
          submitBtn.textContent = 'Sending...';
          submitBtn.disabled = true;
          
          // Simulate API call
          setTimeout(() => {
            showNotification('Thank you! Your message has been sent.', 'success');
            this.reset();
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
          }, 2000);
        });
      }
    }

    // Project filtering functionality
    function initProjectFilters() {
      // This would be expanded based on project categories
      const projectCards = document.querySelectorAll('.project-card');
      
      // Add hover effects and interactions
      projectCards.forEach(card => {
        const overlay = card.querySelector('.project-overlay');
        const image = card.querySelector('.project-image img');
        
        card.addEventListener('mouseenter', function() {
          this.style.transform = 'translateY(-10px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
          this.style.transform = 'translateY(0) scale(1)';
        });
      });
    }

    // Theme toggle functionality
    function initThemeToggle() {
      // Create theme toggle button
      const themeToggle = document.createElement('button');
      themeToggle.className = 'theme-toggle';
      themeToggle.innerHTML = '🌙';
      themeToggle.setAttribute('aria-label', 'Toggle dark mode');
      
      // Position the button
      themeToggle.style.cssText = \`
        position: fixed;
        top: 20px;
        right: 20px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        border: none;
        background: var(--color-primary);
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
        z-index: 1001;
        transition: all 0.3s ease;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      \`;
      
      document.body.appendChild(themeToggle);
      
      // Load saved theme
      const savedTheme = localStorage.getItem('portfolio-theme') || 'light';
      document.documentElement.setAttribute('data-theme', savedTheme);
      updateThemeToggle(themeToggle, savedTheme);
      
      // Toggle theme on click
      themeToggle.addEventListener('click', function() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('portfolio-theme', newTheme);
        updateThemeToggle(this, newTheme);
        
        // Add transition effect
        document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
        setTimeout(() => {
          document.body.style.transition = '';
        }, 300);
      });
    }

    // Helper function to update theme toggle button
    function updateThemeToggle(button, theme) {
      button.innerHTML = theme === 'dark' ? '☀️' : '🌙';
      button.setAttribute('aria-label', 
        theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
      );
    }

    // Utility functions
    function isValidEmail(email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    }

    function showNotification(message, type = 'info') {
      // Remove existing notifications
      const existingNotification = document.querySelector('.notification');
      if (existingNotification) {
        existingNotification.remove();
      }
      
      // Create notification
      const notification = document.createElement('div');
      notification.className = \`notification notification-\${type}\`;
      notification.textContent = message;
      
      // Style the notification
      notification.style.cssText = \`
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 2000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      \`;
      
      // Set background color based on type
      const colors = {
        success: '#10b981',
        error: '#ef4444',
        info: '#3b82f6'
      };
      notification.style.backgroundColor = colors[type] || colors.info;
      
      document.body.appendChild(notification);
      
      // Animate in
      setTimeout(() => {
        notification.style.transform = 'translateX(0)';
      }, 100);
      
      // Auto remove after 5 seconds
      setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.remove();
          }
        }, 300);
      }, 5000);
    }

    // Lazy loading for images
    function initLazyLoading() {
      const images = document.querySelectorAll('img[loading="lazy"]');
      
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.classList.add('loaded');
            imageObserver.unobserve(img);
          }
        });
      });
      
      images.forEach(img => imageObserver.observe(img));
    }

    // Performance monitoring
    window.addEventListener('load', function() {
      // Log performance metrics
      if ('performance' in window) {
        const perfData = performance.timing;
        const loadTime = perfData.loadEventEnd - perfData.navigationStart;
        console.log(\`⚡ Page loaded in \${loadTime}ms\`);
      }
      
      // Initialize lazy loading after page load
      initLazyLoading();
    });

    // Error handling
    window.addEventListener('error', function(e) {
      console.error('Portfolio error:', e.error);
      showNotification('Something went wrong. Please refresh the page.', 'error');
    });

    // Export for module usage
    if (typeof module !== 'undefined' && module.exports) {
      module.exports = {
        initNavigation,
        initScrollAnimations,
        initContactForm,
        showNotification
      };
    }
  `;
};

// Helper functions
const capitalizeFirst = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const generateCodeBackground = () => {
  return `
    <div class="code-background">
      <div class="code-lines">
        <span class="code-line">const developer = { skills: ['JavaScript', 'React', 'Node.js'] };</span>
        <span class="code-line">function createAmazingThings() {</span>
        <span class="code-line">  return innovation + creativity;</span>
        <span class="code-line">}</span>
      </div>
    </div>
  `;
};

const generateDesignElements = () => {
  return `
    <div class="design-elements">
      <div class="floating-shape shape-1"></div>
      <div class="floating-shape shape-2"></div>
      <div class="floating-shape shape-3"></div>
    </div>
  `;
};

const getServiceIcon = (iconName) => {
  const icons = {
    'web-development': '🌐',
    'mobile-development': '📱',
    'ui-design': '🎨',
    consulting: '💼',
    maintenance: '🔧',
    optimization: '⚡',
    default: '⭐',
  };

  return icons[iconName] || icons.default;
};
