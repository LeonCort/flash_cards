# Flashcards App

A modern flashcards web application built for children to learn words with tracking and analytics. Features a word dictionary, performance tracking, and gamified learning experience.

## Features

- 📚 **Word Dictionary**: Add and manage words for learning
- ⏱️ **Performance Tracking**: Track time-to-identify and correctness per word
- 🎯 **Rounds Mode**: Set number of rounds and time thresholds for completion
- 📊 **High Scores**: Dynamic per-word statistics and achievements
- 🔄 **Reset Functionality**: Reset results while keeping dictionary intact
- 👶 **Child-Friendly UI**: Designed specifically for young learners

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Convex (real-time database and functions)
- **Styling**: Tailwind CSS + Radix UI components
- **Build Tool**: Vite with HMR

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Convex account (sign up at [convex.dev](https://convex.dev))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/LeonCort/flash_cards.git
   cd flash_cards
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Convex**
   ```bash
   npx convex dev
   ```
   Follow the prompts to create a new Convex project or link to an existing one.

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

### Environment Variables

Create a `.env.local` file in the root directory:
```env
VITE_CONVEX_URL=your_convex_deployment_url
```

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Convex Functions

The app uses several Convex functions for data management:
- **words.ts**: Manage word dictionary (add, list, delete)
- **attempts.ts**: Track learning attempts and performance
- **rounds.ts**: Handle round-based gameplay
- **schema.ts**: Database schema definitions

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
