// services/theme-template.service.js
import Groq from 'groq-sdk';
import { GROQ_API_KEY } from '../config/config.js';

const groq = new Groq({ apiKey: GROQ_API_KEY });

// 2.1 Theme Selection Engine
export const recommendVisualTheme = async (
  resumeData,
  structure,
  preferences = {}
) => {
  try {
    const { colorPreference, stylePreference, industry } = preferences;
    const roleType = structure.type || 'general';

    // Pre-defined theme templates based on role and preferences
    const themeOptions = {
      developer: {
        'dark-modern': {
          name: 'Dark Modern',
          description: 'Dark theme perfect for developers',
          colors: {
            primary: '#6366F1', // Indigo
            secondary: '#10B981', // Green
            accent: '#F59E0B', // Amber
            background: '#0F172A', // Dark slate
            surface: '#1E293B', // Slate
            text: '#F8FAFC', // Light slate
            textSecondary: '#94A3B8', // Slate gray
          },
          typography: {
            primary: '"Inter", "SF Pro Display", -apple-system, sans-serif',
            code: '"Fira Code", "SF Mono", Monaco, monospace',
          },
          layout: 'grid-modern',
          animations: 'subtle-tech',
        },
        'light-minimal': {
          name: 'Light Minimal',
          description: 'Clean, minimal light theme',
          colors: {
            primary: '#3B82F6',
            secondary: '#6366F1',
            accent: '#8B5CF6',
            background: '#FFFFFF',
            surface: '#F8FAFC',
            text: '#1E293B',
            textSecondary: '#64748B',
          },
          typography: {
            primary: '"Inter", -apple-system, sans-serif',
            code: '"Source Code Pro", monospace',
          },
          layout: 'minimal-clean',
          animations: 'smooth-minimal',
        },
      },
      designer: {
        'creative-vibrant': {
          name: 'Creative Vibrant',
          description: 'Colorful theme for creative professionals',
          colors: {
            primary: '#EC4899', // Pink
            secondary: '#8B5CF6', // Purple
            accent: '#06B6D4', // Cyan
            background: '#FEFEFE',
            surface: '#F9FAFB',
            text: '#111827',
            textSecondary: '#6B7280',
          },
          typography: {
            primary: '"Poppins", "SF Pro Display", sans-serif',
            accent: '"Playfair Display", serif',
          },
          layout: 'creative-grid',
          animations: 'playful-creative',
        },
      },
      business: {
        'corporate-blue': {
          name: 'Corporate Blue',
          description: 'Professional business theme',
          colors: {
            primary: '#1E40AF',
            secondary: '#3B82F6',
            accent: '#10B981',
            background: '#FFFFFF',
            surface: '#F8FAFC',
            text: '#1F2937',
            textSecondary: '#6B7280',
          },
          typography: {
            primary: '"Inter", "SF Pro Text", sans-serif',
            accent: '"Merriweather", serif',
          },
          layout: 'business-formal',
          animations: 'professional-smooth',
        },
      },
      general: {
        'neutral-modern': {
          name: 'Neutral Modern',
          description: 'Versatile modern theme',
          colors: {
            primary: '#4F46E5',
            secondary: '#7C3AED',
            accent: '#059669',
            background: '#FFFFFF',
            surface: '#F9FAFB',
            text: '#111827',
            textSecondary: '#6B7280',
          },
          typography: {
            primary: '"Inter", system-ui, sans-serif',
          },
          layout: 'balanced-modern',
          animations: 'gentle-modern',
        },
      },
    };

    // Get theme based on role type
    const roleThemes = themeOptions[roleType] || themeOptions.general;
    const defaultTheme = Object.keys(roleThemes)[0];
    const selectedTheme =
      colorPreference && roleThemes[colorPreference]
        ? roleThemes[colorPreference]
        : roleThemes[defaultTheme];

    return {
      selected: selectedTheme,
      alternatives: Object.values(roleThemes).filter(
        (theme) => theme.name !== selectedTheme.name
      ),
      customization: {
        canCustomize: true,
        options: ['colors', 'typography', 'layout', 'animations'],
      },
      metadata: {
        basedOn: roleType,
        generatedAt: new Date(),
      },
    };
  } catch (error) {
    console.error('Theme recommendation error:', error);
    throw new Error(`Failed to recommend visual theme: ${error.message}`);
  }
};

