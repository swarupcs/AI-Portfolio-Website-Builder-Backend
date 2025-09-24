// Theme definitions for different role types and color schemes
const THEMES = {
  // Developer themes
  'developer-dark-modern': {
    name: 'Dark Modern',
    description: 'Clean, modern dark theme perfect for developers',
    colors: {
      primary: '#6366f1', // Indigo
      secondary: '#8b5cf6', // Purple
      accent: '#06b6d4', // Cyan
      background: '#0f172a', // Dark slate
      surface: '#1e293b', // Slate 800
      text: '#f8fafc', // Slate 50
      textSecondary: '#cbd5e1', // Slate 300
    },
    typography: {
      primary: 'Inter, system-ui, sans-serif',
      code: 'JetBrains Mono, Monaco, Consolas, monospace',
      accent: 'Poppins, system-ui, sans-serif',
    },
    layout: 'code-focused',
    animations: 'subtle',
  },

  'developer-tech-blue': {
    name: 'Tech Blue',
    description: 'Professional blue theme with tech-focused aesthetics',
    colors: {
      primary: '#2563eb', // Blue 600
      secondary: '#1d4ed8', // Blue 700
      accent: '#06b6d4', // Cyan
      background: '#ffffff', // White
      surface: '#f8fafc', // Slate 50
      text: '#1e293b', // Slate 800
      textSecondary: '#64748b', // Slate 500
    },
    typography: {
      primary: 'Inter, system-ui, sans-serif',
      code: 'Fira Code, Monaco, Consolas, monospace',
      accent: 'Roboto, system-ui, sans-serif',
    },
    layout: 'code-focused',
    animations: 'smooth',
  },

  // Designer themes
  'designer-creative-vibrant': {
    name: 'Creative Vibrant',
    description: 'Bold, colorful theme showcasing creative work',
    colors: {
      primary: '#ec4899', // Pink 500
      secondary: '#f59e0b', // Amber 500
      accent: '#8b5cf6', // Purple 500
      background: '#ffffff', // White
      surface: '#fef7ff', // Purple 25
      text: '#1f2937', // Gray 800
      textSecondary: '#6b7280', // Gray 500
    },
    typography: {
      primary: 'Poppins, system-ui, sans-serif',
      code: 'Source Code Pro, monospace',
      accent: 'Playfair Display, serif',
    },
    layout: 'visual-heavy',
    animations: 'dynamic',
  },

  'designer-minimal-elegant': {
    name: 'Minimal Elegant',
    description: 'Clean, sophisticated theme emphasizing visual content',
    colors: {
      primary: '#374151', // Gray 700
      secondary: '#6b7280', // Gray 500
      accent: '#d97706', // Amber 600
      background: '#ffffff', // White
      surface: '#f9fafb', // Gray 50
      text: '#111827', // Gray 900
      textSecondary: '#6b7280', // Gray 500
    },
    typography: {
      primary: 'Inter, system-ui, sans-serif',
      code: 'SF Mono, Monaco, monospace',
      accent: 'Merriweather, serif',
    },
    layout: 'visual-heavy',
    animations: 'elegant',
  },

  // Business themes
  'business-corporate-blue': {
    name: 'Corporate Blue',
    description: 'Professional corporate theme for business professionals',
    colors: {
      primary: '#1e40af', // Blue 800
      secondary: '#3b82f6', // Blue 500
      accent: '#059669', // Emerald 600
      background: '#ffffff', // White
      surface: '#f8fafc', // Slate 50
      text: '#1e293b', // Slate 800
      textSecondary: '#475569', // Slate 600
    },
    typography: {
      primary: 'Roboto, system-ui, sans-serif',
      code: 'Roboto Mono, monospace',
      accent: 'Lora, serif',
    },
    layout: 'professional-clean',
    animations: 'professional',
  },

  'business-modern-green': {
    name: 'Modern Green',
    description: 'Fresh, modern theme with growth-focused green accents',
    colors: {
      primary: '#065f46', // Emerald 800
      secondary: '#059669', // Emerald 600
      accent: '#d97706', // Amber 600
      background: '#ffffff', // White
      surface: '#ecfdf5', // Emerald 50
      text: '#1f2937', // Gray 800
      textSecondary: '#4b5563', // Gray 600
    },
    typography: {
      primary: 'Open Sans, system-ui, sans-serif',
      code: 'Source Code Pro, monospace',
      accent: 'Montserrat, sans-serif',
    },
    layout: 'professional-clean',
    animations: 'smooth',
  },

  // General themes
  'general-professional-navy': {
    name: 'Professional Navy',
    description: 'Versatile professional theme suitable for any role',
    colors: {
      primary: '#1e3a8a', // Blue 900
      secondary: '#3b82f6', // Blue 500
      accent: '#f59e0b', // Amber 500
      background: '#ffffff', // White
      surface: '#f1f5f9', // Slate 100
      text: '#0f172a', // Slate 900
      textSecondary: '#475569', // Slate 600
    },
    typography: {
      primary: 'System UI, -apple-system, sans-serif',
      code: 'Monaco, Consolas, monospace',
      accent: 'Georgia, serif',
    },
    layout: 'professional-clean',
    animations: 'subtle',
  },

  'general-warm-neutral': {
    name: 'Warm Neutral',
    description: 'Welcoming, approachable theme with warm undertones',
    colors: {
      primary: '#92400e', // Amber 800
      secondary: '#d97706', // Amber 600
      accent: '#dc2626', // Red 600
      background: '#fffbeb', // Amber 50
      surface: '#ffffff', // White
      text: '#1c1917', // Stone 900
      textSecondary: '#57534e', // Stone 600
    },
    typography: {
      primary: 'Nunito, system-ui, sans-serif',
      code: 'Inconsolata, monospace',
      accent: 'Crimson Text, serif',
    },
    layout: 'professional-clean',
    animations: 'warm',
  },
};

