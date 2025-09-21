// controllers/portfolio.controller.js
import { Resume } from '../models/resume.model.js';
import { Portfolio } from '../models/portfolio.model.js';
import { ApiResponse } from '../utils/api-response.js';
import { asyncHandler } from '../utils/async-handler.js';
import {
  generatePortfolioContent,
  enhanceProjectsForWeb,
  recommendSiteStructure,
} from '../services/portfolio-content.service.js';
import {
  recommendVisualTheme,
  generateWebsiteTemplate,
} from '../services/theme-template.service.js';

// 1. Generate Portfolio Content from Resume
export const generatePortfolio = asyncHandler(async (req, res) => {
  const { resumeId } = req.params;
  const userId = req.user?._id;
  const preferences = req.body || {};

  if (!userId) {
    return new ApiResponse(401, 'Unauthorized').send(res);
  }

  // Check if resume exists and is processed
  const resume = await Resume.findOne({
    _id: resumeId,
    user: userId,
    'processing.status': 'completed',
  }).populate('user', 'name email');

  if (!resume) {
    return new ApiResponse(404, 'Resume not found or not fully processed').send(
      res
    );
  }

  try {
    // Check if portfolio already exists
    const existingPortfolio = await Portfolio.findOne({
      resume: resumeId,
      user: userId,
    });

    if (existingPortfolio) {
      return new ApiResponse(409, 'Portfolio already exists for this resume', {
        portfolio: {
          id: existingPortfolio._id,
          status: existingPortfolio.status,
        },
        actions: {
          view: `/api/portfolio/${existingPortfolio._id}`,
          regenerate: `/api/portfolio/${existingPortfolio._id}/regenerate`,
          customize: `/api/portfolio/${existingPortfolio._id}/customize`,
        },
      }).send(res);
    }

    console.log(`🎨 Generating portfolio for resume ${resumeId}`);
    const startTime = Date.now();

    // Step 1: Generate website content
    const contentResult = await generatePortfolioContent(
      resume.content.structured,
      preferences
    );

    // Step 2: Enhance projects for web display
    const projectsResult = await enhanceProjectsForWeb(
      resume.content.structured.projects,
      resume.content.structured.skills.technical
    );

    // Step 3: Recommend site structure
    const structureResult = await recommendSiteStructure(
      resume.content.structured
    );

    // Step 4: Recommend visual theme
    const themeResult = await recommendVisualTheme(
      resume.content.structured,
      structureResult.recommended,
      preferences
    );

    // Step 5: Generate website template
    const templateResult = await generateWebsiteTemplate(
      contentResult.content,
      structureResult.recommended,
      themeResult.selected,
      resume.content.structured
    );

    const processingTime = Date.now() - startTime;

    // Create portfolio record
    const portfolio = await Portfolio.create({
      user: userId,
      resume: resumeId,
      title: `${
        resume.content.structured.personalInfo?.name || 'Portfolio'
      } - Portfolio Website`,

      // Generated content
      content: contentResult.content,
      enhancedProjects: projectsResult.enhancedProjects,

      // Design & structure
      structure: structureResult.recommended,
      theme: themeResult.selected,

      // Website files
      template: {
        html: templateResult.html,
        css: templateResult.css,
        javascript: templateResult.javascript,
      },

      // Generation metadata
      generation: {
        contentConfidence: resume.content.aiMetadata?.confidence || 0,
        processingTime: processingTime,
        preferences: preferences,
        generatedAt: new Date(),
        version: '1.0',
      },

      status: 'generated',
      isPublic: false,
    });

    await portfolio.populate([
      { path: 'user', select: 'name email' },
      { path: 'resume', select: 'title file processing.status' },
    ]);

    console.log(`✅ Portfolio generated successfully in ${processingTime}ms`);

    return new ApiResponse(201, '🎨 Portfolio generated successfully!', {
      portfolio: {
        id: portfolio._id,
        title: portfolio.title,
        status: portfolio.status,
        structure: portfolio.structure,
        theme: {
          name: portfolio.theme.name,
          description: portfolio.theme.description,
          colors: portfolio.theme.colors,
        },
        generation: {
          processingTime: processingTime,
          contentConfidence: portfolio.generation.contentConfidence,
          generatedAt: portfolio.generation.generatedAt,
        },
      },
      actions: {
        preview: `/api/portfolio/${portfolio._id}/preview`,
        customize: `/api/portfolio/${portfolio._id}/customize`,
        export: `/api/portfolio/${portfolio._id}/export`,
        deploy: `/api/portfolio/${portfolio._id}/deploy`,
      },
      insights: {
        structureReasoning: structureResult.reasoning,
        alternativeStructures: structureResult.alternatives,
        themeAlternatives: themeResult.alternatives,
      },
    }).send(res);
  } catch (error) {
    console.error('Portfolio generation error:', error);
    return new ApiResponse(500, 'Failed to generate portfolio', {
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      canRetry: true,
    }).send(res);
  }
});

