// Custom image loader for Data Dragon images to avoid 403 errors
export const ddragonImageLoader = ({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) => {
  // Si l'URL est déjà complète, on la retourne telle quelle
  if (src.startsWith("http")) {
    return src;
  }

  // Sinon, on construit l'URL complète
  return src;
};
