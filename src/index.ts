interface IOptions {
  width?: number;
  height?: number;
  scale?: number;
  color?: string;
  bgColor?: string;
  openSmooth?: boolean;
  minWidth?: number;
  maxWidth?: number;
  minSpeed?: number;
  maxWidthDiffRate?: number;
  maxHistoryLength?: number;
  toDataURL?: () => string;
  getImagePath?: () => Promise<any>;
  requestAnimationFrame?: (fn: () => void) => void;
}

interface IPoint {
  x: number;
  y: number;
  t: number;
  speed?: number;
  distance?: number;
  lineWidth?: number;
  lastX?: number;
  lastY?: number;
}

class SmoothSignature {
  constructor(ctx: any, options: IOptions) {
    this.init(ctx, options)
  }
  ctx: any;
  canvas: any;
  width = 300;
  height = 150;
  scale = 1;
  color = 'black';
  bgColor = '';
  openSmooth = true;
  minWidth = 2;
  maxWidth = 6;
  minSpeed = 1.5;
  maxWidthDiffRate = 20;
  maxHistoryLength = 20;
  points: IPoint[] = [];
  canAddHistory = true;
  historyList: string[] = [];
  getImagePath: any;
  toDataURL: any;
  requestAnimationFrame: any;

  init = (ctx: any, options: IOptions) => {
    if (!ctx) return;
    this.ctx = ctx;
    this.getImagePath = options.getImagePath;
    this.toDataURL = options.toDataURL;
    this.requestAnimationFrame = options.requestAnimationFrame;
    this.width = options.width || this.width;
    this.height = options.height || this.height;
    this.color = options.color || this.color;
    this.bgColor = options.bgColor || this.bgColor;
    this.openSmooth = options.openSmooth || this.openSmooth;
    this.minWidth = options.minWidth || this.minWidth;
    this.maxWidth = options.maxWidth || this.maxWidth;
    this.minSpeed = options.minSpeed || this.minSpeed;
    this.maxWidthDiffRate = options.maxWidthDiffRate || this.maxWidthDiffRate;
    this.maxHistoryLength = options.maxHistoryLength || this.maxHistoryLength;
    if (typeof options.scale === 'number') {
      this.scale = options.scale;
      this.ctx.scale(this.scale, this.scale);
      this.ctx.draw && this.ctx.draw();
    }
    this.ctx.lineCap = 'round';
    this.ctx.setLineCap && this.ctx.setLineCap('round');
    this.drawBgColor();
  }

  onDrawStart = (x: number, y: number) => {
    this.canAddHistory = true;
    this.ctx.strokeStyle = this.color;
    this.ctx.setStrokeStyle && this.ctx.setStrokeStyle(this.color);
    this.initPoint(x, y);
  }

  onDrawMove = (x: number, y: number) => {
    this.initPoint(x, y);
    this.onDraw();
  }

  onDraw = () => {
    if (this.points.length < 3) return;
    this.addHistory();
    const point: any = this.points.slice(-1)[0];
    const prePoint: any = this.points.slice(-2, -1)[0];
    const onDraw = () => {
      if (this.openSmooth) {
        this.drawSmoothLine(prePoint, point);
      } else {
        this.drawNoSmoothLine(prePoint, point);

      }
    }
    if (typeof this.requestAnimationFrame === 'function') {
      this.requestAnimationFrame(() => onDraw())
    } else {
      onDraw()
    }
  }

  onDrawEnd = () => {
    this.canAddHistory = true;
    this.points = [];
  }

  getLineWidth = (speed: number) => {
    const minSpeed = this.minSpeed > 10 ? 10 : this.minSpeed < 1 ? 1 : this.minSpeed;
    const addWidth = (this.maxWidth - this.minWidth) * speed / minSpeed;
    const lineWidth = Math.max(this.maxWidth - addWidth, this.minWidth);
    return Math.min(lineWidth, this.maxWidth);
  }

