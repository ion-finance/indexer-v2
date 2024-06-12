export class GlobalVariables {
  private static _initialized = false

  static get initialized(): boolean {
    return this._initialized
  }

  static set initialized(value: boolean) {
    this._initialized = value
  }
}
