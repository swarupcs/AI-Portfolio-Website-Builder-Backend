// services/portfolio-content.service.js
import Groq from 'groq-sdk';
import { GROQ_API_KEY } from '../config/config.js';

const groq = new Groq({ apiKey: GROQ_API_KEY });

// 1.1 Website Content Generator Service
export const generatePortfolioContent = async (
  resumeData,
  preferences = {}
) => {
  try {
    const {
      tone = 'professional',
      industry,
      targetAudience = 'employers',
    } = preferences;

    const primaryRole = resumeData.experience?.[0]?.position || 'Professional';
    const topSkills =
      resumeData.skills?.technical?.slice(0, 6).join(', ') ||
      'Various technologies';
    const yearsExperience = resumeData.experience?.length || 0;
    const name = resumeData.personalInfo?.name || 'Professional';

    const prompt = `Generate compelling portfolio website content for ${name}, a ${primaryRole}.

RESUME DATA:
- Role: ${primaryRole}
- Skills: ${topSkills}
- Experience: ${yearsExperience} positions
- Summary: ${resumeData.summary || 'Not provided'}
- Location: ${resumeData.personalInfo?.location || 'Not specified'}

REQUIREMENTS:
- Tone: ${tone}
- Target Audience: ${targetAudience}
- Industry: ${industry || 'Technology'}

Generate ONLY valid JSON in this format:
{
  "hero": {
    "headline": "Short, impactful headline (8-12 words)",
    "subheading": "Value proposition (20-30 words)",
    "cta": "Call to action text (2-4 words)"
  },
  "about": {
    "introduction": "Compelling first-person narrative (80-120 words)",
    "highlights": ["3-5 key achievements or strengths"]
  },
  "services": [
    {
      "title": "Service 1",
      "description": "What you offer (20-30 words)",
      "icon": "suitable icon name"
    }
  ],
  "contact": {
    "cta": "Contact call-to-action",
    "description": "Why they should contact you (15-25 words)"
  }
}`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 2000,
    });

    const responseText = completion.choices[0].message.content.trim();

    // Parse JSON response
    let content;
    try {
      content = JSON.parse(responseText);
    } catch (jsonError) {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        content = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse AI response');
      }
    }

    return {
      content,
      metadata: {
        generatedAt: new Date(),
        model: 'llama-3.3-70b-versatile',
        preferences: preferences,
      },
    };
  } catch (error) {
    console.error('Portfolio content generation error:', error);
    throw new Error(`Failed to generate portfolio content: ${error.message}`);
  }
};

// 1.2 Project Enhancement Service
export const enhanceProjectsForWeb = async (
  projects = [],
  resumeSkills = []
) => {
  try {
    if (!projects.length) return { enhancedProjects: [], metadata: {} };

    const projectsText = JSON.stringify(projects, null, 2);
    const skillsText = resumeSkills.join(', ');

    const prompt = `Enhance these resume projects for a portfolio website:

PROJECTS:
${projectsText}

AVAILABLE SKILLS: ${skillsText}

Transform each project into compelling portfolio pieces. Return ONLY valid JSON:
{
  "enhancedProjects": [
    {
      "name": "Enhanced project title (make it catchy)",
      "tagline": "One-line description highlighting the main benefit",
      "description": "Detailed description focusing on impact and results (50-80 words)",
      "challenge": "What problem this project solved",
      "solution": "How you solved it",
      "technologies": ["relevant technologies used"],
      "features": ["key features implemented"],
      "metrics": ["quantifiable results if any"],
      "url": "project url if available",
      "github": "github url if available",
      "images": {
        "hero": "suggested hero image description",
        "gallery": ["suggested additional image descriptions"]
      }
    }
  ]
}`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.6,
      max_tokens: 3000,
    });

    const responseText = completion.choices[0].message.content.trim();
    let result;

    try {
      result = JSON.parse(responseText);
    } catch (jsonError) {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse project enhancement response');
      }
    }

    return {
      ...result,
      metadata: {
        originalCount: projects.length,
        enhancedCount: result.enhancedProjects?.length || 0,
        generatedAt: new Date(),
      },
    };
  } catch (error) {
    console.error('Project enhancement error:', error);
    throw new Error(`Failed to enhance projects: ${error.message}`);
  }
};

