# lone-format

A Vue 3 component library for formatting with tree-shaking support.

## Features

- 🎨 **Multiple Themes**: GitHub Light, GitHub Dark, Min Light, Slack Ochin
- 🚀 **Performance Optimized**: Shallow copy strategy for better performance
- 📦 **Tree Shaking**: Import only what you need
- 🔧 **TypeScript**: Full TypeScript support with type definitions
- 📖 **VitePress Documentation**: Comprehensive documentation with examples

## Installation

```bash
npm install lone-format
```

## Quick Start

```vue
<template>
  <JsonFormat 
    v-model="jsonData"
    :readonly="false"
  />
</template>

<script setup>
import { ref } from 'vue'
import { JsonFormat } from 'lone-format'

const jsonData = ref('{"hello": "world"}')
</script>
```

## Documentation

Visit our [documentation site](https://lonisletend.github.io/lone-format/) for detailed guides and examples.

## Automated Publishing

This project uses an automated CI/CD pipeline that:

- 🔄 **Auto-versioning**: Bumps version based on commit messages
- 📦 **Auto-publishing**: Publishes to npm when code is pushed to `publish` branch  
- 🔀 **Auto-merging**: Merges `publish` branch to `main` after successful publish

### Usage

```bash
# Create feature on publish branch
git checkout -b publish
git add .
git commit -m "feat: add new feature"  # Will bump minor version
git push origin publish  # Triggers auto-publish
```

See [PIPELINE.md](./PIPELINE.md) for detailed setup instructions.

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build library
npm run build:lib

# Build documentation
npm run docs:build
```

## License

MIT
