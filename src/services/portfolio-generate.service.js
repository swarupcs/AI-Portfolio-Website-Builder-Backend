import { Portfolio } from '../models/portfolio.model.js';
import { Resume } from '../models/resume.model.js';
import { aiService } from './ai.service.js';
import { templateService } from './template.service.js';
import { themeService } from './theme.service.js';

// Get current processing step based on elapsed time
export const getCurrentProcessingStep = (elapsedMs) => {
  const seconds = Math.round(elapsedMs / 1000);

  if (seconds < 5) return 'Preparing resume data...';
  if (seconds < 10) return 'Analyzing resume structure...';
  if (seconds < 20) return 'AI is generating content...';
  if (seconds < 30) return 'Enhancing projects...';
  if (seconds < 35) return 'Selecting theme and layout...';
  if (seconds < 40) return 'Building website templates...';
  return 'Finalizing portfolio...';
};

// Main background job processing function
export const generatePortfolioBackground = async (
  portfolioId,
  isRegeneration = false
) => {
  const startTime = Date.now();

  try {
    console.log(`🚀 Starting portfolio generation for ${portfolioId}`);

    // Step 1: Data Preparation
    const { portfolio, resume } = await prepareData(portfolioId);

    // Step 2: Resume Analysis
    const analysis = await analyzeResume(resume);
    console.log(`📊 Resume analysis completed: ${analysis.roleType}`);

    // Step 3: Content Generation (AI)
    const content = await generateContent(resume, analysis);
    console.log(`✨ Content generation completed`);

    // Step 4: Project Enhancement (AI)
    const enhancedProjects = await enhanceProjects(resume, analysis);
    console.log(`🚀 Projects enhanced: ${enhancedProjects.length} projects`);

    // Step 5: Structure Determination
    const structure = await determineStructure(analysis, content);
    console.log(`🏗️ Structure determined: ${structure.type}`);

    // Step 6: Theme Selection
    const theme = await selectTheme(analysis, structure);
    console.log(`🎨 Theme selected: ${theme.name}`);

    // Step 7: Template Generation
    const template = await generateTemplate(
      content,
      enhancedProjects,
      structure,
      theme
    );
    console.log(`📄 Templates generated`);

    // Step 8: Database Update
    const processingTime = Date.now() - startTime;
    await updatePortfolioWithResults(portfolio, {
      content,
      enhancedProjects,
      structure,
      theme,
      template,
      processingTime,
      isRegeneration,
    });

    console.log(`✅ Portfolio generation completed in ${processingTime}ms`);
  } catch (error) {
    console.error(`❌ Portfolio generation failed for ${portfolioId}:`, error);
    await handleGenerationError(portfolioId, error);
  }
};

// Step 1: Data Preparation
const prepareData = async (portfolioId) => {
  const portfolio = await Portfolio.findById(portfolioId).populate('resume');

  if (!portfolio) {
    throw new Error('Portfolio not found');
  }

  if (!portfolio.resume) {
    throw new Error('Resume not found');
  }

  return { portfolio, resume: portfolio.resume };
};

// Step 2: Resume Analysis
const analyzeResume = async (resume) => {
  const resumeData = resume.content;

  // Extract basic information
  const skills = resumeData.skills || [];
  const experience = resumeData.workExperience || [];
  const projects = resumeData.projects || [];
  const education = resumeData.education || [];

  // Determine role type based on skills and experience
  const roleType = determineRoleType(skills, experience, projects);

  // Calculate experience level
  const experienceLevel = calculateExperienceLevel(experience, education);

  // Extract key achievements and metrics
  const achievements = extractAchievements(experience, projects);

  return {
    roleType,
    experienceLevel,
    achievements,
    skills: skills.map((skill) => skill.name || skill),
    totalExperience: experience.length,
    totalProjects: projects.length,
    industries: extractIndustries(experience),
    technologies: extractTechnologies(skills, projects),
  };
};

