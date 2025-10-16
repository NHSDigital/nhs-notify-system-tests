import { writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';

export class StateFile {
  private state: Record<string, Record<string, string>> = {};

  private readonly path: string;

  constructor(
    private readonly directory: string,
    private readonly runId: string
  ) {
    this.state['run'] = {
      runId,
    };

    this.path = path.join(this.directory, 'state.json');
  }

  add(categoryKey: string, key: string, value: string) {
    this.state[categoryKey] ??= {};
    this.state[categoryKey][key] = value;
  }

  getValue(categoryKey: string, key: string): string {
    const value = this.state[categoryKey]?.[key];

    if (value === undefined) {
      throw new Error(`${categoryKey}.${key} is undefined`);
    }

    return value;
  }

  getValues(categoryKey: string): Record<string, string> {
    const category = this.state[categoryKey];

    if (category === undefined) {
      throw new Error(`${categoryKey} is undefined`);
    }

    return category;
  }

  async readFromDisk() {
    const storedState = JSON.parse(await readFile(this.path, 'utf8'));

    const storedRunId = storedState['run']['runId'];

    if (storedRunId !== this.runId) {
      throw new Error(
        `Stored runId: '${storedRunId}' does not match expected: '${this.runId}'`
      );
    }

    this.state = storedState;
  }

  async persist() {
    await writeFile(this.path, JSON.stringify(this.state, null, 2));
  }
}
