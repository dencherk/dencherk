/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './privacy.html', './404.html', './js/**/*.js'],
  theme: {
    extend: {
      colors: {
        ink: '#181818',
        surface: '#1F1F1F',
        'surface-2': '#272727',
        line: '#313131',
        muted: '#9B9B9B',
        paper: '#FFFFFF',
        black: '#000000',
        cream: '#131209'
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif']
      },
      maxWidth: {
        content: '680px'
      }
    }
  },
  plugins: []
};