// 2.2 Template Generator
export const generateWebsiteTemplate = async (
  content,
  structure,
  theme,
  resumeData
) => {
  try {
    const template = {
      html: generateHTML(content, structure, resumeData),
      css: generateCSS(theme, structure),
      javascript: generateJavaScript(structure),
      metadata: {
        generatedAt: new Date(),
        theme: theme.name,
        structure: structure.type,
        sections: structure.sections,
      },
    };

    return template;
  } catch (error) {
    console.error('Template generation error:', error);
    throw new Error(`Failed to generate website template: ${error.message}`);
  }
};

// HTML Generator
const generateHTML = (content, structure, resumeData) => {
  const sections = structure.sections;
  let htmlSections = '';

  sections.forEach((sectionName) => {
    switch (sectionName) {
      case 'hero':
        htmlSections += generateHeroSection(
          content.hero,
          resumeData.personalInfo
        );
        break;
      case 'about':
        htmlSections += generateAboutSection(content.about);
        break;
      case 'skills':
        htmlSections += generateSkillsSection(resumeData.skills);
        break;
      case 'projects':
        htmlSections += generateProjectsSection(resumeData.projects);
        break;
      case 'experience':
        htmlSections += generateExperienceSection(resumeData.experience);
        break;
      case 'contact':
        htmlSections += generateContactSection(
          content.contact,
          resumeData.personalInfo
        );
        break;
      case 'education':
        htmlSections += generateEducationSection(resumeData.education);
        break;
    }
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${resumeData.personalInfo?.name || 'Portfolio'} - Portfolio</title>
    <meta name="description" content="${
      content.hero?.subheading || 'Professional Portfolio'
    }">
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <nav class="navbar">
        <div class="nav-brand">${
          resumeData.personalInfo?.name?.split(' ')[0] || 'Portfolio'
        }</div>
        <ul class="nav-menu">
            ${sections
              .map(
                (section) =>
                  `<li><a href="#${section}" class="nav-link">${
                    section.charAt(0).toUpperCase() + section.slice(1)
                  }</a></li>`
              )
              .join('')}
        </ul>
    </nav>

    <main>
        ${htmlSections}
    </main>

    <script src="script.js"></script>
</body>
</html>`;
};

// Section generators
const generateHeroSection = (hero, personalInfo) => {
  return `
    <section id="hero" class="hero-section">
        <div class="container">
            <div class="hero-content">
                <h1 class="hero-headline">${
                  hero?.headline ||
                  `Hi, I'm ${personalInfo?.name || 'Professional'}`
                }</h1>
                <p class="hero-subheading">${
                  hero?.subheading ||
                  'Passionate about creating exceptional digital experiences'
                }</p>
                <div class="hero-cta">
                    <a href="#contact" class="btn btn-primary">${
                      hero?.cta || 'Get In Touch'
                    }</a>
                    <a href="#projects" class="btn btn-secondary">View My Work</a>
                </div>
            </div>
        </div>
    </section>`;
};

const generateAboutSection = (about) => {
  return `
    <section id="about" class="about-section">
        <div class="container">
            <h2 class="section-title">About Me</h2>
            <div class="about-content">
                <div class="about-text">
                    <p>${
                      about?.introduction ||
                      'Passionate professional dedicated to creating exceptional digital experiences and solving complex problems through innovative solutions.'
                    }</p>
                </div>
                ${
                  about?.highlights
                    ? `
                <div class="about-highlights">
                    <h3>Key Highlights</h3>
                    <ul>
                        ${about.highlights
                          .map((highlight) => `<li>${highlight}</li>`)
                          .join('')}
                    </ul>
                </div>`
                    : ''
                }
            </div>
        </div>
    </section>`;
};

const generateSkillsSection = (skills) => {
  return `
    <section id="skills" class="skills-section">
        <div class="container">
            <h2 class="section-title">Skills & Expertise</h2>
            <div class="skills-grid">
                ${
                  skills?.technical?.length
                    ? `
                <div class="skill-category">
                    <h3>Technical Skills</h3>
                    <div class="skill-tags">
                        ${skills.technical
                          .map(
                            (skill) => `<span class="skill-tag">${skill}</span>`
                          )
                          .join('')}
                    </div>
                </div>`
                    : ''
                }
                ${
                  skills?.soft?.length
                    ? `
                <div class="skill-category">
                    <h3>Soft Skills</h3>
                    <div class="skill-tags">
                        ${skills.soft
                          .map(
                            (skill) =>
                              `<span class="skill-tag soft">${skill}</span>`
                          )
                          .join('')}
                    </div>
                </div>`
                    : ''
                }
            </div>
        </div>
    </section>`;
};

const generateProjectsSection = (projects) => {
  if (!projects?.length) return '';

  return `
    <section id="projects" class="projects-section">
        <div class="container">
            <h2 class="section-title">Featured Projects</h2>
            <div class="projects-grid">
                ${projects
                  .map(
                    (project) => `
                <div class="project-card">
                    <h3 class="project-title">${project.name}</h3>
                    <p class="project-description">${
                      project.description || 'Project description'
                    }</p>
                    ${
                      project.technologies?.length
                        ? `
                    <div class="project-tech">
                        ${project.technologies
                          .map(
                            (tech) => `<span class="tech-tag">${tech}</span>`
                          )
                          .join('')}
                    </div>`
                        : ''
                    }
                    <div class="project-links">
                        ${
                          project.url
                            ? `<a href="${project.url}" class="project-link" target="_blank">View Live</a>`
                            : ''
                        }
                        ${
                          project.github
                            ? `<a href="${project.github}" class="project-link" target="_blank">View Code</a>`
                            : ''
                        }
                    </div>
                </div>`
                  )
                  .join('')}
            </div>
        </div>
    </section>`;
};

const generateExperienceSection = (experience) => {
  if (!experience?.length) return '';

  return `
    <section id="experience" class="experience-section">
        <div class="container">
            <h2 class="section-title">Work Experience</h2>
            <div class="experience-timeline">
                ${experience
                  .map(
                    (exp) => `
                <div class="experience-item">
                    <div class="experience-header">
                        <h3 class="experience-title">${exp.position}</h3>
                        <div class="experience-company">${exp.company}</div>
                        <div class="experience-date">${exp.startDate}${
                      exp.endDate ? ` - ${exp.endDate}` : ' - Present'
                    }</div>
                    </div>
                    <div class="experience-content">
                        ${exp.description ? `<p>${exp.description}</p>` : ''}
                        ${
                          exp.achievements?.length
                            ? `
                        <ul class="experience-achievements">
                            ${exp.achievements
                              .map((achievement) => `<li>${achievement}</li>`)
                              .join('')}
                        </ul>`
                            : ''
                        }
                    </div>
                </div>`
                  )
                  .join('')}
            </div>
        </div>
    </section>`;
};

const generateContactSection = (contact, personalInfo) => {
  return `
    <section id="contact" class="contact-section">
        <div class="container">
            <h2 class="section-title">Let's Connect</h2>
            <div class="contact-content">
                <div class="contact-text">
                    <p>${
                      contact?.description ||
                      "Ready to collaborate? Let's discuss your next project."
                    }</p>
                </div>
                <div class="contact-links">
                    ${
                      personalInfo?.email
                        ? `<a href="mailto:${personalInfo.email}" class="contact-link">Email</a>`
                        : ''
                    }
                    ${
                      personalInfo?.linkedin
                        ? `<a href="${personalInfo.linkedin}" class="contact-link" target="_blank">LinkedIn</a>`
                        : ''
                    }
                    ${
                      personalInfo?.github
                        ? `<a href="${personalInfo.github}" class="contact-link" target="_blank">GitHub</a>`
                        : ''
                    }
                </div>
            </div>
        </div>
    </section>`;
};

const generateEducationSection = (education) => {
  if (!education?.length) return '';

  return `
    <section id="education" class="education-section">
        <div class="container">
            <h2 class="section-title">Education</h2>
            <div class="education-list">
                ${education
                  .map(
                    (edu) => `
                <div class="education-item">
                    <h3 class="education-degree">${edu.degree}${
                      edu.field ? ` in ${edu.field}` : ''
                    }</h3>
                    <div class="education-school">${edu.institution}</div>
                    <div class="education-date">${edu.startDate}${
                      edu.endDate ? ` - ${edu.endDate}` : ''
                    }</div>
                    ${
                      edu.gpa
                        ? `<div class="education-gpa">GPA: ${edu.gpa}</div>`
                        : ''
                    }
                </div>`
                  )
                  .join('')}
            </div>
        </div>
    </section>`;
};

// CSS Generator
const generateCSS = (theme, structure) => {
  return `
/* Reset and Base Styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: ${theme.typography?.primary || 'Inter, sans-serif'};
    line-height: 1.6;
    color: ${theme.colors.text};
    background-color: ${theme.colors.background};
    overflow-x: hidden;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
}

/* Navigation */
.navbar {
    position: fixed;
    top: 0;
    width: 100%;
    background: ${theme.colors.surface}ee;
    backdrop-filter: blur(10px);
    z-index: 1000;
    padding: 1rem 0;
    border-bottom: 1px solid ${theme.colors.primary}20;
}

.navbar .container {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.nav-brand {
    font-size: 1.5rem;
    font-weight: 700;
    color: ${theme.colors.primary};
}

.nav-menu {
    display: flex;
    list-style: none;
    gap: 2rem;
}

.nav-link {
    text-decoration: none;
    color: ${theme.colors.text};
    font-weight: 500;
    transition: color 0.3s ease;
}

.nav-link:hover {
    color: ${theme.colors.primary};
}

/* Sections */
section {
    padding: 5rem 0;
    min-height: 100vh;
    display: flex;
    align-items: center;
}

.section-title {
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 3rem;
    text-align: center;
    color: ${theme.colors.text};
}

/* Hero Section */
.hero-section {
    background: linear-gradient(135deg, ${theme.colors.primary}10, ${
    theme.colors.secondary
  }10);
    text-align: center;
}

.hero-headline {
    font-size: 3.5rem;
    font-weight: 800;
    margin-bottom: 1.5rem;
    background: linear-gradient(135deg, ${theme.colors.primary}, ${
    theme.colors.secondary
  });
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.hero-subheading {
    font-size: 1.25rem;
    color: ${theme.colors.textSecondary};
    margin-bottom: 2.5rem;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
}

.hero-cta {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
}

/* Buttons */
.btn {
    display: inline-block;
    padding: 1rem 2rem;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 600;
    transition: all 0.3s ease;
    border: none;
    cursor: pointer;
}

.btn-primary {
    background: linear-gradient(135deg, ${theme.colors.primary}, ${
    theme.colors.secondary
  });
    color: white;
}

.btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 30px ${theme.colors.primary}30;
}

.btn-secondary {
    background: transparent;
    color: ${theme.colors.primary};
    border: 2px solid ${theme.colors.primary};
}

.btn-secondary:hover {
    background: ${theme.colors.primary};
    color: white;
}

/* About Section */
.about-content {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 4rem;
    align-items: start;
}

.about-text p {
    font-size: 1.1rem;
    line-height: 1.8;
    color: ${theme.colors.textSecondary};
}

.about-highlights ul {
    list-style: none;
    margin-top: 1rem;
}

.about-highlights li {
    padding: 0.5rem 0;
    position: relative;
    padding-left: 1.5rem;
}

.about-highlights li:before {
    content: "✓";
    position: absolute;
    left: 0;
    color: ${theme.colors.accent};
    font-weight: bold;
}

/* Skills Section */
.skills-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 3rem;
}

.skill-category h3 {
    color: ${theme.colors.primary};
    margin-bottom: 1.5rem;
    font-size: 1.3rem;
}

.skill-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
}

.skill-tag {
    background: ${theme.colors.primary}15;
    color: ${theme.colors.primary};
    padding: 0.5rem 1rem;
    border-radius: 25px;
    font-size: 0.9rem;
    font-weight: 500;
    border: 1px solid ${theme.colors.primary}30;
    transition: all 0.3s ease;
}

.skill-tag:hover {
    background: ${theme.colors.primary};
    color: white;
    transform: translateY(-2px);
}

.skill-tag.soft {
    background: ${theme.colors.accent}15;
    color: ${theme.colors.accent};
    border-color: ${theme.colors.accent}30;
}

.skill-tag.soft:hover {
    background: ${theme.colors.accent};
    color: white;
}

/* Projects Section */
.projects-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 2.5rem;
}

