import autoprefixer from 'autoprefixer';

// Tailwind v4 + modern browsers don't need legacy grid translations.
export default {
  plugins: [
    autoprefixer({
      grid: false
    })
  ]
};