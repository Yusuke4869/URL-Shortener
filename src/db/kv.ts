type Key = [host: string, param: string];

export type Item = {
  param: string;
  description: string | undefined;
  url: string;
  count: number;
  unavailable: boolean;
};

class KV {
  private static instance: KV | null = null;
  private kv: Deno.Kv;

  private constructor(kv: Deno.Kv) {
    this.kv = kv;
  }

  static async getInstance(): Promise<KV> {
    if (this.instance === null) {
      const KV_PATH = Deno.env.get("KV_PATH") || undefined;
      const kv = await Deno.openKv(KV_PATH);
      this.instance = new KV(kv);
    }

    return this.instance;
  }

  async get(key: Key): Promise<Item | null> {
    const item = await this.kv.get<Item>(key);
    return item.value;
  }

  async getAll(host: string): Promise<Item[]> {
    const values: Item[] = [];

    const entries = this.kv.list<Item>({ prefix: [host] });
    for await (const entry of entries) {
      values.push(entry.value);
    }

    return values;
  }

  async set(key: Key, value: Item): Promise<void> {
    await this.kv.set(key, value);
  }

  async delete(key: Key): Promise<void> {
    await this.kv.delete(key);
  }
}

export default KV;
