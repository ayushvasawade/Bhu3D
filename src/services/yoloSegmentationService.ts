/**
 * YOLO Segmentation Service
 * =========================
 * Runs YOLOv8-seg instance segmentation in the browser using ONNX Runtime Web.
 * Takes satellite/aerial image tiles (captured from Cesium viewer or provided as canvas/image),
 * detects building instance masks, extracts polygon contours, and georeferences them to WGS84.
 *
 * Designed according to pipeline requirements:
 * 1. Output polygon masks (NOT just bounding boxes).
 * 2. Geo-referencing via camera/tile extent.
 * 3. Fallback computer vision segmentation if ONNX weights are not loaded.
 */

import * as ort from 'onnxruntime-web';
import {
  YoloBuildingDetection,
  YoloProcessingStatus,
  YoloServiceConfig
} from '../types/yolo';

export class YoloSegmentationService {
  private session: ort.InferenceSession | null = null;
  private isModelLoading = false;
  private modelLoaded = false;
  private config: YoloServiceConfig = {
    modelPath: '/models/building-segmentation.onnx',
    confidenceThreshold: 0.35,
    nmsThreshold: 0.45,
    inputSize: [640, 640],
    matchIoUThreshold: 0.25,
    maxCentroidDistanceMeters: 35.0,
    buildingClassId: 0
  };

  private statusListener: ((status: YoloProcessingStatus) => void) | null = null;

  constructor(customConfig?: Partial<YoloServiceConfig>) {
    if (customConfig) {
      this.config = { ...this.config, ...customConfig };
    }
  }

  public setStatusListener(listener: (status: YoloProcessingStatus) => void): void {
    this.statusListener = listener;
  }

  private updateStatus(
    stage: YoloProcessingStatus['stage'],
    progress: number,
    message: string,
    extra?: Partial<YoloProcessingStatus>
  ): void {
    if (this.statusListener) {
      this.statusListener({
        stage,
        progress,
        message,
        detectionCount: extra?.detectionCount ?? 0,
        matchedCount: extra?.matchedCount ?? 0,
        processingTimeMs: extra?.processingTimeMs ?? 0,
        error: extra?.error ?? null
      });
    }
  }

  /**
   * Initializes the ONNX inference session with WASM backend
   */
  public async initSession(modelPath?: string): Promise<boolean> {
    if (this.modelLoaded && this.session) return true;
    if (this.isModelLoading) return false;

    const path = modelPath || this.config.modelPath;
    this.isModelLoading = true;
    this.updateStatus('LOADING_MODEL', 0.1, `Initializing model from ${path}...`);

    try {
      // Configure ONNX runtime web for browser WASM execution
      ort.env.wasm.numThreads = Math.min(4, navigator.hardwareConcurrency || 2);
      ort.env.wasm.simd = true;

      // Attempt to load the ONNX session
      this.session = await ort.InferenceSession.create(path, {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'all'
      });

      this.modelLoaded = true;
      this.isModelLoading = false;
      this.updateStatus('IDLE', 1.0, 'Building segmentation model loaded successfully');
      return true;
    } catch (err: any) {
      this.isModelLoading = false;
      this.modelLoaded = false;
      this.session = null;
      console.warn(
        `[YOLO] Dedicated building segmentation model not available at ${path} (${err.message}). ` +
        'Fake fallback is disabled: reporting YOLO Building Segmentation Unavailable.'
      );
      this.updateStatus(
        'IDLE',
        1.0,
        'YOLO Building Segmentation Unavailable'
      );
      return false;
    }
  }

  public getModelInfo(): {
    modelPath: string;
    isRealOnnxLoaded: boolean;
    sessionBackend: string;
  } {
    return {
      modelPath: this.config.modelPath,
      isRealOnnxLoaded: this.modelLoaded && this.session !== null,
      sessionBackend: this.session ? 'ONNX Runtime Web (WASM SIMD)' : 'UNLOADED'
    };
  }

  public isReady(): boolean {
    return this.modelLoaded && this.session !== null;
  }

