export type ImportSource = {
  filename: string;
  mimeType: string;
  content: Uint8Array;
};

export type ImportLineError = {
  line: number;
  message: string;
};

export type ImportResult =
  | { ok: true }
  | { ok: false; errors: ImportLineError[] };

export interface ImportOperations {
  execute(source: ImportSource): Promise<ImportResult>;
}
