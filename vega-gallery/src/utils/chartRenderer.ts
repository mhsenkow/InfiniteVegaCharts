import { TopLevelSpec as VegaLiteSpec } from 'vega-lite'
import { Spec as VegaSpec } from 'vega'
import vegaEmbed, { EmbedOptions, Config } from 'vega-embed'
import { ChartStyle } from '../types/chart'
import { ExtendedSpec, MarkType } from '../types/vega'

interface RenderOptions {
  mode?: 'gallery' | 'editor';
  style?: Partial<ChartStyle>;
}

// Function to apply visual effects directly to SVG elements
const applyVisualEffectsToSVG = (element: HTMLElement, style?: Partial<ChartStyle>) => {
  if (!style) return;

  const svg = element.querySelector('svg');
  if (!svg) return;

  // Apply glow effect
  if (style.marks?.glowRadius) {
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    filter.setAttribute('id', 'glow');
    
    const feGaussianBlur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
    feGaussianBlur.setAttribute('stdDeviation', style.marks.glowRadius.toString());
    feGaussianBlur.setAttribute('result', 'coloredBlur');
    
    const feMerge = document.createElementNS('http://www.w3.org/2000/svg', 'feMerge');
    const feMergeNode1 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
    feMergeNode1.setAttribute('in', 'coloredBlur');
    const feMergeNode2 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
    feMergeNode2.setAttribute('in', 'SourceGraphic');
    
    feMerge.appendChild(feMergeNode1);
    feMerge.appendChild(feMergeNode2);
    filter.appendChild(feGaussianBlur);
    filter.appendChild(feMerge);
    defs.appendChild(filter);
    svg.appendChild(defs);

    // Apply filter to marks
    const marks = svg.querySelectorAll('.mark-symbol path, .mark-circle path');
    marks.forEach(mark => {
      mark.setAttribute('filter', 'url(#glow)');
      if (style.marks?.glowColor) {
        mark.setAttribute('stroke', style.marks.glowColor);
      }
    });
  }

  // Apply drop shadow
  if (style.marks?.shadowRadius) {
    const defs = svg.querySelector('defs') || document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    filter.setAttribute('id', 'shadow');
    
    const feDropShadow = document.createElementNS('http://www.w3.org/2000/svg', 'feDropShadow');
    feDropShadow.setAttribute('dx', '0');
    feDropShadow.setAttribute('dy', '4');
    feDropShadow.setAttribute('stdDeviation', style.marks.shadowRadius.toString());
    
    filter.appendChild(feDropShadow);
    defs.appendChild(filter);
    if (!svg.querySelector('defs')) {
      svg.appendChild(defs);
    }

    const marks = svg.querySelectorAll('.mark-symbol path, .mark-circle path');
    marks.forEach(mark => {
      mark.setAttribute('filter', 'url(#shadow)');
    });
  }

  // Apply blur effect
  if (style.marks?.blur) {
    const defs = svg.querySelector('defs') || document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    filter.setAttribute('id', 'blur');
    
    const feGaussianBlur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
    feGaussianBlur.setAttribute('stdDeviation', style.marks.blur.toString());
    
    filter.appendChild(feGaussianBlur);
    defs.appendChild(filter);
    if (!svg.querySelector('defs')) {
      svg.appendChild(defs);
    }

    const marks = svg.querySelectorAll('.mark-symbol path, .mark-circle path');
    marks.forEach(mark => {
      mark.setAttribute('filter', 'url(#blur)');
    });
  }

  // Apply gradient background
  if (style.view?.gradientType !== 'none' && style.view?.gradientStart && style.view?.gradientEnd) {
    const defs = svg.querySelector('defs') || document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const gradient = document.createElementNS('http://www.w3.org/2000/svg', 
      style.view.gradientType === 'linear' ? 'linearGradient' : 'radialGradient'
    );
    gradient.setAttribute('id', 'background-gradient');
    
    const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop1.setAttribute('offset', '0%');
    stop1.setAttribute('stop-color', style.view.gradientStart);
    
    const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop2.setAttribute('offset', '100%');
    stop2.setAttribute('stop-color', style.view.gradientEnd);
    
    gradient.appendChild(stop1);
    gradient.appendChild(stop2);
    defs.appendChild(gradient);
    if (!svg.querySelector('defs')) {
      svg.appendChild(defs);
    }

    // Add background rect
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('width', '100%');
    rect.setAttribute('height', '100%');
    rect.setAttribute('fill', 'url(#background-gradient)');
    svg.insertBefore(rect, svg.firstChild);
  }
};

