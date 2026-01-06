import { WasmLoader } from './WasmLoader';

export class XCanvas {
  private canvas: HTMLCanvasElement;
  private wasmLoader: WasmLoader;
  private wasmInstance: any = null;

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

    this.wasmLoader = WasmLoader.getInstance();
  }

  async init(): Promise<void> {
    try {
      this.wasmInstance = await this.wasmLoader.init();
    } catch (error) {
      console.warn('WASM initialization failed:', error);
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

  drawCircle(x: number, y: number, radius: number, color: string): void {
    if (!this.wasmInstance) {
      this.drawCircleJS(x, y, radius, color);
      return;
    }
    const ctx = this.canvas.getContext('2d');
    if (ctx && this.wasmInstance.draw_circle) {
      this.wasmInstance.draw_circle(ctx, x, y, radius, color);
    } else {
      this.drawCircleJS(x, y, radius, color);
    }
  }

  private drawCircleJS(x: number, y: number, radius: number, color: string): void {
    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }

  clear(color?: string): void {
    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;
    if (color) {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    } else {
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }
}