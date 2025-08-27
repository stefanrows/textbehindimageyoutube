# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React + Vite project for YouTube content creation, specifically focused on text behind image functionality. The project uses modern React 19 with Vite for development and build tooling.

## Development Commands

- `npm run dev` - Start the development server with hot module replacement
- `npm run build` - Build the production application 
- `npm run lint` - Run ESLint on the codebase
- `npm run preview` - Preview the production build locally

## Architecture

The project follows a standard Vite + React structure:

- `/src/main.jsx` - Application entry point with React 19's createRoot
- `/src/App.jsx` - Main application component
- `/src/App.css` and `/src/index.css` - Component and global styles
- `/public/` - Static assets served directly
- `/index.html` - HTML template with root div for React mounting

## Technology Stack

- **React 19** - Latest React with new features and improvements
- **Vite 7** - Fast build tool and development server
- **ESLint 9** - Linting with React hooks and refresh plugins
- **ES Modules** - Project uses `"type": "module"` in package.json

## ESLint Configuration

The project uses a modern ESLint flat config with:
- React hooks recommended rules
- React refresh plugin for Vite HMR
- Custom rule: unused vars allowed if they match pattern `^[A-Z_]`
- Browser globals enabled
- ECMAScript 2020+ features supported
- Update with the Current State of the Application. Check thoroughly