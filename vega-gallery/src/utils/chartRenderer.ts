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
 * 
 * Special handling is applied for:
 * 1. parallel-coordinates charts:
 *    - Use a line mark type with a fold transform
 *    - The filled property MUST be explicitly set to false
 * 
 * 2. wordcloud charts:
 *    - Use a text mark type with special encoding
 *    - Explicitly set alignment properties
 * 
 * @param element The HTML element to render the chart into
 * @param spec The ExtendedSpec to render
 * @param options Options for rendering (mode, style, etc.)
 */
export const renderVegaLite = async (
  element: HTMLElement, 
  spec: ExtendedSpec,
  options: RenderOptions = {}
) => {
  try {
    // Helper to determine if mark should be filled
    const shouldFillMark = (markType: string) => {
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
      (typeof spec.mark === 'object' && spec.mark.type === 'parallel-coordinates');

    // Check if we're dealing with a word cloud chart
    const isWordCloud = 
      (typeof spec.mark === 'string' && spec.mark === 'wordcloud') || 
      (typeof spec.mark === 'object' && spec.mark.type === 'wordcloud');

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
          { type: spec.mark };
      } else if (typeof spec.mark === 'object' && spec.mark.type) {
        renderedSpec.mark = shouldFillMark(spec.mark.type) ? 
          { ...spec.mark, filled: true } : 
          spec.mark;
      }
    }

    // Add schema, dimensions, etc.
    renderedSpec = {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      ...renderedSpec,
      width: renderedSpec.width || element.clientWidth || 600,
      height: renderedSpec.height || element.clientHeight || 400,
    };

    // Clean up incompatible properties for specific mark types
    const cleanupIncompatibleProperties = (spec: any) => {
      const markType = typeof spec.mark === 'string' ? spec.mark : spec.mark?.type;
      
      // For arc marks, remove incompatible encodings
      if (markType === 'arc' && spec.encoding) {
        const { size, ...restEncodings } = spec.encoding;
        spec.encoding = restEncodings;
      }
      
      return spec;
    };
    
    // Apply cleanup for incompatible properties
    renderedSpec = cleanupIncompatibleProperties(renderedSpec);

    await vegaEmbed(element, renderedSpec, {
      actions: false,
      renderer: 'svg',
      hover: true
    });

    // Apply visual effects after the chart is rendered
    applyVisualEffectsToSVG(element, options.style);

  } catch (error) {
    console.error('Error rendering chart:', error);
  }
}; 