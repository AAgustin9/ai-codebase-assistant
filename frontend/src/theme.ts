// Centralized theme tokens for Tailwind classnames
// Swap values here to update app colors in one place

export const theme = {
  panel: {
    container: 'bg-white rounded-lg shadow',
    section: 'bg-gray-50 p-4 rounded-lg',
    headerBar: 'flex justify-between items-center mb-6',
  },
  text: {
    heading: 'text-2xl font-bold',
    subheading: 'text-lg font-semibold',
    muted: 'text-gray-600',
  },
  chip: {
    success: 'bg-green-100 text-green-800',
    error: 'bg-red-100 text-red-800',
    warning: 'bg-yellow-100 text-yellow-800',
  },
  cards: {
    primary: 'bg-blue-100 p-4 rounded-lg',
    success: 'bg-green-100 p-4 rounded-lg',
    accent: 'bg-purple-100 p-4 rounded-lg',
  },
  button: {
    primary: 'bg-blue-600 text-white',
    primaryActive: 'bg-blue-600 text-white',
    neutral: 'bg-gray-200',
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
    container: 'p-8 text-center bg-gray-800 border border-gray-700 rounded-xl shadow-md',
    spinner: 'animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500',
    title: 'text-xl font-semibold text-blue-400 mb-5',
    note: 'mt-4 text-gray-400 text-sm',
  },
  error: {
    container: 'p-8 text-center bg-red-100 rounded-lg',
    title: 'text-xl font-bold mb-4',
    text: 'text-red-600',
  },
  empty: {
    container: 'text-center p-8 bg-gray-100 rounded-lg',
    text: 'text-gray-600',
  },
};