.project-card {
    background: ${theme.colors.surface};
    border-radius: 12px;
    padding: 2rem;
    border: 1px solid ${theme.colors.primary}20;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
}

.project-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 20px 40px ${theme.colors.primary}15;
    border-color: ${theme.colors.primary}40;
}

.project-title {
    color: ${theme.colors.primary};
    font-size: 1.4rem;
    margin-bottom: 1rem;
    font-weight: 600;
}

.project-description {
    color: ${theme.colors.textSecondary};
    margin-bottom: 1.5rem;
    line-height: 1.6;
}

.project-tech {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
}

.tech-tag {
    background: ${theme.colors.secondary}20;
    color: ${theme.colors.secondary};
    padding: 0.3rem 0.7rem;
    border-radius: 15px;
    font-size: 0.8rem;
    font-weight: 500;
}

.project-links {
    display: flex;
    gap: 1rem;
}

.project-link {
    color: ${theme.colors.primary};
    text-decoration: none;
    font-weight: 600;
    padding: 0.5rem 1rem;
    border: 2px solid ${theme.colors.primary};
    border-radius: 6px;
    transition: all 0.3s ease;
    text-align: center;
    flex: 1;
}

.project-link:hover {
    background: ${theme.colors.primary};
    color: white;
}

/* Experience Section */
.experience-timeline {
    position: relative;
}

