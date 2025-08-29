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
- **Real-time Canvas Manipulation**: Interactive drag-and-drop with Fabric.js
- **Smart Layer Management**: Unified background+subject groups with independent text layers
- **Export Options**: Multiple formats (PNG/JPEG/WebP) with quality presets for YouTube thumbnails
- **Undo/Redo System**: Full canvas state history with keyboard shortcuts
- **Responsive UI**: Clean, modern interface with status feedback

## Recent Updates

### Loading Spinner Fix (Latest)
- Fixed spinner animation that was stopping prematurely during background removal
- Integrated `isProcessing` state from `useBackgroundRemoval` hook with UI state
- Removed arbitrary timeouts that caused premature completion indicators
- Spinner now accurately reflects actual processing time

### State Management
- `processingState`: Tracks overall upload and processing flow ('idle' → 'uploading' → 'processing' → 'completed')
- `isProcessing`: From background removal hook, tracks actual AI processing
- Combined states ensure accurate loading feedback

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