  /**
   * Run building segmentation on an image / canvas with known geographic extent
   * @param sourceCanvas HTMLCanvasElement containing the satellite image
   * @param extent [minLon, minLat, maxLon, maxLat] bounding box of the canvas
   */
  public async segmentBuildings(
    sourceCanvas: HTMLCanvasElement,
    extent: [number, number, number, number]
  ): Promise<YoloBuildingDetection[]> {
    const startTime = performance.now();
    this.updateStatus('CAPTURING_TILE', 0.2, 'Extracting aerial imagery canvas for analysis...');

    const width = sourceCanvas.width;
    const height = sourceCanvas.height;

    if (width === 0 || height === 0) {
      throw new Error('Invalid canvas dimensions for YOLO segmentation');
    }

    // Try ONNX inference first if model is loaded or can be loaded
    if (!this.session && !this.modelLoaded) {
      await this.initSession();
    }

    let detections: YoloBuildingDetection[] = [];

    if (this.session) {
      console.log(`[YOLO] Executing REAL ONNX Runtime Web inference: model=${this.config.modelPath}`);
      detections = await this.runOnnxInference(sourceCanvas, extent);
    } else {
      console.warn(`[YOLO] No building segmentation model loaded. Fake detections are disabled.`);
      this.updateStatus(
        'IDLE',
        1.0,
        'YOLO Building Segmentation Unavailable',
        { detectionCount: 0, matchedCount: 0 }
      );
      return [];
    }

    const elapsed = Math.round(performance.now() - startTime);
    console.log(
      `[YOLO] Inference complete: ${detections.length} masks extracted in ${elapsed}ms`
    );
    this.updateStatus(
      'COMPLETE',
      1.0,
      `YOLO inference complete: ${detections.length} masks extracted in ${elapsed}ms`,
      {
        detectionCount: detections.length,
        processingTimeMs: elapsed
      }
    );

    return detections;
  }

  /**
   * Preprocesses image and runs actual ONNX Runtime Web YOLOv8-seg inference
   */
  private async runOnnxInference(
    sourceCanvas: HTMLCanvasElement,
    extent: [number, number, number, number]
  ): Promise<YoloBuildingDetection[]> {
    this.updateStatus('PREPROCESSING', 0.3, 'Preparing 640x640 input tensor...');

    const [inputW, inputH] = this.config.inputSize;
    const offscreen = document.createElement('canvas');
    offscreen.width = inputW;
    offscreen.height = inputH;
    const ctx = offscreen.getContext('2d');
    if (!ctx) throw new Error('Could not acquire 2D context');

    ctx.drawImage(sourceCanvas, 0, 0, inputW, inputH);
    const imgData = ctx.getImageData(0, 0, inputW, inputH);
    const { data } = imgData;

    // Convert RGBA to NCHW Float32Array [1, 3, 640, 640], normalized to [0, 1]
    const float32Data = new Float32Array(3 * inputW * inputH);
    const planeSize = inputW * inputH;

    for (let i = 0; i < planeSize; i++) {
      float32Data[i] = data[i * 4] / 255.0; // R
      float32Data[planeSize + i] = data[i * 4 + 1] / 255.0; // G
      float32Data[2 * planeSize + i] = data[i * 4 + 2] / 255.0; // B
    }

    const tensor = new ort.Tensor('float32', float32Data, [1, 3, inputH, inputW]);

    this.updateStatus('INFERENCING', 0.5, 'Running YOLOv8-seg neural network inference...');
    const feeds: Record<string, ort.Tensor> = {};
    const inputNames = this.session!.inputNames;
    feeds[inputNames[0]] = tensor;

    const results = await this.session!.run(feeds);
    this.updateStatus('POSTPROCESSING', 0.7, 'Decoding segmentation masks & contours...');

    // Output parsing for YOLOv8-seg
    // Output 0: [1, 116, 8400]
    // Output 1: Proto masks [1, 32, 160, 160]
    const outputNames = this.session!.outputNames;
    const output0 = results[outputNames[0]];
    const protoTensor = results[outputNames[1]];

    return this.parseYoloOutputs(output0, protoTensor, sourceCanvas.width, sourceCanvas.height, extent);
  }

