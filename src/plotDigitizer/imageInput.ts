export const fileToImage = (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = reject;
    image.src = url;
  });

export const imageFromClipboard = async (
  event: ClipboardEvent
): Promise<HTMLImageElement | null> => {
  const file = Array.from(event.clipboardData?.items ?? [])
    .find(item => item.type.startsWith("image/"))
    ?.getAsFile();
  return file ? fileToImage(file) : null;
};
