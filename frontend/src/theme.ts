// Centralized theme tokens for Tailwind classnames
// Swap values here to update app colors in one place

export const theme = {
  panel: {
    container: 'bg-gray-800 border border-gray-700 rounded-xl shadow-md p-6',
    section: 'bg-gray-700 p-4 rounded-lg border border-gray-600',
    headerBar: 'flex justify-between items-center mb-6',
  },
  text: {
    heading: 'text-2xl font-bold text-white',
    subheading: 'text-lg font-semibold text-gray-200',
    muted: 'text-gray-400',
  },
  chip: {
    success: 'bg-green-900 text-green-300 border border-green-700',
    error: 'bg-red-900 text-red-300 border border-red-700',
    warning: 'bg-yellow-900 text-yellow-300 border border-yellow-700',
  },
  cards: {
    primary: 'bg-blue-900 border border-blue-700 p-4 rounded-lg',
    success: 'bg-green-900 border border-green-700 p-4 rounded-lg',
    accent: 'bg-purple-900 border border-purple-700 p-4 rounded-lg',
  },
  button: {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    primaryActive: 'bg-blue-600 text-white',
    neutral: 'bg-gray-600 text-gray-200 hover:bg-gray-500',
  },
  chart: {
    barPrimary: 'rgba(59, 130, 246, 0.5)',
    barPalette: [
      'rgba(239, 68, 68, 0.5)',
      'rgba(59, 130, 246, 0.5)',
      'rgba(245, 158, 11, 0.5)',
    ],
  },
  loading: {
    container: 'p-8 text-center bg-gray-800 border border-gray-700 rounded-xl shadow-md',
    spinner: 'animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500',
    title: 'text-xl font-semibold text-blue-400 mb-5',
    note: 'mt-4 text-gray-400 text-sm',
  },
  error: {
    container: 'p-8 text-center bg-red-900 border border-red-700 rounded-lg',
    title: 'text-xl font-bold mb-4 text-red-300',
    text: 'text-red-300',
  },
  empty: {
    container: 'text-center p-8 bg-gray-700 border border-gray-600 rounded-lg',
    text: 'text-gray-400',
  },
};
