import { useEffect, useRef, useState } from 'react';
import { Camera } from '@mediapipe/camera_utils';
import { getPoseEngine } from '../lib/pose/PoseEngine';
import { getOcclusionPolygons } from '../lib/pose/occlusionRegions';
import { smoothLandmarks } from '../lib/pose/poseMath';
import { buildMirrorTransform } from '../lib/digital-mirror/buildMirrorTransform';
import { drawGarmentSkeleton, drawMirrorSkeleton } from '../lib/digital-mirror/drawMirrorSkeleton';
import { Compositor } from '../lib/render/Compositor';
import { TryOnRenderer2D } from '../lib/render/TryOnRenderer2D';

const DEFAULT_CANVAS_WIDTH = 1280;
const DEFAULT_CANVAS_HEIGHT = 720;

function resizeCanvas(canvas, renderer, compositor) {
  const bounds = canvas.getBoundingClientRect();
  const nextWidth = Math.max(1, Math.round(bounds.width || DEFAULT_CANVAS_WIDTH));
  const nextHeight = Math.max(1, Math.round(bounds.height || DEFAULT_CANVAS_HEIGHT));

  if (canvas.width === nextWidth && canvas.height === nextHeight) {
    return;
  }

  canvas.width = nextWidth;
  canvas.height = nextHeight;

  if (renderer) {
    renderer.canvas = canvas;
    renderer.ctx = canvas.getContext('2d');
  }

  if (compositor) {
    compositor.canvas = canvas;
    compositor.ctx = canvas.getContext('2d');
    compositor.offscreen.width = nextWidth;
    compositor.offscreen.height = nextHeight;
    compositor.oCtx = compositor.offscreen.getContext('2d');
  }
}

function stopVideoStream(videoElement) {
  const stream = videoElement?.srcObject;

  if (stream && typeof stream.getTracks === 'function') {
    stream.getTracks().forEach((track) => track.stop());
  }

  if (videoElement) {
    videoElement.srcObject = null;
  }
}