// 2. Get Portfolio Details
export const getPortfolio = asyncHandler(async (req, res) => {
  const { portfolioId } = req.params;
  const userId = req.user?._id;

  if (!userId) {
    return new ApiResponse(401, 'Unauthorized').send(res);
  }

  const portfolio = await Portfolio.findOne({
    _id: portfolioId,
    user: userId,
  }).populate([
    { path: 'user', select: 'name email' },
    { path: 'resume', select: 'title processing.status content.aiMetadata' },
  ]);

  if (!portfolio) {
    return new ApiResponse(404, 'Portfolio not found').send(res);
  }

  return new ApiResponse(200, 'Portfolio details retrieved', {
    portfolio: {
      id: portfolio._id,
      title: portfolio.title,
      status: portfolio.status,
      isPublic: portfolio.isPublic,
      content: portfolio.content,
      enhancedProjects: portfolio.enhancedProjects,
      structure: portfolio.structure,
      theme: portfolio.theme,
      generation: portfolio.generation,
      createdAt: portfolio.createdAt,
      updatedAt: portfolio.updatedAt,
    },
    resume: {
      id: portfolio.resume._id,
      title: portfolio.resume.title,
      confidence: portfolio.resume.content?.aiMetadata?.confidence,
    },
    actions: {
      preview: `/api/portfolio/${portfolioId}/preview`,
      customize: `/api/portfolio/${portfolioId}/customize`,
      export: `/api/portfolio/${portfolioId}/export`,
      regenerate: `/api/portfolio/${portfolioId}/regenerate`,
    },
  }).send(res);
});

// 3. Preview Portfolio Website
// 3. Preview Portfolio Website (Enhanced Version)
export const previewPortfolio = asyncHandler(async (req, res) => {
  const { portfolioId } = req.params;
  const userId = req.user?._id;

  if (!userId) {
    return new ApiResponse(401, 'Unauthorized').send(res);
  }

  const portfolio = await Portfolio.findOne({
    _id: portfolioId,
    user: userId,
  });

  if (!portfolio) {
    return new ApiResponse(404, 'Portfolio not found').send(res);
  }

  if (portfolio.status !== 'generated' && portfolio.status !== 'customized' && portfolio.status !== 'regenerated') {
    return new ApiResponse(400, 'Portfolio not ready for preview', {
      currentStatus: portfolio.status,
      message: 'Portfolio must be generated before preview',
    }).send(res);
  }

  try {
    // Create a complete HTML document with inline CSS and JS
    const completeHtml = createCompleteHtmlDocument(
      portfolio.template.html,
      portfolio.template.css,
      portfolio.template.javascript
    );

    // Set appropriate headers
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    return res.send(completeHtml);
  } catch (error) {
    console.error('Portfolio preview error:', error);
    return new ApiResponse(500, 'Failed to generate preview', {
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    }).send(res);
  }
});

// Helper function to create complete HTML document with inline assets
const createCompleteHtmlDocument = (html, css, javascript) => {
  // Check if HTML already has doctype and html tags
  const hasDoctype = html.trim().toLowerCase().startsWith('<!doctype');
  const hasHtmlTag = html.trim().toLowerCase().includes('<html');
  
  if (hasDoctype && hasHtmlTag) {
    // HTML is already complete, just inject CSS and JS
    return injectAssetsIntoCompleteHtml(html, css, javascript);
  } else {
    // Create a complete HTML document
    return createNewCompleteHtml(html, css, javascript);
  }
};

