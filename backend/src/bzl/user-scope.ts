const TEST_USER_ID = '__illustry_test_user__';

const resolveUserId = (userId?: string): string => {
  if (userId) {
    return userId;
  }

  if (process.env.NODE_ENV === 'test') {
    return TEST_USER_ID;
  }

  throw new Error('Missing userId');
};

export {
  TEST_USER_ID,
  resolveUserId
};
