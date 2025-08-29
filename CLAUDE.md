# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React + Vite project for YouTube content creation, specifically focused on text behind image functionality. The project uses modern React 19 with Vite for development and build tooling, featuring automatic background removal with AI and advanced text layering effects.

## Development Commands

- `npm run dev` - Start the development server with hot module replacement
- `npm run build` - Build the production application 
- `npm run lint` - Run ESLint on the codebase
- `npm run preview` - Preview the production build locally

**Note**: You don't need to manually start the dev server - the user handles this.

## Architecture

The project follows a standard Vite + React structure:

- `/src/main.jsx` - Application entry point with React 19's createRoot
- `/src/App.jsx` - Main application component with state management
- `/src/components/FabricCanvas.jsx` - Canvas component for image manipulation
- `/src/hooks/useBackgroundRemoval.js` - Custom hook for AI background removal
- `/src/components/ui/` - Reusable UI components (Button, Input, Select)
- `/src/App.css` and `/src/index.css` - Component and global styles
- `/public/` - Static assets served directly
- `/index.html` - HTML template with root div for React mounting

## Technology Stack

- **React 19** - Latest React with new features and improvements
- **Vite 7** - Fast build tool and development server
- **Fabric.js** - Canvas manipulation and layering system
- **@imgly/background-removal** - AI-powered background removal
- **Lucide React** - Icon library for UI components
- **ESLint 9** - Linting with React hooks and refresh plugins
- **Tailwind CSS** - Utility-first CSS framework
- **ES Modules** - Project uses `"type": "module"` in package.json

## Key Features

- **Automatic Background Removal**: AI-powered subject extraction from uploaded images
- **Text Behind Subject Effect**: Advanced layering system that places text behind the main subject
- **Smart Text Positioning**: Intelligent algorithm that automatically positions text to avoid subject overlap
- **Text Visibility System**: Golden glow effects, auto-selection, and visual indicators ensure text is never lost
- **Real-time Canvas Manipulation**: Interactive drag-and-drop with Fabric.js
- **Smart Layer Management**: Unified background+subject groups with independent text layers
- **Enhanced UI Feedback**: Context-aware notifications, tips, and positioning guidance
- **Export Options**: Multiple formats (PNG/JPEG/WebP) with quality presets for YouTube thumbnails
- **Undo/Redo System**: Full canvas state history with keyboard shortcuts
- **Responsive UI**: Clean, modern interface with comprehensive status feedback

## Recent Updates

### Text Visibility Improvements (Latest)
- **Smart Text Positioning**: Automatically calculates optimal text placement to avoid subject overlap using weighted safe zones
- **Visual Indicators**: Newly added text gets a golden glow effect for 3 seconds using Fabric.js Shadow system
- **Auto-Selection**: Text is automatically selected after being added, showing selection handles for immediate visibility
- **Enhanced UI Feedback**: Success notifications, context-aware tips, and smart positioning warnings
- **Better UX**: Clear instructions on text interaction modes and repositioning options

### Text Behind Subject System
- Advanced algorithm analyzes subject bounds and positions text in clear areas (top, bottom corners, sides)
- Uses distance-based scoring with zone weighting (top area preferred, fallback to bottom/sides)
- Graceful fallback to default positioning if bounds calculation fails
- Preserves all existing functionality while adding smart positioning

### Loading Spinner Fix
- Fixed spinner animation that was stopping prematurely during background removal
- Integrated `isProcessing` state from `useBackgroundRemoval` hook with UI state
- Removed arbitrary timeouts that caused premature completion indicators
- Spinner now accurately reflects actual processing time

### State Management
- `processingState`: Tracks overall upload and processing flow ('idle' → 'uploading' → 'processing' → 'completed')
- `isProcessing`: From background removal hook, tracks actual AI processing
- `textAddedNotification`: Manages text addition feedback and user guidance
- Combined states ensure accurate loading feedback and text visibility

## ESLint Configuration

The project uses a modern ESLint flat config with:
- React hooks recommended rules
- React refresh plugin for Vite HMR
- Custom rule: unused vars allowed if they match pattern `^[A-Z_]`
- Browser globals enabled
- ECMAScript 2020+ features supported

## Important Notes for Development

- Always run `npm run lint` and `npm run build` after making changes
- The app automatically processes uploaded images for background removal
- Loading states are carefully managed to provide accurate user feedback
- Canvas operations are asynchronous and require proper state synchronization