  /**
   * Decodes bounding boxes, class scores, mask coefficients and converts to polygons
   */
  private parseYoloOutputs(
    output0: ort.Tensor,
    protoTensor: ort.Tensor | undefined,
    origW: number,
    origH: number,
    extent: [number, number, number, number]
  ): YoloBuildingDetection[] {
    const data0 = output0.data as Float32Array;
    const dims = output0.dims; // [1, channels, proposals]
    const numChannels = dims[1];
    const numProposals = dims[2];

    const protoData = protoTensor ? (protoTensor.data as Float32Array) : null;
    const protoDims = protoTensor ? protoTensor.dims : [1, 32, 160, 160];
    const protoH = protoDims[2] || 160;
    const protoW = protoDims[3] || 160;

    const detections: YoloBuildingDetection[] = [];
    const [inputW, inputH] = this.config.inputSize;
    const numClasses = numChannels - 4 - 32;

    // Check if the loaded model is a standard COCO model (80 classes, class 0 = person)
    // COCO does NOT contain a building class. Do NOT fabricate detections!
    if (numClasses === 80) {
      console.warn(
        '[YOLO] COCO model detected: COCO dataset does not contain a building class (Class 0 is Person). ' +
        'YOLO Building Segmentation requires a dedicated building segmentation model at /models/building-segmentation.onnx. ' +
        'Synthetic/fake detections are strictly disabled.'
      );
      this.updateStatus(
        'IDLE',
        1.0,
        'YOLO Building Segmentation Unavailable (COCO model lacks building class)',
        { detectionCount: 0, matchedCount: 0 }
      );
      return [];
    }

    const targetBuildingClass = this.config.buildingClassId ?? 0;

    // Filter candidate proposals
    for (let p = 0; p < numProposals; p++) {
      let maxConf = 0;
      let bestClass = 0;

      for (let c = 0; c < numClasses; c++) {
        const score = data0[(4 + c) * numProposals + p];
        if (score > maxConf) {
          maxConf = score;
          bestClass = c;
        }
      }

      if (maxConf < this.config.confidenceThreshold) continue;
      // Strictly filter for the dedicated building class from a trained building model
      if (bestClass !== targetBuildingClass) continue;

      const cx = data0[0 * numProposals + p];
      const cy = data0[1 * numProposals + p];
      const w = data0[2 * numProposals + p];
      const h = data0[3 * numProposals + p];

      const scaleX = origW / inputW;
      const scaleY = origH / inputH;

      const xMin = Math.max(0, (cx - w / 2) * scaleX);
      const yMin = Math.max(0, (cy - h / 2) * scaleY);
      const xMax = Math.min(origW, (cx + w / 2) * scaleX);
      const yMax = Math.min(origH, (cy + h / 2) * scaleY);

      if (xMax - xMin < 4 || yMax - yMin < 4) continue;

      let maskPixels: [number, number][] = [];

      // If prototype masks available, decode using matrix multiplication
      if (protoData) {
        const maskCoeffs = new Float32Array(32);
        for (let m = 0; m < 32; m++) {
          maskCoeffs[m] = data0[(4 + numClasses + m) * numProposals + p];
        }

        const pXmin = Math.floor((xMin / origW) * protoW);
        const pXmax = Math.ceil((xMax / origW) * protoW);
        const pYmin = Math.floor((yMin / origH) * protoH);
        const pYmax = Math.ceil((yMax / origH) * protoH);

        const boundaryPoints: [number, number][] = [];

        for (let py = pYmin; py < pYmax; py += 2) {
          if (py < 0 || py >= protoH) continue;
          let rowStart = -1;
          let rowEnd = -1;
          for (let px = pXmin; px < pXmax; px += 2) {
            if (px < 0 || px >= protoW) continue;
            let sum = 0;
            const pixelIdx = py * protoW + px;
            for (let m = 0; m < 32; m++) {
              sum += maskCoeffs[m] * protoData[m * protoH * protoW + pixelIdx];
            }
            const val = 1 / (1 + Math.exp(-sum));
            if (val > 0.5) {
              if (rowStart === -1) rowStart = px;
              rowEnd = px;
            }
          }
          if (rowStart !== -1 && rowEnd !== -1) {
            boundaryPoints.push([(rowStart / protoW) * origW, (py / protoH) * origH]);
            boundaryPoints.push([(rowEnd / protoW) * origW, (py / protoH) * origH]);
          }
        }

        if (boundaryPoints.length >= 6) {
          maskPixels = this.orderContourPoints(boundaryPoints);
        }
      }

      if (maskPixels.length < 4) {
        maskPixels = this.generatePolygonFromBbox([xMin, yMin, xMax, yMax]);
      }

      const maskGeo = maskPixels.map(([px, py]) => this.pixelToGeo(px, py, origW, origH, extent));
      const centroidGeo = this.calculateCentroid(maskGeo);
      const areaSqM = this.calculateGeodesicArea(maskGeo);

      detections.push({
        detectionId: `YOLO-DET-${detections.length + 1}`,
        classId: bestClass,
        classLabel: 'building',
        confidence: Math.round(maxConf * 100) / 100,
        bboxNormalized: [cx / inputW, cy / inputH, w / inputW, h / inputH],
        bboxPixels: [xMin, yMin, xMax, yMax],
        maskPixelCoords: maskPixels,
        maskGeoCoords: maskGeo,
        maskAreaPixels: Math.round((xMax - xMin) * (yMax - yMin)),
        maskAreaSqM: Math.round(areaSqM * 10) / 10,
        centroidGeo,
        imageTileExtent: extent,
        imageSize: [origW, origH]
      });
    }

    return this.applyNms(detections, this.config.nmsThreshold);
  }

