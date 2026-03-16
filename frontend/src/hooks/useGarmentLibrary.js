import { useEffect, useState } from 'react';

export function useGarmentLibrary() {
  const [garments, setGarments] = useState([]);
  const [garmentImages, setGarmentImages] = useState({});
  const [garmentsLoading, setGarmentsLoading] = useState(true);
  const [garmentsError, setGarmentsError] = useState(null);

  useEffect(() => {
    let isCancelled = false;

    const preloadImage = (garment) => new Promise((resolve) => {
      const image = new Image();

      image.onload = () => {
        resolve([garment.id, image]);
      };

      image.onerror = () => {
        resolve([garment.id, null]);
      };

      image.src = garment.image;
    });

    const loadGarments = async () => {
      setGarmentsLoading(true);
      setGarmentsError(null);

      try {
        const response = await fetch('/assets/garments/garments.json');

        if (!response.ok) {
          throw new Error('Failed to fetch garment library.');
        }

        const data = await response.json();

        if (isCancelled) {
          return;
        }

        setGarments(data);

        const preloadedEntries = await Promise.all(data.map(preloadImage));

        if (isCancelled) {
          return;
        }

        const imageMap = preloadedEntries.reduce((accumulator, [id, image]) => {
          if (image) {
            accumulator[id] = image;
          }

          return accumulator;
        }, {});

        setGarmentImages(imageMap);

        if (data.length > 0 && Object.keys(imageMap).length === 0) {
          setGarmentsError('Garments loaded, but the preview images could not be prepared.');
        } else if (Object.keys(imageMap).length < data.length) {
          setGarmentsError('Some garment preview images could not be prepared.');
        }
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setGarments([]);
        setGarmentImages({});
        setGarmentsError(error.message || 'Failed to load garment library.');
      } finally {
        if (!isCancelled) {
          setGarmentsLoading(false);
        }
      }
    };

    loadGarments();

    return () => {
      isCancelled = true;
    };
  }, []);

  return {
    garments,
    garmentImages,
    garmentsLoading,
    garmentsError,
  };
}
