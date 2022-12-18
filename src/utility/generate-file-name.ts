export const generateFileName = (preface: string, extension: string): string => {
  const { dateString, hours, minutes, seconds } = generateDateString();
  return `${preface}-${dateString}-${hours}-${minutes}${seconds}.${extension}`;
};

export const generateDateString = () => {
  const date = new Date();

  const dateString = date.toISOString().slice(0, 10);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();

  return { dateString, hours, minutes, seconds };
};