// Step 3: Content Generation (AI)
const generateContent = async (resume, analysis) => {
  const prompt = createContentGenerationPrompt(resume, analysis);

  try {
    const aiResponse = await aiService.generatePortfolioContent(prompt);

    return {
      hero: {
        headline:
          aiResponse.hero?.headline ||
          generateFallbackHeadline(resume, analysis),
        subheading:
          aiResponse.hero?.subheading || generateFallbackSubheading(analysis),
        cta: aiResponse.hero?.cta || 'View My Work',
      },
      about: {
        introduction:
          aiResponse.about?.introduction ||
          generateFallbackIntroduction(resume),
        highlights: aiResponse.about?.highlights || extractHighlights(analysis),
      },
      services: aiResponse.services || generateFallbackServices(analysis),
      contact: {
        cta: aiResponse.contact?.cta || "Let's Work Together",
        description:
          aiResponse.contact?.description ||
          'Ready to start your next project?',
      },
    };
  } catch (error) {
    console.warn('AI content generation failed, using fallbacks:', error);
    return generateFallbackContent(resume, analysis);
  }
};

// Step 4: Project Enhancement (AI)
const enhanceProjects = async (resume, analysis) => {
  const projects = resume.content.projects || [];

  if (projects.length === 0) {
    return [];
  }

  const enhancedProjects = [];

  for (const project of projects.slice(0, 6)) {
    // Limit to top 6 projects
    try {
      const prompt = createProjectEnhancementPrompt(project, analysis);
      const aiResponse = await aiService.enhanceProject(prompt);

      enhancedProjects.push({
        name: project.name || aiResponse.name,
        tagline: aiResponse.tagline || generateProjectTagline(project),
        description: aiResponse.description || project.description,
        challenge: aiResponse.challenge || 'Delivered a comprehensive solution',
        solution: aiResponse.solution || project.description,
        technologies: project.technologies || aiResponse.technologies || [],
        features: aiResponse.features || extractProjectFeatures(project),
        metrics: aiResponse.metrics || generateProjectMetrics(project),
        url: project.url || project.liveUrl,
        github: project.github || project.githubUrl,
        images: {
          hero:
            aiResponse.images?.hero || generatePlaceholderImage(project.name),
          gallery: aiResponse.images?.gallery || [],
        },
      });
    } catch (error) {
      console.warn(
        `Failed to enhance project ${project.name}, using fallback:`,
        error
      );
      enhancedProjects.push(createFallbackEnhancedProject(project));
    }
  }

  return enhancedProjects;
};

// Step 5: Structure Determination
const determineStructure = async (analysis, content) => {
  const { roleType, experienceLevel, totalProjects } = analysis;

  // Determine sections based on role and experience
  const sections = ['hero', 'about'];

  if (analysis.skills.length > 0) {
    sections.push('skills');
  }

  if (totalProjects > 0) {
    sections.push('projects');
  }

  if (analysis.totalExperience > 0) {
    sections.push('experience');
  }

  sections.push('contact');

  // Determine layout style
  let layout = 'professional-clean';
  if (roleType === 'developer') {
    layout = 'code-focused';
  } else if (roleType === 'designer') {
    layout = 'visual-heavy';
  }

  // Determine features
  const features = [];
  if (roleType === 'developer') {
    features.push('github-integration', 'live-demos');
  }
  if (experienceLevel === 'senior') {
    features.push('testimonials');
  }

  // Determine color scheme
  let colorScheme = 'professional-blue';
  if (roleType === 'developer') {
    colorScheme = 'dark-modern';
  } else if (roleType === 'designer') {
    colorScheme = 'creative-vibrant';
  }

  return {
    type: roleType,
    sections,
    layout,
    features,
    colorScheme,
    navigation: totalProjects > 3 ? 'fixed-header' : 'top-menu',
  };
};