.experience-timeline:before {
    content: '';
    position: absolute;
    left: 2rem;
    top: 0;
    bottom: 0;
    width: 2px;
    background: ${theme.colors.primary}30;
}

.experience-item {
    position: relative;
    padding-left: 5rem;
    margin-bottom: 3rem;
    padding-bottom: 2rem;
    border-bottom: 1px solid ${theme.colors.primary}10;
}

.experience-item:before {
    content: '';
    position: absolute;
    left: 1.2rem;
    top: 0.5rem;
    width: 1.5rem;
    height: 1.5rem;
    background: ${theme.colors.primary};
    border-radius: 50%;
    border: 3px solid ${theme.colors.background};
    box-shadow: 0 0 0 3px ${theme.colors.primary}30;
}

.experience-header {
    margin-bottom: 1.5rem;
}

.experience-title {
    font-size: 1.4rem;
    color: ${theme.colors.primary};
    margin-bottom: 0.5rem;
}

.experience-company {
    font-size: 1.1rem;
    color: ${theme.colors.text};
    font-weight: 600;
    margin-bottom: 0.3rem;
}

.experience-date {
    color: ${theme.colors.textSecondary};
    font-size: 0.9rem;
    font-weight: 500;
}

.experience-content p {
    color: ${theme.colors.textSecondary};
    margin-bottom: 1rem;
    line-height: 1.6;
}

