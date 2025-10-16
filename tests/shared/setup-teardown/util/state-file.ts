import { writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { ZodSafeParseResult, ZodType } from 'zod';

export class StateFile {
  private state: Record<string, Record<string, unknown>> = {};

  private readonly path: string;

  constructor(
    private readonly directory: string,
    private readonly runId: string
  ) {
    this.setValue('run', 'runId', runId);
    this.path = path.join(this.directory, 'state.json');
  }

  setValue(categoryKey: string, key: string, value: unknown) {
    this.state[categoryKey] ??= {};
    this.state[categoryKey][key] = value;
  }

  setValues(categoryKey: string, values: Record<string, unknown>) {
    this.state[categoryKey] = values;
  }

  getValue<T>(categoryKey: string, key: string, schema: ZodType<T>): T {
    const value = this.state[categoryKey]?.[key];
    const parsed = schema.safeParse(value);
    return this.wrapError(
      parsed,
      `Failed to retrieve ${categoryKey}.${key} in state file`
    );
  }

  getValues<T>(categoryKey: string, schema: ZodType<T>): T {
    const category = this.state[categoryKey];
    const parsed = schema.safeParse(category);
    return this.wrapError(
      parsed,
      `Failed to retrieve ${categoryKey} in state file`
    );
  }

  async loadFromDisk() {
    console.log('this.path', this.path);
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

  private wrapError<T>(res: ZodSafeParseResult<T>, message: string): T {
    if (!res.success) {
      throw new Error(message, { cause: res.error });
    }
    return res.data;
  }
}
