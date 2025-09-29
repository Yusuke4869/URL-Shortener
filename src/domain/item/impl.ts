export interface ItemFields {
  param: string;
  description?: string;
  url: string;
  count: number;
  unavailable: boolean;
}

export class Item {
  public readonly param: string;
  public readonly description: string | undefined;
  private readonly _url: string;
  public readonly count: number;
  public readonly unavailable: boolean;

  constructor({ param, description, url, count, unavailable }: ItemFields) {
    this.param = param;
    this.description = description;
    this._url = url;
    this.count = count;
    this.unavailable = unavailable;
  }

  get url(): string | null {
    if (this.unavailable) return null;
    return this._url;
  }

  getFields(): ItemFields {
    return {
      param: this.param,
      description: this.description,
      url: this._url,
      count: this.count,
      unavailable: this.unavailable,
    };
  }

  toJSON(): ItemFields {
    return this.getFields();
  }
}