.experience-achievements {
    list-style: none;
    margin: 1rem 0;
}

.experience-achievements li {
    position: relative;
    padding-left: 1.5rem;
    margin-bottom: 0.5rem;
    color: ${theme.colors.textSecondary};
    line-height: 1.5;
}

.experience-achievements li:before {
    content: "→";
    position: absolute;
    left: 0;
    color: ${theme.colors.accent};
    font-weight: bold;
}

/* Contact Section */
.contact-section {
    background: linear-gradient(135deg, ${theme.colors.primary}05, ${
    theme.colors.secondary
  }05);
}

.contact-content {
    text-align: center;
    max-width: 600px;
    margin: 0 auto;
}

.contact-text p {
    font-size: 1.1rem;
    color: ${theme.colors.textSecondary};
    margin-bottom: 2.5rem;
}

.contact-links {
    display: flex;
    justify-content: center;
    gap: 1.5rem;
    flex-wrap: wrap;
}

.contact-link {
    display: inline-block;
    padding: 1rem 2rem;
    background: ${theme.colors.primary};
    color: white;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 600;
    transition: all 0.3s ease;
}

.contact-link:hover {
    background: ${theme.colors.secondary};
    transform: translateY(-2px);
    box-shadow: 0 10px 25px ${theme.colors.primary}30;
}

/* Education Section */
.education-list {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
}

.education-item {
    background: ${theme.colors.surface};
    padding: 2rem;
    border-radius: 12px;
    border-left: 4px solid ${theme.colors.primary};
}

