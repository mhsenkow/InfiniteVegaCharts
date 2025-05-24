const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Define patterns and their replacements
const replacements = [
  // Direct access pattern for colors
  {
    pattern: /\$\{props\.theme\.colors\.([a-zA-Z.]+)\}/g,
    replacement: (match, property) => {
      // Convert nested properties like text.primary to text-primary
      const cssVar = property.replace(/\./g, '-');
      return `var(--color-${cssVar})`;
    }
  },
  // Function pattern with ternary for colors
  {
    pattern: /\$\{props => props\.theme\.colors\.([a-zA-Z.]+)\}/g,
    replacement: (match, property) => {
      // Convert nested properties like text.primary to text-primary
      const cssVar = property.replace(/\./g, '-');
      return `var(--color-${cssVar})`;
    }
  },
  // Complex pattern with color + opacity
  {
    pattern: /\$\{props => `\$\{props\.theme\.colors\.([a-zA-Z.]+)\}([0-9]+)`\}/g,
    replacement: (match, property, opacity) => {
      // Convert nested properties like text.primary to text-primary
      const cssVar = property.replace(/\./g, '-');
      return `rgba(var(--color-${cssVar}-rgb), 0.${opacity})`;
    }
  },
  // Direct access pattern for text (incorrect usage)
  {
    pattern: /\$\{props\.theme\.text\.([a-zA-Z.]+)\}/g,
    replacement: (match, property) => {
      return `var(--color-text-${property})`;
    }
  },
  // Function pattern with ternary for text (incorrect usage)
  {
    pattern: /\$\{props => props\.theme\.text\.([a-zA-Z.]+)\}/g,
    replacement: (match, property) => {
      return `var(--color-text-${property})`;
    }
  },
  // Direct access pattern for spacing
  {
    pattern: /\$\{props\.theme\.spacing\.([a-zA-Z.]+)\}/g,
    replacement: (match, property) => {
      return `var(--spacing-${property})`;
    }
  },
  // Function pattern for spacing
  {
    pattern: /\$\{props => props\.theme\.spacing\.([a-zA-Z.]+)\}/g,
    replacement: (match, property) => {
      return `var(--spacing-${property})`;
    }
  },
  // Direct access pattern for transitions
  {
    pattern: /\$\{props\.theme\.transitions\.([a-zA-Z.]+)\}/g,
    replacement: (match, property) => {
      return `var(--transition-${property})`;
    }
  },
  // Function pattern for transitions
  {
    pattern: /\$\{props => props\.theme\.transitions\.([a-zA-Z.]+)\}/g,
    replacement: (match, property) => {
      return `var(--transition-${property})`;
    }
  },
  // Direct access pattern for typography
  {
    pattern: /\$\{props\.theme\.typography\.([a-zA-Z.]+)\.([a-zA-Z.]+)\}/g,
    replacement: (match, category, value) => {
      return `var(--typography-${category}-${value})`;
    }
  },
  // Function pattern for typography
  {
    pattern: /\$\{props => props\.theme\.typography\.([a-zA-Z.]+)\.([a-zA-Z.]+)\}/g,
    replacement: (match, category, value) => {
      return `var(--typography-${category}-${value})`;
    }
  },
  // Direct access pattern for borderRadius
  {
    pattern: /\$\{props\.theme\.borderRadius\.([a-zA-Z.]+)\}/g,
    replacement: (match, property) => {
      return `var(--border-radius-${property})`;
    }
  },
  // Function pattern for borderRadius
  {
    pattern: /\$\{props => props\.theme\.borderRadius\.([a-zA-Z.]+)\}/g,
    replacement: (match, property) => {
      return `var(--border-radius-${property})`;
    }
  }
];

// Recursively find all .ts and .tsx files
const findFiles = (directory) => {
  return glob.sync(path.join(directory, '**/*.{ts,tsx}'), {
    ignore: ['**/node_modules/**', '**/build/**', '**/dist/**']
  });
};

// Process a single file
const processFile = (filePath) => {
  console.log(`Processing ${filePath}...`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let hasChanges = false;
  
  // Apply each replacement pattern
  for (const { pattern, replacement } of replacements) {
    const originalContent = content;
    content = content.replace(pattern, replacement);
    
    if (content !== originalContent) {
      hasChanges = true;
    }
  }
  
  // If there were changes, write the file back
  if (hasChanges) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
};

// Main function
const main = () => {
  const directory = process.argv[2] || '.';
  const files = findFiles(directory);
  
  console.log(`Found ${files.length} files to process`);
  
  files.forEach(processFile);
  
  console.log('Done!');
};

main(); 