const injectAssetsIntoCompleteHtml = (html, css, javascript) => {
  let modifiedHtml = html;

  // Inject CSS before closing head tag or at the beginning of head
  if (css && css.trim()) {
    const cssTag = `<style type="text/css">\n${css}\n</style>`;
    
    if (modifiedHtml.includes('</head>')) {
      modifiedHtml = modifiedHtml.replace('</head>', `${cssTag}\n</head>`);
    } else if (modifiedHtml.includes('<head>')) {
      modifiedHtml = modifiedHtml.replace('<head>', `<head>\n${cssTag}`);
    } else {
      // Fallback: inject after opening html tag
      modifiedHtml = modifiedHtml.replace(
        /(<html[^>]*>)/i,
        `$1\n<head>\n${cssTag}\n</head>`
      );
    }
  }

  // Inject JavaScript before closing body tag or at the end
  if (javascript && javascript.trim()) {
    const jsTag = `<script type="text/javascript">\n${javascript}\n</script>`;
    
    if (modifiedHtml.includes('</body>')) {
      modifiedHtml = modifiedHtml.replace('</body>', `${jsTag}\n</body>`);
    } else {
      // Fallback: append at the end
      modifiedHtml += `\n${jsTag}`;
    }
  }

  return modifiedHtml;
};

const createNewCompleteHtml = (html, css, javascript) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Portfolio Preview</title>
    ${css ? `<style type="text/css">\n${css}\n</style>` : ''}
</head>
<body>
    ${html}
    ${javascript ? `<script type="text/javascript">\n${javascript}\n</script>` : ''}
