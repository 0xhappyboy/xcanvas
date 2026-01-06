export class WasmLoader {
  private static instance: WasmLoader;
  private wasm: any = null;
  private isInitialized = false;

  private constructor() { }

  public static getInstance(): WasmLoader {
    if (!WasmLoader.instance) {
      WasmLoader.instance = new WasmLoader();
    }
    return WasmLoader.instance;
  }

  public async init(): Promise<any> {
    if (this.isInitialized) {
      return this.wasm;
    }
    try {
      const wasmModule = await import('./wasm/xcanvas_charts');
      if (wasmModule.default) {
        await wasmModule.default();
      } else {
        throw new Error('No WASM initialization function found');
      }
      this.wasm = wasmModule;
      this.isInitialized = true;
      return this.wasm;
    } catch (error) {
      throw error;
    }
  }
}