import { WasmLoader } from './WasmLoader';

interface DataPoint {
  x: number;
  y: number;
  price: number;
}

interface GridLine {
  y: number;
  price: number;
  is_major: boolean;
}

interface TimeGridLine {
  x: number;
  time: string;
  is_major: boolean;
}

interface VolumeBar {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

export class XCanvas {
  private canvas: HTMLCanvasElement;
  private wasmLoader: WasmLoader;
  private wasmInstance: any = null;
  private financialChart: any = null;
  private isDragging: boolean = false;
  private lastMouseX: number = 0;
  private lastMouseY: number = 0;
  private ctx: CanvasRenderingContext2D | null = null;
  private priceScaleWidth: number = 60; 
  private timeScaleHeight: number = 30; 

  constructor(canvas: HTMLCanvasElement | string) {
    if (typeof canvas === 'string') {
      const el = document.getElementById(canvas);
      if (!el) {
        throw new Error(`Canvas element "${canvas}" not found`);
      }
      if (!(el instanceof HTMLCanvasElement)) {
        throw new Error(`Element "${canvas}" is not a canvas`);
      }
      this.canvas = el;
    } else {
      this.canvas = canvas;
    }
    this.ctx = this.canvas.getContext('2d');
    this.wasmLoader = WasmLoader.getInstance();
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.canvas.addEventListener('mousedown', (e) => {
      e.preventDefault();
      this.isDragging = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
      this.canvas.style.cursor = 'grabbing';
    });
    this.canvas.addEventListener('mousemove', (e) => {
      if (this.isDragging && this.financialChart) {
        const dx = e.clientX - this.lastMouseX;
        const dy = e.clientY - this.lastMouseY;
        this.financialChart.pan(dx, dy);
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
        this.render();
      }
    });
    this.canvas.addEventListener('mouseup', () => {
      this.isDragging = false;
      this.canvas.style.cursor = 'grab';
    });
    this.canvas.addEventListener('mouseleave', () => {
      this.isDragging = false;
      this.canvas.style.cursor = 'default';
    });
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (this.financialChart) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseY = e.clientY - rect.top;
        this.financialChart.zoom(e.deltaY, mouseY);
        this.render();
      }
    });
    this.canvas.addEventListener('mouseenter', () => {
      if (!this.isDragging) {
        this.canvas.style.cursor = 'grab';
      }
    });
  }

  async init(): Promise<void> {
    try {
      this.wasmInstance = await this.wasmLoader.init();
    } catch (error) {
      throw error;
    }
  }

  initFinancialChart(): void {
    if (!this.wasmInstance) {
      throw new Error('WASM not initialized. Call init() first.');
    }

    try {
      this.financialChart = new this.wasmInstance.FinancialChart(
        this.canvas.width - this.priceScaleWidth,
        this.canvas.height - this.timeScaleHeight
      );
    } catch (error) {
      throw error;
    }
  }

  greet(name: string): string {
    if (!this.wasmInstance) {
      throw new Error('WASM not initialized. Call init() first.');
    }
    return this.wasmInstance.greet(name);
  }

  add(a: number, b: number): number {
    if (!this.wasmInstance) {
      throw new Error('WASM not initialized. Call init() first.');
    }
    return this.wasmInstance.add(a, b);
  }

  addDataPoint(timestamp: number, price: number, volume: number): void {
    if (!this.wasmInstance || !this.financialChart) {
      throw new Error('FinancialChart not initialized. Call initFinancialChart() first.');
    }

    this.financialChart.add_data(timestamp, price, volume);
    this.render();
  }

  addDataBatch(data: Array<{ timestamp: number, price: number, volume: number }>): void {
    if (!this.wasmInstance || !this.financialChart) {
      throw new Error('FinancialChart not initialized. Call initFinancialChart() first.');
    }

    this.financialChart.add_data_batch(data);
    this.render();
  }

  render(): void {
    if (!this.ctx || !this.financialChart) {
      return;
    }
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.canvas.width - this.priceScaleWidth, this.canvas.height - this.timeScaleHeight);
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.rect(0, 0, this.canvas.width - this.priceScaleWidth, this.canvas.height - this.timeScaleHeight);
    this.ctx.clip();
    this.drawGrid();
    this.drawPriceLine();
    this.drawVolumeBars();
    this.ctx.restore();
    this.drawPriceAxis();
    this.drawTimeAxis();
    this.drawBorder();
  }

  private drawGrid(): void {
    if (!this.ctx || !this.financialChart) return;
    try {
      const priceGrid = this.financialChart.get_price_grid() as GridLine[];
      this.ctx!.strokeStyle = '#2a2d3e';
      this.ctx!.lineWidth = 1;
      this.ctx!.font = '12px Arial';
      this.ctx!.fillStyle = '#888';
      priceGrid.forEach((line: any) => {
        const gridLine = {
          y: line.y,
          price: line.price,
          is_major: line.is_major
        };
        this.ctx!.strokeStyle = gridLine.is_major ? '#3a3f5b' : '#2a2d3e';
        this.ctx!.beginPath();
        this.ctx!.moveTo(0, gridLine.y);
        this.ctx!.lineTo(this.canvas.width - this.priceScaleWidth, gridLine.y);
        this.ctx!.stroke();
      });
      const timeGrid = this.financialChart.get_time_grid() as TimeGridLine[];
      timeGrid.forEach((line: any) => {
        const timeLine = {
          x: line.x,
          time: line.time,
          is_major: line.is_major
        };
        this.ctx!.strokeStyle = timeLine.is_major ? '#3a3f5b' : '#2a2d3e';
        this.ctx!.beginPath();
        this.ctx!.moveTo(timeLine.x, 0);
        this.ctx!.lineTo(timeLine.x, this.canvas.height - this.timeScaleHeight);
        this.ctx!.stroke();
      });
    } catch (error) {
    }
  }

  private drawPriceLine(): void {
    if (!this.ctx || !this.financialChart) return;
    try {
      const linePoints = this.financialChart.get_line_points() as DataPoint[];
      if (linePoints.length < 2) {
        return;
      }
      this.ctx.strokeStyle = '#2196f3';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      const firstPoint = linePoints[0];
      this.ctx.moveTo(firstPoint.x, firstPoint.y);
      for (let i = 1; i < linePoints.length; i++) {
        const point = linePoints[i];
        this.ctx.lineTo(point.x, point.y);
      }
      this.ctx.stroke();
      this.ctx.fillStyle = 'rgba(33, 150, 243, 0.1)';
      this.ctx.beginPath();
      this.ctx.moveTo(firstPoint.x, this.canvas.height - this.timeScaleHeight);
      this.ctx.lineTo(firstPoint.x, firstPoint.y);
      for (let i = 1; i < linePoints.length; i++) {
        const point = linePoints[i];
        this.ctx.lineTo(point.x, point.y);
      }
      const lastPoint = linePoints[linePoints.length - 1];
      this.ctx.lineTo(lastPoint.x, this.canvas.height - this.timeScaleHeight);
      this.ctx.closePath();
      this.ctx.fill();
    } catch (error) {
    }
  }

  private drawVolumeBars(): void {
    if (!this.ctx || !this.financialChart) return;
    try {
      const volumeBars = this.financialChart.get_volume_bars() as VolumeBar[];
      volumeBars.forEach((bar: any) => {
        const volumeBar = {
          x: bar.x,
          y: bar.y + (this.canvas.height - this.timeScaleHeight) * 0.7,
          width: bar.width,
          height: bar.height,
          color: bar.color
        };

        this.ctx!.fillStyle = volumeBar.color;
        this.ctx!.fillRect(volumeBar.x, volumeBar.y, volumeBar.width, volumeBar.height);
      });
    } catch (error) {
    }
  }

  private drawPriceAxis(): void {
    const ctx = this.ctx;
    if (!ctx || !this.financialChart) return;
    try {
      const priceGrid = this.financialChart.get_price_grid() as GridLine[];
      ctx.fillStyle = '#2d2d3e';
      ctx.fillRect(
        this.canvas.width - this.priceScaleWidth,
        0,
        this.priceScaleWidth,
        this.canvas.height - this.timeScaleHeight
      );
      ctx.fillStyle = '#888';
      ctx.font = '12px Arial';
      ctx.textAlign = 'right';
      priceGrid.forEach((line: any) => {
        const gridLine = {
          y: line.y,
          price: line.price,
          is_major: line.is_major
        };

        if (gridLine.is_major) {
          ctx.fillText(
            gridLine.price.toFixed(2),
            this.canvas.width - 5,
            gridLine.y + 4
          );
        }
      });
      ctx.strokeStyle = '#3a3f5b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(this.canvas.width - this.priceScaleWidth, 0);
      ctx.lineTo(this.canvas.width - this.priceScaleWidth, this.canvas.height - this.timeScaleHeight);
      ctx.stroke();
    } catch (error) {
    }
  }

  private drawTimeAxis(): void {
    const ctx = this.ctx;
    if (!ctx || !this.financialChart) return;
    try {
      const timeGrid = this.financialChart.get_time_grid() as TimeGridLine[];
      ctx.fillStyle = '#2d2d3e';
      ctx.fillRect(
        0,
        this.canvas.height - this.timeScaleHeight,
        this.canvas.width,
        this.timeScaleHeight
      );
      ctx.fillStyle = '#888';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      timeGrid.forEach((line: any) => {
        const timeLine = {
          x: line.x,
          time: line.time,
          is_major: line.is_major
        };
        if (timeLine.is_major) {
          ctx.fillText(
            timeLine.time,
            timeLine.x,
            this.canvas.height - 10
          );
        }
      });
      ctx.strokeStyle = '#3a3f5b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, this.canvas.height - this.timeScaleHeight);
      ctx.lineTo(this.canvas.width, this.canvas.height - this.timeScaleHeight);
      ctx.stroke();
    } catch (error) {
    }
  }

  private drawBorder(): void {
    if (!this.ctx) return;
    this.ctx.strokeStyle = '#3a3f5b';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(
      0,
      0,
      this.canvas.width - this.priceScaleWidth,
      this.canvas.height - this.timeScaleHeight
    );
  }

  clear(color?: string): void {
    if (!this.ctx) return;
    if (color) {
      this.ctx.fillStyle = color;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    } else {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  resetView(): void {
    if (this.financialChart) {
      this.financialChart.reset_view();
      this.render();
    }
  }

  generateSampleData(days: number = 30): void {
    if (!this.wasmInstance || !this.financialChart) {
      throw new Error('FinancialChart not initialized. Call initFinancialChart() first.');
    }
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;
    const data = [];
    let price = 100 + Math.random() * 20;
    for (let i = days * 4; i >= 0; i--) {
      const timestamp = now - (i * 6 * 60 * 60 * 1000);
      price += (Math.random() - 0.5) * 5;
      price = Math.max(80, Math.min(120, price));
      const volume = 1000000 + Math.random() * 5000000;
      data.push({
        timestamp,
        price,
        volume
      });
    }
    this.addDataBatch(data);
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  getFinancialChart(): any {
    return this.financialChart;
  }

  drawCircle(x: number, y: number, radius: number, color: string): void {
    if (!this.ctx) return;

    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = color;
    this.ctx.fill();
  }
}