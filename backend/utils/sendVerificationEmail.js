export const sendVerificationEmail = async ({ user, token }) => {
  const frontendBaseUrl = (process.env.FRONTEND_BASE_URL || 'http://localhost:3000').replace(/\/+$/, '');
  const verificationUrl = `${frontendBaseUrl}/verify-email?token=${encodeURIComponent(token)}`;

  console.log(`[auth] Verification link for ${user.email}: ${verificationUrl}`);

  return {
    delivery: 'console',
    verificationUrl,
  };
};

