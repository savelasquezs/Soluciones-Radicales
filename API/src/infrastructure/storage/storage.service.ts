export interface UploadFileInput {
  fileName: string;
  contentType?: string;
  contentBase64: string;
}

export const uploadFile = async (input: UploadFileInput): Promise<string> => {
  const safeName = encodeURIComponent(input.fileName.trim());
  void input.contentType;
  void input.contentBase64;

  // TODO: replace with Firebase Storage integration.
  return `https://storage.local/${Date.now()}-${safeName}`;
};