// Step 6: Theme Selection
const selectTheme = async (analysis, structure) => {
  return themeService.selectTheme(analysis.roleType, structure.colorScheme);
};

// Step 7: Template Generation
const generateTemplate = async (
  content,
  enhancedProjects,
  structure,
  theme
) => {
  return templateService.generateTemplate({
    content,
    projects: enhancedProjects,
    structure,
    theme,
  });
};

// Step 8: Database Update
const updatePortfolioWithResults = async (portfolio, results) => {
  const {
    content,
    enhancedProjects,
    structure,
    theme,
    template,
    processingTime,
    isRegeneration,
  } = results;

  // Calculate confidence score based on AI responses and data quality
  const contentConfidence = calculateContentConfidence(
    content,
    enhancedProjects
  );

  // Update portfolio with all generated data
  portfolio.content = content;
  portfolio.enhancedProjects = enhancedProjects;
  portfolio.structure = structure;
  portfolio.theme = theme;
  portfolio.template = template;

  // Update generation metadata
  portfolio.generation.contentConfidence = contentConfidence;
  portfolio.generation.processingTime = processingTime;
  portfolio.generation.generatedAt = new Date();

  if (isRegeneration) {
    portfolio.generation.lastRegeneratedAt = new Date();
    portfolio.status = 'regenerated';
  } else {
    portfolio.status = 'generated'; // This triggers pre-save middleware
  }

  await portfolio.save();
};

