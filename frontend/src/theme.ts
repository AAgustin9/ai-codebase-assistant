// Centralized theme tokens for Tailwind classnames
// Swap values here to update app colors in one place

export const theme = {
  panel: {
    container: 'bg-white rounded-lg shadow',
    section: 'bg-gray-50 p-4 rounded-lg',
    headerBar: 'flex justify-between items-center mb-6',
  },
  text: {
    heading: 'text-2xl font-bold text-black',
    subheading: 'text-lg font-semibold text-black',
    muted: 'text-black',
  },
  chip: {
    success: 'bg-green-100 text-black',
    error: 'bg-red-100 text-black',
    warning: 'bg-yellow-100 text-black',
  },
  cards: {
    primary: 'bg-blue-100 p-4 rounded-lg text-black',
    success: 'bg-green-100 p-4 rounded-lg text-black',
    accent: 'bg-purple-100 p-4 rounded-lg text-black',
  },
  button: {
    primary: 'bg-blue-600 text-white',
    primaryActive: 'bg-blue-600 text-white',
    neutral: 'bg-gray-200 text-black',
  },
  chart: {
    barPrimary: 'rgba(53, 162, 235, 0.5)',
    barPalette: [
      'rgba(255, 99, 132, 0.5)',
      'rgba(54, 162, 235, 0.5)',
      'rgba(255, 206, 86, 0.5)',
    ],
  },
  loading: {
    container: 'p-8 text-center bg-white border border-gray-300 rounded-xl shadow-md',
    spinner: 'animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500',
    title: 'text-xl font-semibold text-black mb-5',
    note: 'mt-4 text-black text-sm',
  },
  error: {
    container: 'p-8 text-center bg-red-100 rounded-lg',
    title: 'text-xl font-bold mb-4 text-black',
    text: 'text-black',
  },
  empty: {
    container: 'text-center p-8 bg-gray-100 rounded-lg',
    text: 'text-black',
  },
};
