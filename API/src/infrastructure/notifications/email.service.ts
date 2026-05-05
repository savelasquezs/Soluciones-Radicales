interface SendPasswordResetEmailInput {
  to: string;
  resetUrl: string;
}

export const sendPasswordResetEmail = async (
  input: SendPasswordResetEmailInput,
): Promise<void> => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Password reset email placeholder to=${input.to} url=${input.resetUrl}`);
  }

  // TODO: integrate a real email provider.
};
