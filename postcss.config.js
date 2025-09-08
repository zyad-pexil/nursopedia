import autoprefixer from 'autoprefixer';

export default {
  plugins: [
    autoprefixer({
      grid: true,
      flexbox: 'no-2009'
    })
  ]
};