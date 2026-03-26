import { useEffect, useState } from 'react';
import { prepareGarmentAsset } from '../lib/digital-mirror/prepareGarmentAsset';
import { BACKEND_BASE_URL } from '../utils/runtimeConfig';

function qualifyAssetUrl(url) {
  if (!url) {
    return url;
  }

  if (url.startsWith('/uploads')) {
    return `${BACKEND_BASE_URL}${url}`;
  }

  return url;
}

function normalizeGarmentRecord(record) {
  const previewUrl = qualifyAssetUrl(record.previewUrl || record.thumbnail || record.image || record.pngUrl);
  const processedImageUrl = qualifyAssetUrl(record.processedImageUrl || previewUrl);

  return {
    ...record,
    source: record.source || 'catalog',
    fit: record.fit || (record.analysis?.garmentType === 'top' ? 'tight' : 'relaxed'),
    thumbnail: qualifyAssetUrl(record.thumbnail || previewUrl),
    previewUrl,
    processedImageUrl,
  };
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';

    image.onload = () => {
      resolve(image);
    };

    image.onerror = () => {
      reject(new Error(`Failed to load garment image: ${src}`));
    };

    image.src = src;
  });
}

async function preloadGarmentAsset(garment) {
  const preferredSources = [garment.processedImageUrl, garment.previewUrl].filter(Boolean);

  for (const src of preferredSources) {
    try {
      const image = await loadImage(src);
      return prepareGarmentAsset(garment, image);
    } catch (error) {
      // Try the next source if available.
    }
  }

  throw new Error(`Failed to prepare garment image for ${garment.name}.`);
}

export function useGarmentLibrary() {
  const [garments, setGarments] = useState([]);
  const [garmentImages, setGarmentImages] = useState({});
  const [garmentsLoading, setGarmentsLoading] = useState(true);
  const [garmentsError, setGarmentsError] = useState(null);
  const [uploadingGarment, setUploadingGarment] = useState(false);
  const [deletingGarmentId, setDeletingGarmentId] = useState(null);

  useEffect(() => {
    let isCancelled = false;

    const loadGarments = async () => {
      setGarmentsLoading(true);
      setGarmentsError(null);

      try {
        const response = await fetch(`${BACKEND_BASE_URL}/api/trialroom/garments`);

        if (!response.ok) {
          throw new Error('Failed to fetch garment library.');
        }

        const data = await response.json();
        const normalizedGarments = data.map(normalizeGarmentRecord);

        if (isCancelled) {
          return;
        }

        setGarments(normalizedGarments);

        const preparedEntries = await Promise.all(normalizedGarments.map(async (garment) => {
          try {
            const preparedAsset = await preloadGarmentAsset(garment);
            return [garment.id, preparedAsset];
          } catch (error) {
            return [garment.id, null];
          }
        }));

        if (isCancelled) {
          return;
        }

        const imageMap = preparedEntries.reduce((accumulator, [id, preparedAsset]) => {
          if (preparedAsset) {
            accumulator[id] = preparedAsset;
          }

          return accumulator;
        }, {});

        setGarmentImages(imageMap);

        if (normalizedGarments.length > 0 && Object.keys(imageMap).length === 0) {
          setGarmentsError('Garments loaded, but the processed dress assets could not be prepared.');
        } else if (Object.keys(imageMap).length < normalizedGarments.length) {
          setGarmentsError('Some garments could not be prepared and may not render in the mirror.');
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

  const uploadGarment = async (file) => {
    setUploadingGarment(true);
    setGarmentsError(null);

    try {
      const formData = new FormData();
      formData.append('garment', file);

      const response = await fetch(`${BACKEND_BASE_URL}/api/trialroom/garments/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload garment.');
      }

      const normalizedGarment = normalizeGarmentRecord(data);
      const preparedAsset = await preloadGarmentAsset(normalizedGarment);

      setGarments((current) => [normalizedGarment, ...current]);
      setGarmentImages((current) => ({
        ...current,
        [normalizedGarment.id]: preparedAsset,
      }));

      return normalizedGarment;
    } catch (error) {
      setGarmentsError(error.message || 'Failed to upload garment.');
      throw error;
    } finally {
      setUploadingGarment(false);
    }
  };

  const deleteGarment = async (id) => {
    setDeletingGarmentId(id);
    setGarmentsError(null);

    try {
      const response = await fetch(`${BACKEND_BASE_URL}/api/trialroom/garments/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to delete garment.');
      }

      setGarments((current) => current.filter((g) => g.id !== id));
      
      setGarmentImages((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
      
      return true;
    } catch (error) {
      setGarmentsError(error.message || 'Failed to delete garment.');
      throw error;
    } finally {
      setDeletingGarmentId(null);
    }
  };

  return {
    garments,
    garmentImages,
    garmentsLoading,
    garmentsError,
    uploadingGarment,
    uploadGarment,
    deleteGarment,
    deletingGarmentId,
  };
}