export function useDigitalMirror({
  videoRef,
  canvasRef,
  selectedGarment,
  garmentImages,
  toggles,
  params,
}) {
  const rendererRef = useRef(null);
  const compositorRef = useRef(null);
  const previousLandmarksRef = useRef(null);
  const latestSegmentationMaskRef = useRef(null);

  const selectedGarmentRef = useRef(selectedGarment);
  const garmentImagesRef = useRef(garmentImages);
  const togglesRef = useRef(toggles);
  const paramsRef = useRef(params);
  const cameraReadyRef = useRef(false);
  const modelReadyRef = useRef(false);

  const [isLoading, setIsLoading] = useState(true);
  const [cameraReady, setCameraReady] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [fps, setFps] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    selectedGarmentRef.current = selectedGarment;
  }, [selectedGarment]);

  useEffect(() => {
    garmentImagesRef.current = garmentImages;
  }, [garmentImages]);

  useEffect(() => {
    togglesRef.current = toggles;
  }, [toggles]);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    let isCancelled = false;
    let poseEngine = null;
    let cameraInstance = null;
    let resizeObserver = null;
    let lastFrameTime = performance.now();
    let lastFpsUpdate = lastFrameTime;

    const videoElement = videoRef.current;
    const canvasElement = canvasRef.current;

    if (!videoElement || !canvasElement) {
      return undefined;
    }

    const updateLoadingState = () => {
      if (!isCancelled) {
        setIsLoading(!(cameraReadyRef.current && modelReadyRef.current));
      }
    };

    const syncCanvasSize = () => {
      if (!canvasRef.current) {
        return;
      }

      resizeCanvas(canvasRef.current, rendererRef.current, compositorRef.current);
    };

    const renderResult = (results) => {
      if (
        isCancelled
        || !canvasRef.current
        || !videoRef.current
        || !rendererRef.current
        || !compositorRef.current
      ) {
        return;
      }

      syncCanvasSize();

      const activeCanvas = canvasRef.current;
      const activeVideo = videoRef.current;
      const context = activeCanvas.getContext('2d');

      if (!context) {
        return;
      }

      const { width, height } = activeCanvas;
      const rawLandmarks = results.poseLandmarks || null;
      let renderLandmarks = rawLandmarks;

      if (rawLandmarks) {
        if (togglesRef.current.smoothMovement) {
          renderLandmarks = smoothLandmarks(previousLandmarksRef.current, rawLandmarks, 0.4);
          previousLandmarksRef.current = renderLandmarks;
        } else {
          previousLandmarksRef.current = rawLandmarks;
        }
      } else {
        previousLandmarksRef.current = null;
      }

      latestSegmentationMaskRef.current = results.segmentationMask || null;

      const occlusionPolygons = togglesRef.current.useOcclusion && renderLandmarks
        ? getOcclusionPolygons(renderLandmarks, width, height)
        : [];

      let garmentTransform = null;
      let garmentRenderable = null;
      const activeGarment = selectedGarmentRef.current;

      compositorRef.current.composite(
        activeVideo,
        latestSegmentationMaskRef.current,
        (passContext) => {
          if (
            !togglesRef.current.showOverlay
            || !activeGarment
            || !renderLandmarks
          ) {
            return;
          }

          const garmentImage = garmentImagesRef.current[activeGarment.id];
          const garmentAnalysis = garmentImage?.garmentAnalysis || activeGarment.analysis;

          if (!garmentImage || !garmentAnalysis?.keypoints) {
            return;
          }

          const transform = buildMirrorTransform({
            landmarks: renderLandmarks,
            garment: activeGarment,
            garmentImage,
            canvasWidth: width,
            canvasHeight: height,
            params: paramsRef.current,
          });

          if (!transform) {
            return;
          }

          garmentRenderable = garmentImage;
          garmentTransform = transform;

          const renderer = rendererRef.current;
          const originalContext = renderer.ctx;

          renderer.ctx = passContext;
          renderer.drawGarment(garmentImage, transform);
          renderer.ctx = originalContext;
        },
        occlusionPolygons,
      );

      if (togglesRef.current.showSkeleton && renderLandmarks) {
        drawMirrorSkeleton({
          ctx: context,
          landmarks: renderLandmarks,
          canvasWidth: width,
          canvasHeight: height,
          bodyMode: togglesRef.current.bodyMode,
        });

        if (activeGarment && garmentTransform && garmentRenderable) {
          drawGarmentSkeleton({
            ctx: context,
            garment: activeGarment,
            transform: garmentTransform,
            garmentImage: garmentRenderable,
          });
        }
      }

      const now = performance.now();
      const nextFps = Math.round(1000 / Math.max(now - lastFrameTime, 1));

      lastFrameTime = now;

      if (now - lastFpsUpdate >= 250) {
        setFps(nextFps);
        lastFpsUpdate = now;
      }
    };

    const initMirror = async () => {
      setError(null);
      setFps(0);
      setIsLoading(true);
      setCameraReady(false);
      setModelReady(false);

      cameraReadyRef.current = false;
      modelReadyRef.current = false;
      previousLandmarksRef.current = null;
      latestSegmentationMaskRef.current = null;

      rendererRef.current = new TryOnRenderer2D(canvasElement);
      compositorRef.current = new Compositor(canvasElement);
      syncCanvasSize();

      try {
        poseEngine = getPoseEngine();
        poseEngine.onResults((results) => {
          renderResult(results);
        });

        await poseEngine.initializationPromise;

        if (isCancelled) {
          return;
        }

        modelReadyRef.current = true;
        setModelReady(true);
        updateLoadingState();

        cameraInstance = new Camera(videoElement, {
          onFrame: async () => {
            if (videoRef.current?.readyState >= 2) {
              await poseEngine.send(videoRef.current);
            }
          },
          width: DEFAULT_CANVAS_WIDTH,
          height: DEFAULT_CANVAS_HEIGHT,
        });

        await cameraInstance.start();

        if (isCancelled) {
          cameraInstance.stop();
          stopVideoStream(videoRef.current);
          return;
        }

        cameraReadyRef.current = true;
        setCameraReady(true);
        updateLoadingState();
        syncCanvasSize();
      } catch (initializationError) {
        if (isCancelled) {
          return;
        }

        const message = initializationError?.message?.includes('Permission')
          ? 'Camera access denied. Please allow webcam access and refresh the page.'
          : 'Unable to start the digital mirror. Please confirm camera access and try again.';

        setError(message);
        setIsLoading(false);
        setCameraReady(false);
        setModelReady(modelReadyRef.current);
      }
    };

    initMirror();

    const handleResize = () => {
      syncCanvasSize();
    };

    window.addEventListener('resize', handleResize);

    if ('ResizeObserver' in window) {
      resizeObserver = new window.ResizeObserver(() => {
        syncCanvasSize();
      });

      resizeObserver.observe(canvasElement.parentElement || canvasElement);
    }

    return () => {
      isCancelled = true;
      window.removeEventListener('resize', handleResize);
      resizeObserver?.disconnect();
      poseEngine?.onResults(null);
      cameraInstance?.stop();
      stopVideoStream(videoRef.current);

      if (canvasRef.current) {
        const context = canvasRef.current.getContext('2d');
        context?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    };
  }, [canvasRef, videoRef]);

  return {
    isLoading,
    cameraReady,
    modelReady,
    fps,
    error,
  };
}