// 1.3 Portfolio Structure Recommendation
export const recommendSiteStructure = async (resumeData) => {
  try {
    const primaryRole =
      resumeData.experience?.[0]?.position?.toLowerCase() || '';
    const skills = resumeData.skills?.technical || [];
    const hasProjects = (resumeData.projects?.length || 0) > 0;
    const hasEducation = (resumeData.education?.length || 0) > 0;

    // Role-based structure detection
    let recommendedStructure;

    if (
      primaryRole.includes('developer') ||
      primaryRole.includes('engineer') ||
      skills.some((skill) =>
        ['javascript', 'python', 'react', 'node', 'java'].includes(
          skill.toLowerCase()
        )
      )
    ) {
      recommendedStructure = {
        type: 'developer',
        sections: [
          'hero',
          'about',
          'skills',
          'projects',
          'experience',
          'contact',
        ],
        layout: 'code-focused',
        features: [
          'github-integration',
          'live-demos',
          'code-snippets',
          'tech-stack',
        ],
        colorScheme: 'dark-modern',
        navigation: 'fixed-header',
      };
    } else if (
      primaryRole.includes('design') ||
      primaryRole.includes('creative') ||
      skills.some((skill) =>
        ['photoshop', 'figma', 'sketch'].includes(skill.toLowerCase())
      )
    ) {
      recommendedStructure = {
        type: 'designer',
        sections: [
          'hero',
          'portfolio',
          'about',
          'services',
          'experience',
          'contact',
        ],
        layout: 'visual-heavy',
        features: [
          'image-gallery',
          'case-studies',
          'testimonials',
          'process-showcase',
        ],
        colorScheme: 'creative-vibrant',
        navigation: 'side-menu',
      };
    } else if (
      primaryRole.includes('manager') ||
      primaryRole.includes('director') ||
      primaryRole.includes('consultant')
    ) {
      recommendedStructure = {
        type: 'business',
        sections: [
          'hero',
          'about',
          'services',
          'experience',
          'achievements',
          'contact',
        ],
        layout: 'professional-clean',
        features: [
          'testimonials',
          'achievements',
          'case-studies',
          'linkedin-integration',
        ],
        colorScheme: 'corporate-blue',
        navigation: 'top-menu',
      };
    } else {
      recommendedStructure = {
        type: 'general',
        sections: ['hero', 'about', 'skills', 'experience', 'contact'],
        layout: 'balanced',
        features: ['resume-download', 'social-links', 'contact-form'],
        colorScheme: 'neutral-modern',
        navigation: 'top-menu',
      };
    }

    // Add conditional sections
    if (hasProjects && !recommendedStructure.sections.includes('projects')) {
      const insertIndex = recommendedStructure.sections.indexOf('experience');
      recommendedStructure.sections.splice(insertIndex, 0, 'projects');
    }

    if (hasEducation && !recommendedStructure.sections.includes('education')) {
      recommendedStructure.sections.push('education');
    }

    return {
      recommended: recommendedStructure,
      alternatives: generateAlternativeStructures(resumeData),
      reasoning: generateStructureReasoning(resumeData, recommendedStructure),
      metadata: {
        generatedAt: new Date(),
        basedOn: {
          primaryRole,
          skillsCount: skills.length,
          hasProjects,
          hasEducation,
        },
      },
    };
  } catch (error) {
    console.error('Structure recommendation error:', error);
    throw new Error(`Failed to recommend site structure: ${error.message}`);
  }
};

// Helper function for alternative structures
const generateAlternativeStructures = (resumeData) => {
  return [
    {
      type: 'minimal',
      sections: ['hero', 'about', 'contact'],
      description: 'Clean, simple approach focusing on essential information',
    },
    {
      type: 'comprehensive',
      sections: [
        'hero',
        'about',
        'skills',
        'experience',
        'projects',
        'education',
        'blog',
        'contact',
      ],
      description: 'Detailed showcase with all available sections',
    },
    {
      type: 'story-driven',
      sections: ['hero', 'journey', 'projects', 'values', 'contact'],
      description: 'Narrative-focused approach telling your professional story',
    },
  ];
};

// Helper function for structure reasoning
const generateStructureReasoning = (resumeData, structure) => {
  const reasons = [];

  if (structure.type === 'developer') {
    reasons.push('Technical role detected - emphasizing projects and skills');
    reasons.push('Code-focused layout will showcase technical expertise');
  } else if (structure.type === 'designer') {
    reasons.push('Creative role detected - prioritizing visual portfolio');
    reasons.push('Visual-heavy layout will highlight design work');
  } else if (structure.type === 'business') {
    reasons.push('Leadership role detected - focusing on achievements');
    reasons.push('Professional layout builds credibility and trust');
  }

  if (resumeData.projects?.length > 0) {
    reasons.push(
      `${resumeData.projects.length} projects available for showcase`
    );
  }

  return reasons;
};
