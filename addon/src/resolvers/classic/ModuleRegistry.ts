// eslint-disable-next-line @typescript-eslint/no-explicit-any
export declare function require(id: string): any;

export declare const requirejs: {
  entries?: Record<string, unknown>;
  _eak_seen?: Record<string, unknown>;
};

if (typeof requirejs.entries === 'undefined') {
  requirejs.entries = requirejs._eak_seen;
}

export default class ModuleRegistry {
  private _entries: Record<string, unknown>;

  constructor(readonly entries?: Record<string, unknown>) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this._entries = entries || requirejs.entries!;
  }

  moduleNames(): string[] {
    return Object.keys(this._entries);
  }

  has(moduleName: string): boolean {
    return moduleName in this._entries;
  }

  get(...args: Parameters<typeof require>) {
    return require(...args);
  }
}
