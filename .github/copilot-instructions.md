# Copilot Instructions

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

This is a Vue 3 component library project using Vite and TypeScript, designed for publishing to npm with the following characteristics:

## Project Structure
- Component library with multi-component support
- Tree-shaking and on-demand loading capabilities
- VitePress documentation
- TypeScript for type safety
- Build target: ES modules for modern bundlers

## Code Style Guidelines
- Use Composition API for Vue 3 components
- Follow TypeScript best practices
- Use kebab-case for component file names
- Export components individually for tree-shaking
- Provide proper TypeScript type definitions

## Library Architecture
- Main entry point exports all components
- Individual component exports for selective imports
- Proper build configuration for library mode
- Documentation with VitePress
