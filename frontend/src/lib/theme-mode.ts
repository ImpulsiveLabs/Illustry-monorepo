const getStoredTheme = (): 'light' | 'dark' => {
  try {
    if (typeof window === 'undefined') {
      return 'light';
    }

    return window.localStorage.getItem('theme') === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
};

export { getStoredTheme };
