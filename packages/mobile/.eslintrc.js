module.exports = {
  root: true,
  extends: ['@quiet/eslint-config'],
  rules: {
    'react-native/no-inline-styles': 'off', // React Native community rule
    
    // Ban direct usage of Modal component
    'no-restricted-imports': ['error', {
      'paths': [{
        'name': 'react-native',
        'importNames': ['Modal'],
        'message': 'Use SafeAreaModal from src/components/SafeAreaModal/SafeAreaModal.component instead of Modal to ensure proper handling of safe areas on iOS devices with notches.'
      }]
    }]
  },
  overrides: [
    {
      files: ['*.tsx', '*.ts'],
      rules: {
        // Ban direct usage of Modal component in JSX
        'no-restricted-syntax': ['error', {
          'selector': 'JSXOpeningElement[name.name=\'Modal\']',
          'message': 'Use SafeAreaModal from src/components/SafeAreaModal/SafeAreaModal.component instead of Modal to ensure proper handling of safe areas on iOS devices with notches.'
        }],
        // Exception for the SafeAreaModal component itself
        'no-restricted-imports': ['error', {
          'paths': [{
            'name': 'react-native',
            'importNames': ['Modal'],
            'message': 'Use SafeAreaModal instead of Modal to ensure proper handling of safe areas on iOS devices with notches.'
          }]
        }]
      }
    },
    {
      // Allow Modal usage in SafeAreaModal component
      files: ['**/SafeAreaModal/**'],
      rules: {
        'no-restricted-imports': 'off',
        'no-restricted-syntax': 'off'
      }
    }
  ]
}