.education-degree {
    color: ${theme.colors.primary};
    font-size: 1.3rem;
    margin-bottom: 0.5rem;
}

.education-school {
    font-size: 1.1rem;
    color: ${theme.colors.text};
    font-weight: 600;
    margin-bottom: 0.3rem;
}

.education-date {
    color: ${theme.colors.textSecondary};
    font-size: 0.9rem;
    margin-bottom: 0.5rem;
}

.education-gpa {
    color: ${theme.colors.accent};
    font-weight: 600;
    font-size: 0.9rem;
}

/* Responsive Design */
@media (max-width: 768px) {
    .nav-menu {
        display: none;
    }
    
    .hero-headline {
        font-size: 2.5rem;
    }
    
    .about-content {
        grid-template-columns: 1fr;
        gap: 2rem;
    }
    
    .skills-grid {
        grid-template-columns: 1fr;
        gap: 2rem;
    }
    
    .projects-grid {
        grid-template-columns: 1fr;
    }
    
    .experience-item {
        padding-left: 3rem;
    }
    
    .experience-timeline:before {
        left: 1rem;
    }
    
    .experience-item:before {
        left: 0.2rem;
    }
    
    .contact-links {
        flex-direction: column;
        align-items: center;
    }
    
    .contact-link {
        width: 200px;
    }
}

@media (max-width: 480px) {
    .container {
        padding: 0 1rem;
    }
    
    section {
        padding: 3rem 0;
    }
    
    .hero-headline {
        font-size: 2rem;
    }
    
    .section-title {
        font-size: 2rem;
    }
}

/* Animations */
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

.section-title,
.hero-headline,
.project-card,
.experience-item {
    animation: fadeInUp 0.8s ease forwards;
}

/* Smooth scrolling */
html {
    scroll-behavior: smooth;
}

/* Custom scrollbar */
::-webkit-scrollbar {
    width: 8px;
}

::-webkit-scrollbar-track {
    background: ${theme.colors.surface};
}

::-webkit-scrollbar-thumb {
    background: ${theme.colors.primary};
    border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
    background: ${theme.colors.secondary};
}
`;
};

// JavaScript Generator
const generateJavaScript = (structure) => {
  return `
// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
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

// Navbar background on scroll
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.background = '${
          structure.type === 'developer' ? '#0F172Aee' : '#FFFFFFee'
        }';
    } else {
        navbar.style.background = '${
          structure.type === 'developer' ? '#1E293Bee' : '#F8FAfCee'
        }';
    }
});

// Active navigation link highlighting
window.addEventListener('scroll', function() {
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-link');
    
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (scrollY >= (sectionTop - 200)) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#' + current) {
            link.classList.add('active');
        }
    });
});

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all animated elements
document.querySelectorAll('.project-card, .experience-item, .skill-category').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
    observer.observe(el);
});

// Mobile menu toggle (if needed)
function toggleMobileMenu() {
    const navMenu = document.querySelector('.nav-menu');
    navMenu.classList.toggle('active');
}

// Contact form handling (if contact form is added)
function handleContactForm(event) {
    event.preventDefault();
    // Add contact form submission logic here
    alert('Thank you for your message! I\\'ll get back to you soon.');
}

// Typing effect for hero headline (optional enhancement)
function typeWriter(element, text, speed = 100) {
    let i = 0;
    element.innerHTML = '';
    function type() {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    type();
}

// Initialize typing effect on hero headline
document.addEventListener('DOMContentLoaded', function() {
    const heroHeadline = document.querySelector('.hero-headline');
    if (heroHeadline) {
        const originalText = heroHeadline.textContent;
        typeWriter(heroHeadline, originalText, 80);
    }
});

// Parallax effect for hero section (optional)
window.addEventListener('scroll', function() {
    const scrolled = window.pageYOffset;
    const heroSection = document.querySelector('.hero-section');
    if (heroSection) {
        heroSection.style.transform = 'translateY(' + scrolled * 0.5 + 'px)';
    }
});

// Theme switcher (optional feature)
function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    localStorage.setItem('theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
}

// Load saved theme
document.addEventListener('DOMContentLoaded', function() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
    }
});
`;
};