// Error handling
const handleGenerationError = async (portfolioId, error) => {
  try {
    await Portfolio.findByIdAndUpdate(portfolioId, {
      status: 'error',
      'generation.error': {
        message: error.message,
        timestamp: new Date(),
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
    });
  } catch (updateError) {
    console.error('Failed to update portfolio with error status:', updateError);
  }
};

// Generate complete HTML for preview
export const generateCompleteHTML = (portfolio) => {
  const { template } = portfolio;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${portfolio.title}</title>
  <style>
    ${template.css}
  </style>
</head>
<body>
  ${template.html}
  <script>
    ${template.javascript}
  </script>
</body>
</html>
  `.trim();
};

// Helper Functions

const determineRoleType = (skills, experience, projects) => {
  const skillNames = skills.map((s) => (s.name || s).toLowerCase());
  const techSkills = [
    'javascript',
    'python',
    'react',
    'node',
    'java',
    'git',
    'sql',
  ];
  const designSkills = [
    'figma',
    'photoshop',
    'illustrator',
    'sketch',
    'ui',
    'ux',
  ];
  const businessSkills = [
    'marketing',
    'sales',
    'strategy',
    'management',
    'analytics',
  ];

  const techCount = skillNames.filter((skill) =>
    techSkills.some((tech) => skill.includes(tech))
  ).length;

  const designCount = skillNames.filter((skill) =>
    designSkills.some((design) => skill.includes(design))
  ).length;

  const businessCount = skillNames.filter((skill) =>
    businessSkills.some((business) => skill.includes(business))
  ).length;

  if (techCount >= designCount && techCount >= businessCount)
    return 'developer';
  if (designCount >= businessCount) return 'designer';
  if (businessCount > 0) return 'business';
  return 'general';
};

const calculateExperienceLevel = (experience, education) => {
  const totalYears = experience.reduce((sum, exp) => {
    if (exp.startDate && exp.endDate) {
      const start = new Date(exp.startDate);
      const end =
        exp.endDate === 'Present' ? new Date() : new Date(exp.endDate);
      return sum + (end - start) / (1000 * 60 * 60 * 24 * 365);
    }
    return sum + 1; // Default 1 year if dates unclear
  }, 0);

  if (totalYears < 2) return 'junior';
  if (totalYears < 5) return 'mid-level';
  return 'senior';
};

const extractAchievements = (experience, projects) => {
  const achievements = [];

  experience.forEach((exp) => {
    if (exp.achievements) {
      achievements.push(...exp.achievements);
    }
  });

  projects.forEach((project) => {
    if (project.achievements) {
      achievements.push(...project.achievements);
    }
  });

  return achievements.slice(0, 5); // Top 5 achievements
};

const extractIndustries = (experience) => {
  return [...new Set(experience.map((exp) => exp.industry).filter(Boolean))];
};

const extractTechnologies = (skills, projects) => {
  const techs = [...skills.map((s) => s.name || s)];

  projects.forEach((project) => {
    if (project.technologies) {
      techs.push(...project.technologies);
    }
  });

  return [...new Set(techs)];
};

const calculateContentConfidence = (content, enhancedProjects) => {
  let score = 0;

  // Check content completeness
  if (content.hero?.headline) score += 20;
  if (content.about?.introduction) score += 20;
  if (content.services?.length > 0) score += 20;

  // Check projects quality
  if (enhancedProjects.length > 0) score += 20;
  if (enhancedProjects.some((p) => p.challenge && p.solution)) score += 20;

  return Math.min(100, score);
};

// Fallback content generators
const generateFallbackContent = (resume, analysis) => ({
  hero: {
    headline: generateFallbackHeadline(resume, analysis),
    subheading: generateFallbackSubheading(analysis),
    cta: 'View My Work',
  },
  about: {
    introduction: generateFallbackIntroduction(resume),
    highlights: extractHighlights(analysis),
  },
  services: generateFallbackServices(analysis),
  contact: {
    cta: "Let's Work Together",
    description: 'Ready to start your next project?',
  },
});

const generateFallbackHeadline = (resume, analysis) => {
  const name = resume.content.personalInfo?.name || 'Professional';
  const role =
    analysis.roleType.charAt(0).toUpperCase() + analysis.roleType.slice(1);
  return `${name} - ${role} & Problem Solver`;
};

const generateFallbackSubheading = (analysis) => {
  const roleMessages = {
    developer: 'Building innovative solutions with modern technologies',
    designer: 'Creating beautiful and functional user experiences',
    business: 'Driving growth through strategic thinking and execution',
    general: 'Passionate professional delivering excellent results',
  };
  return roleMessages[analysis.roleType];
};

const generateFallbackIntroduction = (resume) => {
  const personalInfo = resume.content.personalInfo || {};
  return (
    personalInfo.summary ||
    'Experienced professional with a passion for delivering high-quality results and continuous learning.'
  );
};

const extractHighlights = (analysis) =>
  [
    `${analysis.totalExperience}+ years of experience`,
    `${analysis.totalProjects}+ successful projects`,
    `Expertise in ${analysis.technologies.slice(0, 3).join(', ')}`,
    `${analysis.experienceLevel} level professional`,
  ].filter((highlight) => !highlight.includes('0+'));

const generateFallbackServices = (analysis) => {
  const servicesByRole = {
    developer: [
      {
        title: 'Web Development',
        description: 'Building responsive and scalable web applications',
        icon: 'code',
      },
      {
        title: 'API Development',
        description: 'Creating robust backend systems and APIs',
        icon: 'server',
      },
      {
        title: 'Database Design',
        description: 'Designing efficient database architectures',
        icon: 'database',
      },
    ],
    designer: [
      {
        title: 'UI/UX Design',
        description: 'Creating intuitive user interfaces and experiences',
        icon: 'palette',
      },
      {
        title: 'Prototyping',
        description: 'Building interactive prototypes and wireframes',
        icon: 'layout',
      },
      {
        title: 'Brand Design',
        description: 'Developing cohesive brand identities',
        icon: 'brand',
      },
    ],
    business: [
      {
        title: 'Strategy Consulting',
        description: 'Developing business strategies and roadmaps',
        icon: 'target',
      },
      {
        title: 'Project Management',
        description: 'Leading cross-functional teams and projects',
        icon: 'users',
      },
      {
        title: 'Data Analysis',
        description: 'Analyzing data to drive business decisions',
        icon: 'chart',
      },
    ],
    general: [
      {
        title: 'Consulting',
        description: 'Providing expert advice and solutions',
        icon: 'lightbulb',
      },
      {
        title: 'Project Delivery',
        description: 'Managing and delivering complex projects on time',
        icon: 'check',
      },
      {
        title: 'Process Improvement',
        description: 'Optimizing workflows and business processes',
        icon: 'refresh',
      },
    ],
  };

  return servicesByRole[analysis.roleType] || servicesByRole.general;
};

const createFallbackEnhancedProject = (project) => ({
  name: project.name,
  tagline: generateProjectTagline(project),
  description:
    project.description ||
    'A comprehensive solution addressing key business needs.',
  challenge:
    'Delivered a solution that met all requirements and exceeded expectations.',
  solution:
    project.description ||
    'Implemented using modern technologies and best practices.',
  technologies: project.technologies || [],
  features: extractProjectFeatures(project),
  metrics: generateProjectMetrics(project),
  url: project.url || project.liveUrl,
  github: project.github || project.githubUrl,
  images: {
    hero: generatePlaceholderImage(project.name),
    gallery: [],
  },
});

const generateProjectTagline = (project) => {
  const taglines = [
    'Innovative solution for modern challenges',
    'Seamless user experience with powerful functionality',
    'Efficient and scalable application design',
    'User-focused design with technical excellence',
  ];
  return taglines[Math.floor(Math.random() * taglines.length)];
};

const extractProjectFeatures = (project) => {
  if (project.features) return project.features;

  const defaultFeatures = [
    'Responsive design',
    'User-friendly interface',
    'Performance optimized',
    'Cross-platform compatibility',
  ];

  return defaultFeatures.slice(0, Math.random() * 2 + 2);
};

const generateProjectMetrics = (project) => {
  if (project.metrics) return project.metrics;

  const possibleMetrics = [
    'Improved user engagement by 40%',
    'Reduced loading time by 60%',
    'Increased conversion rate by 25%',
    'Successfully deployed to production',
  ];

  return possibleMetrics.slice(0, Math.random() * 2 + 1);
};

const generatePlaceholderImage = (projectName) => {
  // Generate a placeholder image URL based on project name
  const encodedName = encodeURIComponent(projectName || 'Project');
  return `https://via.placeholder.com/800x400/6366f1/white?text=${encodedName}`;
};

// AI Prompt Generators
const createContentGenerationPrompt = (resume, analysis) => {
  const personalInfo = resume.content.personalInfo || {};
  const skills = analysis.skills.join(', ');

  return `
Generate professional portfolio website content for a ${
    analysis.roleType
  } with ${analysis.experienceLevel} experience level.

Personal Information:
- Name: ${personalInfo.name || 'Professional'}
- Role: ${analysis.roleType}
- Experience: ${analysis.experienceLevel}
- Skills: ${skills}
- Industries: ${analysis.industries.join(', ')}

Generate content for:
1. Hero section (headline, subheading, CTA)
2. About section (introduction, highlights array)
3. Services section (3-4 services with title, description, icon)
4. Contact section (CTA, description)

Make it professional, engaging, and tailored to the role type. Return as JSON.
  `.trim();
};

const createProjectEnhancementPrompt = (project, analysis) => {
  return `
Enhance this project for a ${analysis.roleType}'s portfolio:

Original Project:
- Name: ${project.name}
- Description: ${project.description || 'No description available'}
- Technologies: ${(project.technologies || []).join(', ')}

Generate enhanced content:
1. Compelling tagline
2. Detailed description (2-3 sentences)
3. Challenge statement
4. Solution description
5. Key features array (3-4 items)
6. Impact metrics array (2-3 items)

Make it professional and results-focused. Return as JSON.
  `.trim();
};

// Export service object
export const portfolioService = {
  getCurrentProcessingStep,
  generatePortfolioBackground,
  generateCompleteHTML,
};