</body>
</html>`;
};

// Alternative Solution: Serve individual assets as separate endpoints
export const getPortfolioAsset = asyncHandler(async (req, res) => {
  const { portfolioId, assetType } = req.params; // assetType: 'css', 'js', 'html'
  const userId = req.user?._id;

  if (!userId) {
    return new ApiResponse(401, 'Unauthorized').send(res);
  }

  const portfolio = await Portfolio.findOne({
    _id: portfolioId,
    user: userId,
  });

  if (!portfolio) {
    return new ApiResponse(404, 'Portfolio not found').send(res);
  }

  let content, contentType;

  switch (assetType.toLowerCase()) {
    case 'css':
    case 'styles':
      content = portfolio.template.css;
      contentType = 'text/css';
      break;
    case 'js':
    case 'script':
    case 'javascript':
      content = portfolio.template.javascript;
      contentType = 'application/javascript';
      break;
    case 'html':
    case 'index':
      content = portfolio.template.html;
      contentType = 'text/html';
      break;
    default:
      return new ApiResponse(400, 'Invalid asset type', {
        validTypes: ['css', 'js', 'html'],
      }).send(res);
  }

  if (!content) {
    return new ApiResponse(404, `${assetType} content not found`).send(res);
  }

  res.setHeader('Content-Type', contentType);
  res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minutes cache for assets
  res.send(content);
});

// Enhanced preview with better error handling and metadata
export const getPortfolioPreviewData = asyncHandler(async (req, res) => {
  const { portfolioId } = req.params;
  const userId = req.user?._id;

  if (!userId) {
    return new ApiResponse(401, 'Unauthorized').send(res);
  }

  const portfolio = await Portfolio.findOne({
    _id: portfolioId,
    user: userId,
  });

  if (!portfolio) {
    return new ApiResponse(404, 'Portfolio not found').send(res);
  }

  // Return preview data as JSON for frontend to handle
  return new ApiResponse(200, 'Portfolio preview data', {
    preview: {
      html: portfolio.template.html,
      css: portfolio.template.css,
      javascript: portfolio.template.javascript,
      title: portfolio.title,
      status: portfolio.status,
    },
    assets: {
      htmlSize: portfolio.template.html?.length || 0,
      cssSize: portfolio.template.css?.length || 0,
      jsSize: portfolio.template.javascript?.length || 0,
    },
    urls: {
      fullPreview: `/api/portfolio/${portfolioId}/preview`,
      htmlOnly: `/api/portfolio/${portfolioId}/asset/html`,
      cssOnly: `/api/portfolio/${portfolioId}/asset/css`,
      jsOnly: `/api/portfolio/${portfolioId}/asset/js`,
    },
  }).send(res);
});

// 4. Customize Portfolio
export const customizePortfolio = asyncHandler(async (req, res) => {
  const { portfolioId } = req.params;
  const userId = req.user?._id;
  const customizations = req.body;

  if (!userId) {
    return new ApiResponse(401, 'Unauthorized').send(res);
  }

  const portfolio = await Portfolio.findOne({
    _id: portfolioId,
    user: userId,
  }).populate('resume');

  if (!portfolio) {
    return new ApiResponse(404, 'Portfolio not found').send(res);
  }

  try {
    let regenerateTemplate = false;

    // Handle content customizations
    if (customizations.content) {
      portfolio.content = { ...portfolio.content, ...customizations.content };
      regenerateTemplate = true;
    }

    // Handle theme customizations
    if (customizations.theme) {
      portfolio.theme = { ...portfolio.theme, ...customizations.theme };
      regenerateTemplate = true;
    }

    // Handle structure customizations
    if (customizations.structure) {
      portfolio.structure = {
        ...portfolio.structure,
        ...customizations.structure,
      };
      regenerateTemplate = true;
    }

    // Handle project customizations
    if (customizations.projects) {
      portfolio.enhancedProjects = customizations.projects;
      regenerateTemplate = true;
    }

    // Regenerate template if needed
    if (regenerateTemplate) {
      const newTemplate = await generateWebsiteTemplate(
        portfolio.content,
        portfolio.structure,
        portfolio.theme,
        portfolio.resume.content.structured
      );

      portfolio.template = newTemplate;
      portfolio.generation.lastCustomizedAt = new Date();
    }

    portfolio.status = 'customized';
    await portfolio.save();

    return new ApiResponse(200, '🎨 Portfolio customized successfully', {
      portfolio: {
        id: portfolio._id,
        status: portfolio.status,
        lastCustomizedAt: portfolio.generation.lastCustomizedAt,
      },
      actions: {
        preview: `/api/portfolio/${portfolioId}/preview`,
        export: `/api/portfolio/${portfolioId}/export`,
      },
    }).send(res);
  } catch (error) {
    console.error('Portfolio customization error:', error);
    return new ApiResponse(500, 'Failed to customize portfolio', {
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    }).send(res);
  }
});

// 5. Export Portfolio Files
export const exportPortfolio = asyncHandler(async (req, res) => {
  const { portfolioId } = req.params;
  const { format = 'zip' } = req.query;
  const userId = req.user?._id;

  if (!userId) {
    return new ApiResponse(401, 'Unauthorized').send(res);
  }

  const portfolio = await Portfolio.findOne({
    _id: portfolioId,
    user: userId,
  });

  if (!portfolio) {
    return new ApiResponse(404, 'Portfolio not found').send(res);
  }

  try {
    if (format === 'files') {
      // Return individual files as JSON
      return new ApiResponse(200, 'Portfolio files exported', {
        files: {
          'index.html': portfolio.template.html,
          'styles.css': portfolio.template.css,
          'script.js': portfolio.template.javascript,
          'README.md': generateReadmeFile(portfolio),
        },
        deployment: {
          instructions: generateDeploymentInstructions(),
          platforms: ['Netlify', 'Vercel', 'GitHub Pages', 'Firebase'],
        },
      }).send(res);
    } else {
      // For now, return files as JSON (implement ZIP generation later)
      return new ApiResponse(200, 'Portfolio export ready', {
        exportType: format,
        files: {
          'index.html': portfolio.template.html.length + ' characters',
          'styles.css': portfolio.template.css.length + ' characters',
          'script.js': portfolio.template.javascript.length + ' characters',
        },
        downloadUrl: `/api/portfolio/${portfolioId}/download`,
        note: 'Use format=files to get actual file contents',
      }).send(res);
    }
  } catch (error) {
    console.error('Portfolio export error:', error);
    return new ApiResponse(500, 'Failed to export portfolio', {
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    }).send(res);
  }
});

// 6. Regenerate Portfolio
export const regeneratePortfolio = asyncHandler(async (req, res) => {
  const { portfolioId } = req.params;
  const userId = req.user?._id;
  const newPreferences = req.body || {};

  if (!userId) {
    return new ApiResponse(401, 'Unauthorized').send(res);
  }

  const portfolio = await Portfolio.findOne({
    _id: portfolioId,
    user: userId,
  }).populate('resume');

  if (!portfolio) {
    return new ApiResponse(404, 'Portfolio not found').send(res);
  }

  try {
    console.log(`🔄 Regenerating portfolio ${portfolioId}`);
    const startTime = Date.now();

    // Merge existing preferences with new ones
    const preferences = {
      ...portfolio.generation.preferences,
      ...newPreferences,
    };

    // Regenerate all components
    const contentResult = await generatePortfolioContent(
      portfolio.resume.content.structured,
      preferences
    );

    const projectsResult = await enhanceProjectsForWeb(
      portfolio.resume.content.structured.projects,
      portfolio.resume.content.structured.skills.technical
    );

    const structureResult = await recommendSiteStructure(
      portfolio.resume.content.structured
    );
    const themeResult = await recommendVisualTheme(
      portfolio.resume.content.structured,
      structureResult.recommended,
      preferences
    );

    const templateResult = await generateWebsiteTemplate(
      contentResult.content,
      structureResult.recommended,
      themeResult.selected,
      portfolio.resume.content.structured
    );

    const processingTime = Date.now() - startTime;

    // Update portfolio
    portfolio.content = contentResult.content;
    portfolio.enhancedProjects = projectsResult.enhancedProjects;
    portfolio.structure = structureResult.recommended;
    portfolio.theme = themeResult.selected;
    portfolio.template = templateResult;
    portfolio.generation.preferences = preferences;
    portfolio.generation.lastRegeneratedAt = new Date();
    portfolio.generation.processingTime = processingTime;
    portfolio.status = 'regenerated';

    await portfolio.save();

    console.log(`✅ Portfolio regenerated in ${processingTime}ms`);

    return new ApiResponse(200, 'Portfolio regenerated successfully', {
      portfolio: {
        id: portfolio._id,
        status: portfolio.status,
        processingTime: processingTime,
        lastRegeneratedAt: portfolio.generation.lastRegeneratedAt,
      },
      changes: {
        contentUpdated: true,
        projectsEnhanced: projectsResult.enhancedCount > 0,
        themeChanged: portfolio.theme.name !== themeResult.selected.name,
        structureChanged:
          JSON.stringify(portfolio.structure) !==
          JSON.stringify(structureResult.recommended),
      },
      actions: {
        preview: `/api/portfolio/${portfolioId}/preview`,
        export: `/api/portfolio/${portfolioId}/export`,
      },
    }).send(res);
  } catch (error) {
    console.error('Portfolio regeneration error:', error);
    return new ApiResponse(500, 'Failed to regenerate portfolio', {
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    }).send(res);
  }
});

// 7. Get User's Portfolios
export const getUserPortfolios = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const { page = 1, limit = 10, status } = req.query;

  if (!userId) {
    return new ApiResponse(401, 'Unauthorized').send(res);
  }

  // Build query
  const query = { user: userId };
  if (status) {
    query.status = status;
  }

  const portfolios = await Portfolio.find(query)
    .populate('resume', 'title processing.status content.aiMetadata')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .select('-template'); // Exclude large template fields

  const total = await Portfolio.countDocuments(query);

  const portfoliosWithStats = portfolios.map((portfolio) => ({
    id: portfolio._id,
    title: portfolio.title,
    status: portfolio.status,
    isPublic: portfolio.isPublic,
    theme: {
      name: portfolio.theme.name,
      colorScheme: portfolio.theme.colors.primary,
    },
    structure: {
      type: portfolio.structure.type,
      sections: portfolio.structure.sections.length,
    },
    generation: {
      processingTime: portfolio.generation.processingTime,
      contentConfidence: portfolio.generation.contentConfidence,
      generatedAt: portfolio.generation.generatedAt,
    },
    resume: {
      id: portfolio.resume._id,
      title: portfolio.resume.title,
      confidence: portfolio.resume.content?.aiMetadata?.confidence,
    },
    createdAt: portfolio.createdAt,
    updatedAt: portfolio.updatedAt,
  }));

  return new ApiResponse(200, 'User portfolios retrieved successfully', {
    portfolios: portfoliosWithStats,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
    summary: {
      total,
      generated: portfoliosWithStats.filter((p) => p.status === 'generated')
        .length,
      customized: portfoliosWithStats.filter((p) => p.status === 'customized')
        .length,
      public: portfoliosWithStats.filter((p) => p.isPublic).length,
    },
  }).send(res);
});

// Helper Functions

// Generate README file for exported portfolio
const generateReadmeFile = (portfolio) => {
  return `# ${portfolio.title}