// Theme selection logic
export const selectTheme = (roleType, colorScheme = null) => {
  // Define theme mappings based on role and color scheme
  const themeMap = {
    developer: {
      'dark-modern': 'developer-dark-modern',
      'tech-blue': 'developer-tech-blue',
      default: 'developer-dark-modern',
    },
    designer: {
      'creative-vibrant': 'designer-creative-vibrant',
      'minimal-elegant': 'designer-minimal-elegant',
      default: 'designer-creative-vibrant',
    },
    business: {
      'corporate-blue': 'business-corporate-blue',
      'modern-green': 'business-modern-green',
      default: 'business-corporate-blue',
    },
    general: {
      'professional-navy': 'general-professional-navy',
      'warm-neutral': 'general-warm-neutral',
      default: 'general-professional-navy',
    },
  };

  // Get theme key based on role and color scheme
  const roleThemes = themeMap[roleType] || themeMap.general;
  let themeKey;

  if (colorScheme && roleThemes[colorScheme]) {
    themeKey = roleThemes[colorScheme];
  } else {
    themeKey = roleThemes.default;
  }

  // Return theme with generated CSS variables
  const theme = { ...THEMES[themeKey] };
  theme.cssVariables = generateCSSVariables(theme);

  return theme;
};

// Generate CSS custom properties from theme colors
export const generateCSSVariables = (theme) => {
  const variables = {};

  // Color variables
  Object.entries(theme.colors).forEach(([key, value]) => {
    variables[`--color-${key}`] = value;

    // Generate RGB values for opacity usage
    const rgb = hexToRgb(value);
    if (rgb) {
      variables[`--color-${key}-rgb`] = `${rgb.r}, ${rgb.g}, ${rgb.b}`;
    }
  });

  // Typography variables
  variables['--font-primary'] = theme.typography.primary;
  variables['--font-code'] = theme.typography.code;
  variables['--font-accent'] = theme.typography.accent;

  return variables;
};

// Get all available themes for a specific role
export const getThemesForRole = (roleType) => {
  const roleThemes = [];

  Object.entries(THEMES).forEach(([key, theme]) => {
    if (key.startsWith(roleType) || key.startsWith('general')) {
      roleThemes.push({
        key,
        ...theme,
        cssVariables: generateCSSVariables(theme),
      });
    }
  });

  return roleThemes;
};

// Get theme by specific key
export const getThemeByKey = (themeKey) => {
  const theme = THEMES[themeKey];
  if (!theme) {
    console.warn(`Theme '${themeKey}' not found, falling back to default`);
    return selectTheme('general');
  }

  return {
    ...theme,
    cssVariables: generateCSSVariables(theme),
  };
};