  private orderContourPoints(points: [number, number][]): [number, number][] {
    if (points.length < 3) return points;
    let cx = 0;
    let cy = 0;
    for (const [x, y] of points) {
      cx += x;
      cy += y;
    }
    cx /= points.length;
    cy /= points.length;

    const sorted = [...points].sort((a, b) => {
      const angleA = Math.atan2(a[1] - cy, a[0] - cx);
      const angleB = Math.atan2(b[1] - cy, b[0] - cx);
      return angleA - angleB;
    });

    sorted.push([sorted[0][0], sorted[0][1]]);
    return sorted;
  }

  /**
   * Converts pixel coordinates inside canvas to WGS84 [lon, lat]
   * Note: In canvas, Y=0 is TOP (maxLat), Y=height is BOTTOM (minLat).
   */
  public pixelToGeo(
    x: number,
    y: number,
    imageWidth: number,
    imageHeight: number,
    extent: [number, number, number, number]
  ): [number, number] {
    const [minLon, minLat, maxLon, maxLat] = extent;
    const u = Math.max(0, Math.min(1, x / imageWidth));
    const v = Math.max(0, Math.min(1, y / imageHeight));

    const lon = minLon + u * (maxLon - minLon);
    const lat = maxLat - v * (maxLat - minLat); // Invert Y for latitude

    return [lon, lat];
  }

  /**
   * Converts WGS84 [lon, lat] to pixel coordinates inside image canvas
   */
  public geoToPixel(
    lon: number,
    lat: number,
    imageWidth: number,
    imageHeight: number,
    extent: [number, number, number, number]
  ): [number, number] {
    const [minLon, minLat, maxLon, maxLat] = extent;
    const u = (lon - minLon) / (maxLon - minLon);
    const v = (maxLat - lat) / (maxLat - minLat);

    return [Math.round(u * imageWidth), Math.round(v * imageHeight)];
  }

  private generatePolygonFromBbox(bbox: [number, number, number, number]): [number, number][] {
    const [xMin, yMin, xMax, yMax] = bbox;
    return [
      [xMin, yMin],
      [xMax, yMin],
      [xMax, yMax],
      [xMin, yMax],
      [xMin, yMin]
    ];
  }

  private calculateCentroid(coords: [number, number][]): [number, number] {
    if (coords.length === 0) return [0, 0];
    let sumLon = 0;
    let sumLat = 0;
    const count = coords.length;
    for (const [lon, lat] of coords) {
      sumLon += lon;
      sumLat += lat;
    }
    return [sumLon / count, sumLat / count];
  }

  /**
   * Spherical polygon area in square meters
   */
  public calculateGeodesicArea(coords: [number, number][]): number {
    if (coords.length < 3) return 0;
    const R = 6378137; // WGS84 semi-major axis in meters
    let total = 0;

    for (let i = 0; i < coords.length; i++) {
      const [lon1, lat1] = coords[i];
      const [lon2, lat2] = coords[(i + 1) % coords.length];
      const radLon1 = (lon1 * Math.PI) / 180;
      const radLat1 = (lat1 * Math.PI) / 180;
      const radLon2 = (lon2 * Math.PI) / 180;
      const radLat2 = (lat2 * Math.PI) / 180;

      total += (radLon2 - radLon1) * (2 + Math.sin(radLat1) + Math.sin(radLat2));
    }

    return Math.abs((total * R * R) / 2.0);
  }

  /**
   * Non-Maximum Suppression (NMS) on bounding boxes
   */
  private applyNms(
    detections: YoloBuildingDetection[],
    iouThreshold: number
  ): YoloBuildingDetection[] {
    const sorted = [...detections].sort((a, b) => b.confidence - a.confidence);
    const selected: YoloBuildingDetection[] = [];

    for (const current of sorted) {
      let keep = true;
      for (const prior of selected) {
        const iou = this.calculateBboxIoU(current.bboxPixels, prior.bboxPixels);
        if (iou > iouThreshold) {
          keep = false;
          break;
        }
      }
      if (keep) {
        selected.push(current);
      }
    }

    return selected;
  }

  private calculateBboxIoU(
    a: [number, number, number, number],
    b: [number, number, number, number]
  ): number {
    const xA = Math.max(a[0], b[0]);
    const yA = Math.max(a[1], b[1]);
    const xB = Math.min(a[2], b[2]);
    const yB = Math.min(a[3], b[3]);

    const interArea = Math.max(0, xB - xA) * Math.max(0, yB - yA);
    const areaA = (a[2] - a[0]) * (a[3] - a[1]);
    const areaB = (b[2] - b[0]) * (b[3] - b[1]);
    const unionArea = areaA + areaB - interArea;

    return unionArea > 0 ? interArea / unionArea : 0;
  }
}

export const yoloService = new YoloSegmentationService();
