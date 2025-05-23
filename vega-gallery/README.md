# Vega Gallery

A React-based visualization gallery and editor built with Vega-Lite. Create, customize, and explore data visualizations with an intuitive interface.

## Features

- Interactive chart gallery with filtering and search
- Visual chart editor with live preview
- Data transformation and curation tools
- Multiple chart types and encoding options
- Image data extraction using OCR
- Canvas-based dashboards with interactive and resizable charts
- Data lineage tracking for improved data provenance
- Sample dataset system with pre-loaded examples
- Responsive layout with customizable width settings
- Transformed dataset indicators

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

## Testing

The application includes a comprehensive test suite to ensure data validation, chart rendering, and storage functionality works correctly.

```bash
# Run all tests
npm test

# Run tests with coverage report
npm test -- --coverage
```

### Test Coverage

The test suite covers:

- **Data Validation**: Testing the validation of datasets before processing
- **Chart Rendering**: Testing the chart rendering pipeline with different data types
- **IndexedDB Storage**: Testing the persistence layer using IndexedDB

## Building

```bash
npm run build
```

## Tech Stack

- React 19
- TypeScript
- Vega-Lite for chart rendering
- Tesseract.js for OCR image processing
- Styled Components for styling
- IndexedDB for local data storage
- React useGesture for enhanced drag interactions

## Architecture

The application follows a component-based architecture with the following structure:

- `src/components`: React components
- `src/utils`: Utility functions for data processing and chart rendering
- `src/types`: TypeScript type definitions
- `src/charts`: Chart specification templates
- `src/constants`: Application constants

## Key Features

### Canvas Interaction System

The application features a completely reimplemented mouse handling system for chart interactions:

- Smooth chart dragging and resizing with memory-based positioning
- Touch-action support for better touch device compatibility
- Damping factors for natural-feeling movements
- useGesture integration for reliable drag handling and coordinate calculations

### Data Lineage Implementation

- Track data sources and transformations with detailed metadata
- "..." menu button for accessing chart data lineage
- Dialog system for viewing and editing data source information
- Visual indicators showing when charts have source information
- Persistent data lineage information in IndexedDB storage

### Sample Dataset System

- Auto-loading sample datasets for immediate user productivity
- Visual indicators for sample datasets to distinguish from user data
- Protection of sample datasets from accidental deletion
- "Update Samples" button to refresh sample datasets with latest versions

### UI Customization

- Layout width toggle (narrow, medium, wide) for overall application layout
- Chart width toggle (narrow, medium, wide) for individual chart display
- Improved table view with automatic display on chart selection
- Responsive design that adapts to different screen sizes

### Data Transformation

- Transform datasets with visual indicators to track changes
- Clear labeling of transformed datasets in all views
- Original dataset preservation with transformed copies

## Data Validation

Data is validated before being stored or rendered to ensure consistent chart outputs and prevent errors. The validation checks:

- Structural consistency (all objects have the same fields)
- Data type compatibility
- Presence of required fields for selected chart types

## Image Data Extraction

The application supports extracting data from images containing charts, tables, or text:

- **Client-side OCR**: Uses Tesseract.js for browser-based text recognition
- **Cloud API option**: Optional integration with Google Cloud Vision API for higher accuracy
- **Automatic data structuring**: Converts recognized text into structured data
- **Format detection**: Automatically detects table formats, CSVs, and plain text 