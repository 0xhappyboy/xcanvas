/* tslint:disable */
/* eslint-disable */

export class DataPoint {
  free(): void;
  [Symbol.dispose](): void;
  constructor(timestamp: number, price: number, volume: number);
  timestamp: number;
  price: number;
  volume: number;
}

export class FinancialChart {
  free(): void;
  [Symbol.dispose](): void;
  constructor(width: number, height: number);
  add_data(timestamp: number, price: number, volume: number): void;
  add_data_batch(data_points: any): void;
  get_line_points(): any;
  get_price_grid(): any;
  get_time_grid(): any;
  get_volume_bars(): any;
  zoom(delta: number, mouse_y: number): void;
  pan(dx: number, dy: number): void;
  reset_view(): void;
}

export function add(a: number, b: number): number;

export function greet(name: string): string;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_financialchart_free: (a: number, b: number) => void;
  readonly __wbg_datapoint_free: (a: number, b: number) => void;
  readonly __wbg_get_datapoint_timestamp: (a: number) => number;
  readonly __wbg_set_datapoint_timestamp: (a: number, b: number) => void;
  readonly __wbg_get_datapoint_price: (a: number) => number;
  readonly __wbg_set_datapoint_price: (a: number, b: number) => void;
  readonly __wbg_get_datapoint_volume: (a: number) => number;
  readonly __wbg_set_datapoint_volume: (a: number, b: number) => void;
  readonly datapoint_new: (a: number, b: number, c: number) => number;
  readonly financialchart_new: (a: number, b: number) => number;
  readonly financialchart_add_data: (a: number, b: number, c: number, d: number) => void;
  readonly financialchart_add_data_batch: (a: number, b: any) => [number, number];
  readonly financialchart_get_line_points: (a: number) => any;
  readonly financialchart_get_price_grid: (a: number) => any;
  readonly financialchart_get_time_grid: (a: number) => any;
  readonly financialchart_get_volume_bars: (a: number) => any;
  readonly financialchart_zoom: (a: number, b: number, c: number) => void;
  readonly financialchart_pan: (a: number, b: number, c: number) => void;
  readonly financialchart_reset_view: (a: number) => void;
  readonly greet: (a: number, b: number) => [number, number];
  readonly add: (a: number, b: number) => number;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_exn_store: (a: number) => void;
  readonly __externref_table_alloc: () => number;
  readonly __wbindgen_externrefs: WebAssembly.Table;
  readonly __externref_table_dealloc: (a: number) => void;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
