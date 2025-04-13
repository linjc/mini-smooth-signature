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
  toDataURL?: () => string;
  requestAnimationFrame?: (fn: () => void) => void;
}

interface IPoint {
  x: number;
  y: number;
  t: number;
  speed?: number;
  distance?: number;
  lineWidth?: number;
  [key: string]: any;
}
interface History {
  points: IPoint[];
  color: string;
}

interface IRadianData {
  val: number;
  pos: -1 | 1;
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
  points: IPoint[] = [];
  toDataURL: any;
  requestAnimationFrame: any;
  curPoints: IPoint[] = [];
  historyList: History[] = [];
  init = (ctx: any, options: IOptions) => {
    if (!ctx) return;
    this.ctx = ctx;
    this.toDataURL = options.toDataURL;
    this.requestAnimationFrame = options.requestAnimationFrame;
    this.width = options.width || this.width;
    this.height = options.height || this.height;
    this.color = options.color || this.color;
    this.bgColor = options.bgColor || this.bgColor;
    this.openSmooth = options.openSmooth === undefined ? this.openSmooth : !!options.openSmooth;
    this.minWidth = options.minWidth || this.minWidth;
    this.maxWidth = options.maxWidth || this.maxWidth;
    this.minSpeed = options.minSpeed || this.minSpeed;
    this.maxWidthDiffRate = options.maxWidthDiffRate || this.maxWidthDiffRate;
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
    this.ctx.strokeStyle = this.color;
    this.ctx.setStrokeStyle && this.ctx.setStrokeStyle(this.color);
    this.initPoint(x, y);
  }

  onDrawMove = (x: number, y: number, color: any = this.color) => {
    this.initPoint(x, y);
    this.onDraw(color);
  }

  onDraw = (color: any = this.color) => {
    if (this.points.length < 2) return;

    const point: any = this.points.slice(-1)[0];
    const prePoint: any = this.points.slice(-2, -1)[0];
    const onDrawInner = (color: any = this.color) => {
      if (this.openSmooth) {
        this.drawSmoothLine(prePoint, point, color);
      } else {
        this.drawNoSmoothLine(prePoint, point, color);

      }
    }
    if (typeof this.requestAnimationFrame === 'function') {
      this.requestAnimationFrame(() => onDrawInner(color))
    } else {
      onDrawInner(color)
    }
  }

  onDrawEnd = () => {
    if (this.curPoints.length > 2) {
      this.historyList.push({
        points: this.curPoints,
        color: this.color
      });
    }
    this.points = [];
    this.curPoints = [];
  }

  getLineWidth = (speed: number) => {
    const minSpeed = this.minSpeed > 10 ? 10 : this.minSpeed < 1 ? 1 : this.minSpeed;
    const addWidth = (this.maxWidth - this.minWidth) * speed / minSpeed;
    const lineWidth = Math.max(this.maxWidth - addWidth, this.minWidth);
    return Math.min(lineWidth, this.maxWidth);
  }

  getRadianData = (x1: number, y1: number, x2: number, y2: number): IRadianData => {
    const dis_x = x2 - x1;
    const dis_y = y2 - y1;
    if (dis_x === 0) {
      return { val: 0, pos: -1 }
    }
    if (dis_y === 0) {
      return { val: 0, pos: 1 }
    }
    const val = Math.abs(Math.atan(dis_y / dis_x));
    if (x2 > x1 && y2 < y1 || (x2 < x1 && y2 > y1)) {
      return { val, pos: 1 }
    }
    return { val, pos: -1 }
  }

  getRadianPoints = (radianData: IRadianData, x: number, y: number, halfLineWidth: number) => {
    if (radianData.val === 0) {
      if (radianData.pos === 1) {
        return [
          { x, y: y + halfLineWidth },
          { x, y: y - halfLineWidth }
        ]
      }
      return [
        { y, x: x + halfLineWidth },
        { y, x: x - halfLineWidth }
      ]
    }
    const dis_x = Math.sin(radianData.val) * halfLineWidth;
    const dis_y = Math.cos(radianData.val) * halfLineWidth;
    if (radianData.pos === 1) {
      return [
        { x: x + dis_x, y: y + dis_y },
        { x: x - dis_x, y: y - dis_y }
      ]
    }
    return [
      { x: x + dis_x, y: y - dis_y },
      { x: x - dis_x, y: y + dis_y }
    ]
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
    this.curPoints.push(point);
    this.points = this.points.slice(-3);
  }

