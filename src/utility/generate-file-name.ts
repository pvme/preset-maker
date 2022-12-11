export const generateFileName = (preface: string, extension: string): string => {
  const date = new Date();

  const dateString = date.toISOString().slice(0, 10);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();

  return `${preface}-${dateString}-${hours}-${minutes}${seconds}.${extension}`;
};