// Generate theme-specific CSS classes
export const generateThemeCSS = (theme) => {
  const { colors, typography, animations } = theme;

  return `
      :root {
        ${Object.entries(generateCSSVariables(theme))
          .map(([key, value]) => `${key}: ${value};`)
          .join('\n      ')}
      }
  
      /* Base styles */
      body {
        font-family: var(--font-primary);
        color: var(--color-text);
        background-color: var(--color-background);
        line-height: 1.6;
      }
  
      /* Typography */
      h1, h2, h3, h4, h5, h6 {
        font-family: var(--font-accent);
        color: var(--color-text);
        line-height: 1.2;
      }
  
      code, pre {
        font-family: var(--font-code);
      }
  
      /* Color classes */
      .text-primary { color: var(--color-primary); }
      .text-secondary { color: var(--color-secondary); }
      .text-accent { color: var(--color-accent); }
      .text-muted { color: var(--color-textSecondary); }
  
      .bg-primary { background-color: var(--color-primary); }
      .bg-secondary { background-color: var(--color-secondary); }
      .bg-accent { background-color: var(--color-accent); }
      .bg-surface { background-color: var(--color-surface); }
  
      /* Animation classes based on theme */
      ${generateAnimationCSS(animations)}
  
      /* Button styles */
      .btn-primary {
        background-color: var(--color-primary);
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 0.5rem;
        font-weight: 600;
        transition: all 0.2s;
      }
  
      .btn-primary:hover {
        background-color: var(--color-secondary);
        transform: translateY(-2px);
      }
  
      .btn-outline {
        background-color: transparent;
        color: var(--color-primary);
        border: 2px solid var(--color-primary);
        padding: 0.75rem 1.5rem;
        border-radius: 0.5rem;
        font-weight: 600;
        transition: all 0.2s;
      }
  
      .btn-outline:hover {
        background-color: var(--color-primary);
        color: white;
      }
  
      /* Card styles */
      .card {
        background-color: var(--color-surface);
        border-radius: 1rem;
        padding: 2rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        transition: all 0.3s;
      }
  
      .card:hover {
        transform: translateY(-4px);
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      }
  
      /* Navigation styles */
      .nav-link {
        color: var(--color-textSecondary);
        text-decoration: none;
        font-weight: 500;
        transition: color 0.2s;
      }
  
      .nav-link:hover,
      .nav-link.active {
        color: var(--color-primary);
      }
    `;
};

// Generate animation CSS based on animation type
const generateAnimationCSS = (animationType) => {
  const animations = {
    subtle: `
        .fade-in {
          animation: fadeIn 0.6s ease-out;
        }
        
        .slide-up {
          animation: slideUp 0.8s ease-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
      `,

    smooth: `
        .smooth-scale {
          animation: smoothScale 1s ease-out;
        }
        
        .smooth-fade {
          animation: smoothFade 1.2s ease-out;
        }
        
        @keyframes smoothScale {
          from { 
            opacity: 0;
            transform: scale(0.9);
          }
          to { 
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes smoothFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `,

    dynamic: `
        .bounce-in {
          animation: bounceIn 1s ease-out;
        }
        
        .slide-rotate {
          animation: slideRotate 1.2s ease-out;
        }
        
        @keyframes bounceIn {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes slideRotate {
          from {
            opacity: 0;
            transform: translateX(-100px) rotate(-10deg);
          }
          to {
            opacity: 1;
            transform: translateX(0) rotate(0deg);
          }
        }
      `,

    elegant: `
        .elegant-fade {
          animation: elegantFade 1.5s ease-out;
        }
        
        .elegant-slide {
          animation: elegantSlide 1.8s ease-out;
        }
        
        @keyframes elegantFade {
          from { 
            opacity: 0;
            transform: translateY(30px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes elegantSlide {
          from {
            opacity: 0;
            transform: translateX(40px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `,

    professional: `
        .professional-fade {
          animation: professionalFade 0.8s ease-out;
        }
        
        @keyframes professionalFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `,

    warm: `
        .warm-glow {
          animation: warmGlow 1s ease-out;
        }
        
        .warm-slide {
          animation: warmSlide 1.2s ease-out;
        }
        
        @keyframes warmGlow {
          from {
            opacity: 0;
            filter: brightness(1.2);
          }
          to {
            opacity: 1;
            filter: brightness(1);
          }
        }
        
        @keyframes warmSlide {
          from {
            opacity: 0;
            transform: translateY(25px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `,
  };

  return animations[animationType] || animations.subtle;
};

// Helper function to convert hex to RGB
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

// Get theme recommendations based on analysis
export const getThemeRecommendations = (analysis) => {
  const { roleType, experienceLevel, industries } = analysis;

  const recommendations = [];

  // Primary recommendation based on role
  const primaryTheme = selectTheme(roleType);
  recommendations.push({
    theme: primaryTheme,
    reason: `Optimized for ${roleType} professionals`,
    confidence: 90,
  });

  // Alternative recommendations
  if (roleType === 'developer') {
    const altTheme = getThemeByKey('developer-tech-blue');
    recommendations.push({
      theme: altTheme,
      reason: 'Professional alternative with clean aesthetics',
      confidence: 75,
    });
  }

  if (roleType === 'designer') {
    const altTheme = getThemeByKey('designer-minimal-elegant');
    recommendations.push({
      theme: altTheme,
      reason: 'Elegant minimal approach for sophisticated portfolios',
      confidence: 80,
    });
  }

  // Industry-specific recommendations
  if (industries.includes('finance') || industries.includes('consulting')) {
    const corpTheme = getThemeByKey('business-corporate-blue');
    recommendations.push({
      theme: corpTheme,
      reason: 'Conservative and professional for corporate industries',
      confidence: 85,
    });
  }

  return recommendations.slice(0, 3); // Return top 3 recommendations
};

// Export theme service
export const themeService = {
  selectTheme,
  generateCSSVariables,
  getThemesForRole,
  getThemeByKey,
  generateThemeCSS,
  getThemeRecommendations,
};