  drawSmoothLine = (prePoint: any, point: any, color: any = this.color) => {
    const dis_x = point.x - prePoint.x;
    const dis_y = point.y - prePoint.y;
    if (Math.abs(dis_x) + Math.abs(dis_y) <= 2) {
      point.lastX1 = point.lastX2 = prePoint.x + (dis_x * 0.5);
      point.lastY1 = point.lastY2 = prePoint.y + (dis_y * 0.5);
    } else {
      point.lastX1 = prePoint.x + (dis_x * 0.3);
      point.lastY1 = prePoint.y + (dis_y * 0.3);
      point.lastX2 = prePoint.x + (dis_x * 0.7);
      point.lastY2 = prePoint.y + (dis_y * 0.7);
    }
    point.perLineWidth = (prePoint.lineWidth + point.lineWidth) / 2;
    if (typeof prePoint.lastX1 === 'number') {
      this.drawCurveLine(prePoint.lastX2, prePoint.lastY2, prePoint.x, prePoint.y, point.lastX1, point.lastY1, point.perLineWidth, color);
      if (prePoint.isFirstPoint) return;
      if (prePoint.lastX1 === prePoint.lastX2 && prePoint.lastY1 === prePoint.lastY2) return;
      const data = this.getRadianData(prePoint.lastX1, prePoint.lastY1, prePoint.lastX2, prePoint.lastY2);
      const points1 = this.getRadianPoints(data, prePoint.lastX1, prePoint.lastY1, prePoint.perLineWidth / 2);
      const points2 = this.getRadianPoints(data, prePoint.lastX2, prePoint.lastY2, point.perLineWidth / 2);
      this.drawTrapezoid(points1[0], points2[0], points2[1], points1[1], color);
    } else {
      point.isFirstPoint = true;
    }
  }

  drawNoSmoothLine = (prePoint: any, point: any, color: any = this.color) => {
    point.lastX = prePoint.x + (point.x - prePoint.x) * 0.5;
    point.lastY = prePoint.y + (point.y - prePoint.y) * 0.5;
    if (typeof prePoint.lastX === 'number') {
      this.drawCurveLine(
        prePoint.lastX, prePoint.lastY,
        prePoint.x, prePoint.y,
        point.lastX, point.lastY,
        this.maxWidth,
        color
      );
    }
  }

  drawCurveLine = (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, lineWidth: number, color: any = this.color) => {
    lineWidth = Number(lineWidth.toFixed(1));
    this.ctx.setLineWidth && this.ctx.setLineWidth(lineWidth);
    this.ctx.lineWidth = lineWidth;
    this.ctx.beginPath();
    this.ctx.moveTo(Number(x1.toFixed(1)), Number(y1.toFixed(1)));
    this.ctx.quadraticCurveTo(
      Number(x2.toFixed(1)), Number(y2.toFixed(1)),
      Number(x3.toFixed(1)), Number(y3.toFixed(1))
    );
    this.ctx.strokeStyle = color;
    this.ctx.setStrokeStyle && this.ctx.setStrokeStyle(color);
    this.ctx.stroke();
    this.ctx.draw && this.ctx.draw(true);
  }

  drawTrapezoid = (point1: any, point2: any, point3: any, point4: any, color: any = this.color) => {
    this.ctx.beginPath();
    this.ctx.moveTo(Number(point1.x.toFixed(1)), Number(point1.y.toFixed(1)));
    this.ctx.lineTo(Number(point2.x.toFixed(1)), Number(point2.y.toFixed(1)));
    this.ctx.lineTo(Number(point3.x.toFixed(1)), Number(point3.y.toFixed(1)));
    this.ctx.lineTo(Number(point4.x.toFixed(1)), Number(point4.y.toFixed(1)));
    this.ctx.setFillStyle && this.ctx.setFillStyle(color);
    this.ctx.fillStyle = color;
    this.ctx.fill();
    this.ctx.draw && this.ctx.draw(true);
  }

  drawBgColor = () => {
    if (!this.bgColor) return;
    this.ctx.setFillStyle && this.ctx.setFillStyle(this.bgColor);
    this.ctx.fillStyle = this.bgColor;
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.ctx.draw && this.ctx.draw(true);
  }


  clear = () => {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.ctx.draw && this.ctx.draw();
    this.drawBgColor();
    this.historyList = [];
  }

  undo = () => {
    this.historyList.pop();
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.ctx.draw && this.ctx.draw();
    this.drawBgColor();

    for (let i = 0; i < this.historyList.length; i++) {
      this.points = [];
      for (let j = 0; j < this.historyList[i].points.length; j++) {
        this.points.push(this.historyList[i].points[j]);
        this.points = this.points.slice(-3);
        this.onDraw(this.historyList[i].color);
      }
    }
    this.points = [];
  }

  isEmpty = () => {
    return this.historyList.length === 0;
  }
}
module.exports = SmoothSignature;
export default SmoothSignature;