const applyChartStyles = (spec: VegaLiteSpec | VegaSpec, style?: Partial<ChartStyle>) => {
  if (!style) return spec;

  // Create a base config that will work with Vega-Lite
  const config = {
    axis: {
      // Axis styling
      tickOpacity: style.axis?.tickOpacity,
      domain: true,
      domainColor: style.axis?.baselineColor,
      domainWidth: style.axis?.baselineWidth,
      domainOpacity: style.axis?.baselineOpacity,
    },
    view: {
      // View styling
      fill: style.view?.backgroundColor,
      fillOpacity: style.view?.backgroundOpacity,
      padding: style.view?.padding,
    },
    title: {
      fontSize: style.legend?.titleFontSize
    },
    legend: {
      labelFontSize: style.legend?.labelFontSize
    }
  };

  return {
    ...spec,
    config: {
      ...spec.config,
      ...config
    }
  };
};

/**
 * Renders a Vega-Lite specification into the provided element.
 * This function takes extra care to safely manipulate the DOM and avoid 
 * conflicts with React's virtual DOM.
 */
export const renderVegaLite = async (
  element: HTMLElement, 
  spec: ExtendedSpec,
  options: RenderOptions = {}
) => {
  if (!spec) {
    console.error('Chart specification is undefined or null');
    throw new Error('Chart specification is missing');
  }

  if (!element) {
    console.error('Target element is null or undefined');
    throw new Error('Target element is missing');
  }

  // Check if element is still in the document
  if (!document.body.contains(element)) {
    console.error('Target element is not in the document');
    throw new Error('Target element is not in the document');
  }

  try {
    // Check if the spec is a Vega (not Vega-Lite) spec
    const isVegaSpec = !!(spec.$schema && spec.$schema.includes('vega.github.io/schema/vega'));
    
    // Create a safely typed spec for rendering
    let renderedSpec: any;
    
    if (isVegaSpec) {
      renderedSpec = { ...spec };
      
      // If it's a Vega spec, just render it directly
      const embedOptions: EmbedOptions = {
        renderer: 'svg',
        actions: false,
        defaultStyle: false // Let React handle the styling
      };
      
      console.log('Rendering Vega spec');
      // Cast the spec to any to bypass type checking for Vega vs Vega-Lite
      const result = await vegaEmbed(element, spec as any, embedOptions);
      
      if (options.style) {
        applyVisualEffectsToSVG(element, options.style);
      }
      
      return result.view; // Return the view directly for Vega specs
    }
    
    // Process the spec for Vega-Lite
    renderedSpec = processVegaLiteSpec(spec);
    
    // Make sure all required configuration is set
    const embedOptions: EmbedOptions = {
      actions: false,
      renderer: 'svg',
      hover: true,
      defaultStyle: false // Let React handle the styling
    };

    // Log the spec for debugging
    console.log('Rendering Vega-Lite spec');

    // Clear any existing content first to prevent conflicts
    // But only if it's safe to do so (element is in the document)
    if (element.children.length > 0) {
      console.log('Clearing existing content before rendering');
      
      // Instead of innerHTML which can cause React conflicts,
      // we'll just replace the content with a single div
      const placeholder = document.createElement('div');
      placeholder.style.width = '100%';
      placeholder.style.height = '100%';
      
      // Clear existing content safely
      while (element.firstChild) {
        element.removeChild(element.firstChild);
      }
      
      element.appendChild(placeholder);
    }

    // Return the view instance to allow for snapshot creation
    const vegaResult = await vegaEmbed(element, renderedSpec, embedOptions);
    
    if (!vegaResult || !vegaResult.view) {
      console.error('Failed to create Vega view. vegaEmbed result:', vegaResult);
      throw new Error('Failed to create Vega view');
    }
    
    console.log('Vega view created successfully');

    // Apply visual effects after the chart is rendered
    if (options.style) {
      applyVisualEffectsToSVG(element, options.style);
    }
    
    return vegaResult.view;
  } catch (error) {
    console.error('Error rendering chart:', error);
    // Display error message in the container
    try {
      element.innerHTML = `<div style="color: red; padding: 16px; text-align: center;">
        Error rendering chart: ${error instanceof Error ? error.message : 'Unknown error'}
      </div>`;
    } catch (e) {
      console.error('Failed to display error message:', e);
    }
    throw error;
  }
};

/**
 * Process a Vega-Lite specification to handle special chart types and ensure
 * all required properties are set correctly.
 */