This is a professional portfolio website generated using AI-powered portfolio builder.

## 🚀 Quick Start

1. Open \`index.html\` in your web browser to preview locally
2. Upload all files to your hosting platform of choice

## 📁 File Structure

- \`index.html\` - Main HTML file
- \`styles.css\` - All styling and responsive design
- \`script.js\` - Interactive functionality and animations

## 🎨 Theme Information

- **Theme**: ${portfolio.theme.name}
- **Primary Color**: ${portfolio.theme.colors.primary}
- **Layout Type**: ${portfolio.structure.layout}

## 📱 Features

- Fully responsive design
- Modern CSS animations
- Smooth scrolling navigation
- Cross-browser compatibility
- SEO optimized

## 🌐 Deployment Options

### Netlify
1. Drag and drop the folder to Netlify
2. Your site will be live instantly

### Vercel
1. Install Vercel CLI: \`npm install -g vercel\`
2. Run \`vercel\` in the project folder
3. Follow the prompts

### GitHub Pages
1. Create a new repository
2. Upload files to the repository
3. Enable GitHub Pages in settings

## 🔧 Customization

Feel free to modify:
- Colors in \`styles.css\`
- Content in \`index.html\`
- Interactions in \`script.js\`

## 📊 Generation Stats

- Generated: ${portfolio.generation.generatedAt}
- Processing Time: ${portfolio.generation.processingTime}ms
- Content Confidence: ${portfolio.generation.contentConfidence}%

---

Generated with AI Portfolio Builder
`;
};