  initPoint = (x: number, y: number) => {
    const point: IPoint = { x, y, t: Date.now() }
    const prePoint = this.points.slice(-1)[0];
    if (prePoint && (prePoint.t === point.t || prePoint.x === x && prePoint.y === y)) {
      return
    }
    if (this.openSmooth && prePoint) {
      const prePoint2 = this.points.slice(-2, -1)[0];
      point.distance = Math.sqrt(Math.pow(point.x - prePoint.x, 2) + Math.pow(point.y - prePoint.y, 2));
      point.speed = point.distance / ((point.t - prePoint.t) || 0.1);
      point.lineWidth = this.getLineWidth(point.speed);
      if (prePoint2 && prePoint2.lineWidth && prePoint.lineWidth) {
        const rate = (point.lineWidth - prePoint.lineWidth) / prePoint.lineWidth;
        let maxRate = this.maxWidthDiffRate / 100;
        maxRate = maxRate > 1 ? 1 : maxRate < 0.01 ? 0.01 : maxRate;
        if (Math.abs(rate) > maxRate) {
          const per = rate > 0 ? maxRate : -maxRate;
          point.lineWidth = prePoint.lineWidth * (1 + per);
        }
      }
    }
    this.points.push(point);
    this.points = this.points.slice(-3);
  }

  drawSmoothLine = (prePoint: any, point: any) => {
    const perW = (point.x - prePoint.x) * 0.33;
    const perH = (point.y - prePoint.y) * 0.33;
    const x1 = prePoint.x + perW;
    const y1 = prePoint.y + perH;
    const x2 = x1 + perW;
    const y2 = y1 + perH;
    point.lastX = x2;
    point.lastY = y2;
    if (typeof prePoint.lastX === 'number') {
      const lineWidth = (prePoint.lineWidth + point.lineWidth) / 2;
      this.drawCurveLine(prePoint.lastX, prePoint.lastY, prePoint.x, prePoint.y, x1, y1, lineWidth);
    }
    this.drawLine(x1, y1, x2, y2, point.lineWidth);
  }

  drawNoSmoothLine = (prePoint: any, point: any) => {
    const halfW = (point.x - prePoint.x) / 2;
    const halfH = (point.y - prePoint.y) / 2;
    point.lastX = prePoint.x + halfW;
    point.lastY = prePoint.y + halfH;
    if (typeof prePoint.lastX === 'number') {
      this.drawCurveLine(
        prePoint.lastX, prePoint.lastY,
        prePoint.x, prePoint.y,
        point.lastX, point.lastY,
        this.maxWidth
      );
    }
  }

  drawLine = (x1: number, y1: number, x2: number, y2: number, lineWidth: number) => {
    this.ctx.setLineWidth && this.ctx.setLineWidth(lineWidth);
    this.ctx.lineWidth = lineWidth;
    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y2);
    this.ctx.stroke();
    this.ctx.draw && this.ctx.draw(true);
  }

  drawCurveLine = (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, lineWidth: number) => {
    this.ctx.setLineWidth && this.ctx.setLineWidth(lineWidth);
    this.ctx.lineWidth = lineWidth;
    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1);
    this.ctx.quadraticCurveTo(x2, y2, x3, y3);
    this.ctx.stroke();
    this.ctx.draw && this.ctx.draw(true);
  }

  drawBgColor = () => {
    if (!this.bgColor) return;
    this.ctx.setFillStyle && this.ctx.setFillStyle(this.bgColor);
    this.ctx.fillStyle = this.bgColor;
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.ctx.draw && this.ctx.draw(true);
  }

  drawByImage = (url: any) => {
    this.ctx.clearRect(0, 0, this.width, this.height);
    try {
      this.ctx.drawImage(url, 0, 0, this.width, this.height);
      this.ctx.draw && this.ctx.draw(true);
    } catch (e) {
      this.historyList.length = 0;
    }
  }

  addHistory = () => {
    if (!this.maxHistoryLength || !this.canAddHistory) return;
    this.canAddHistory = false;
    if (!this.getImagePath) {
      this.historyList.length++;
      return;
    }
    this.getImagePath().then((url: any) => {
      if (url) {
        this.historyList.push(url);
        this.historyList = this.historyList.slice(-this.maxHistoryLength);
      };
    });
  }

  clear = () => {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.ctx.draw && this.ctx.draw();
    this.drawBgColor();
    this.historyList.length = 0;
  }

  undo = () => {
    if (!this.getImagePath || !this.historyList.length) return;
    const pngURL = this.historyList.splice(-1)[0];
    this.drawByImage(pngURL);
    if (this.historyList.length === 0) {
      this.clear();
    }
  }

  isEmpty = () => {
    return this.historyList.length === 0;
  }
}
module.exports = SmoothSignature;
export default SmoothSignature;