const processVegaLiteSpec = (spec: ExtendedSpec): any => {
  // Helper to determine if mark should be filled
  const shouldFillMark = (markType: string | undefined) => {
    if (!markType) return false;
    
    const filledMarks = ['bar', 'arc', 'area', 'rect', 'square'];
    const nonFilledMarks = ['line', 'point', 'circle', 'text', 'parallel-coordinates', 'wordcloud'];
    
    if (nonFilledMarks.includes(markType)) {
      return false;
    }
    
    return filledMarks.includes(markType);
  };

  // Check if we're dealing with a parallel coordinates chart
  const isParallelCoordinates = 
    (typeof spec.mark === 'string' && spec.mark === 'parallel-coordinates') || 
    (typeof spec.mark === 'object' && spec.mark?.type === 'parallel-coordinates');

  // Check if we're dealing with a word cloud chart
  const isWordCloud = 
    (typeof spec.mark === 'string' && spec.mark === 'wordcloud') || 
    (typeof spec.mark === 'object' && spec.mark?.type === 'wordcloud');

  let renderedSpec: any = { ...spec };

  // Make a deep copy of the spec to avoid mutation issues
  if (isParallelCoordinates) {
    // For parallel coordinates, we need to ensure we use a line mark type
    renderedSpec = { 
      ...spec,
      mark: { 
        type: 'line', 
        opacity: 0.5,
        filled: false 
      }
    };
  } else if (isWordCloud) {
    // For word cloud, we need to ensure we use a text mark type
    renderedSpec = {
      ...spec,
      mark: {
        type: 'text',
        baseline: 'middle',
        align: 'center'
      }
    };
  } else {
    // Process mark configuration for other chart types
    const markType = typeof spec.mark === 'string' ? spec.mark : spec.mark?.type;
    
    if (typeof spec.mark === 'string') {
      renderedSpec.mark = shouldFillMark(spec.mark) ? 
        { type: spec.mark, filled: true } : 
        { type: spec.mark, filled: false };
    } else if (typeof spec.mark === 'object' && spec.mark?.type) {
      // Ensure 'filled' property is always set
      renderedSpec.mark = {
        ...spec.mark,
        filled: shouldFillMark(spec.mark.type)
      };
    } else {
      // Default mark if none is specified
      console.warn('Chart specification is missing a mark type, using a default');
      renderedSpec.mark = { type: 'point', filled: false };
    }
  }

  // Add schema, dimensions, etc.
  renderedSpec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    ...renderedSpec,
    width: 'container',
    height: 'container',
    autosize: {
      type: 'fit',
      contains: 'padding'
    }
  };

  // Clean up incompatible properties for specific mark types
  const markType = typeof renderedSpec.mark === 'string' ? 
    renderedSpec.mark : renderedSpec.mark?.type;
  
  // For arc marks, remove incompatible encodings
  if (markType === 'arc' && renderedSpec.encoding) {
    const { size, ...restEncodings } = renderedSpec.encoding;
    renderedSpec.encoding = restEncodings;
  }
  
  return renderedSpec;
};

/**
 * Create a snapshot of the chart as a PNG image
 * 
 * @param view The Vega View instance
 * @returns A promise that resolves to a base64-encoded PNG image
 */
export const createSnapshot = async (view: any): Promise<string> => {
  if (!view) {
    console.error('Cannot create snapshot: View is undefined or null');
    throw new Error('View is undefined or null');
  }
  
  if (!view.toCanvas || typeof view.toCanvas !== 'function') {
    console.error('Invalid view object provided to createSnapshot:', view);
    throw new Error('Invalid Vega view: missing toCanvas method');
  }
  
  try {
    console.log('Creating snapshot from Vega view...');
    
    // Create a PNG snapshot
    const canvas = await view.toCanvas();
    
    if (!canvas) {
      throw new Error('Failed to create canvas from view');
    }
    
    // Convert canvas to data URL
    const dataUrl = canvas.toDataURL('image/png');
    console.log('Snapshot created successfully');
    
    return dataUrl;
  } catch (error) {
    console.error('Error creating snapshot:', error);
    throw new Error(`Failed to create snapshot: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Helper function to validate a chart specification
 * 
 * @param spec The chart specification to validate
 * @returns A boolean indicating whether the spec is valid
 */
export const validateSpec = (spec: any): boolean => {
  if (!spec) return false;
  
  // Check for required properties
  if (!spec.mark && !spec.layer && !spec.hconcat && !spec.vconcat) {
    return false;
  }
  
  // If it has a mark, check that it's valid
  if (spec.mark && 
    typeof spec.mark !== 'string' && 
    typeof spec.mark !== 'object') {
    return false;
  }
  
  return true;
}; 