// Generate deployment instructions
const generateDeploymentInstructions = () => {
  return {
    netlify: {
      steps: [
        'Go to netlify.com and sign up/login',
        'Drag and drop your portfolio folder to the deploy area',
        'Your site will be live with a random URL',
        'Optional: Connect a custom domain in site settings',
      ],
      pros: ['Free hosting', 'Instant deployment', 'Custom domains'],
      estimatedTime: '2 minutes',
    },
    vercel: {
      steps: [
        'Install Vercel CLI: npm install -g vercel',
        "Run 'vercel' in your portfolio folder",
        'Follow the setup prompts',
        'Your site will be deployed automatically',
      ],
      pros: ['Great performance', 'Automatic HTTPS', 'Git integration'],
      estimatedTime: '3 minutes',
    },
    github_pages: {
      steps: [
        'Create a new GitHub repository',
        'Upload your portfolio files',
        'Go to repository Settings > Pages',
        'Select source branch and save',
      ],
      pros: ['Free with GitHub', 'Version control', 'Easy updates'],
      estimatedTime: '5 minutes',
    },
    firebase: {
      steps: [
        'Install Firebase CLI: npm install -g firebase-tools',
        "Run 'firebase login' and 'firebase init hosting'",
        "Deploy with 'firebase deploy'",
        'Access your site at the provided URL',
      ],
      pros: [
        'Google infrastructure',
        'Analytics integration',
        'Custom domains',
      ],
      estimatedTime: '10 minutes',
    },
  };
};
