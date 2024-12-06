export type LinkParams = Record<string, string | number>;

export type SearchSort = { [param: string]: 'asc' | 'desc' };
export type SearchFieldType = 'number' | 'string' | 'datetime';
export type SearchField = string | { [name: string]: SearchFieldType };

export type FindScope = { [name: string]: (string | number)[] };
export type FindResult<T> = { data: T[]; totalCount?: number };

export type MediaParams = Record<string, string | number | Blob> & {
  name: string;
  type: string;
};

export interface Search {
  fields: SearchField[];
  sort?: SearchSort;
}

export interface FindSort {
  selector: string;
  desc: boolean;
}

export interface Group {
  selector: string;
}

export interface FindOptions {
  filter?: any[];
  scopes?: FindScope;
  search?: string | number;
  skip?: number;
  limit?: number;
  sort?: FindSort[];
  sync?: boolean;
  group?: Group[];
}

export interface DataStoreOptions {
  search?: Search;
}

export interface DataStore<T = any> {
  key(): string;

  findOne(key: string): Promise<T>;

  findAll(options?: FindOptions): Promise<FindResult<T>>;

  exists(options: any): Promise<boolean>;

  count(options: any): Promise<number>;

  insert(data: T): Promise<any>;

  update(data: T): Promise<any>;

  remove(key: string): Promise<void>;

  link(params: LinkParams): void;

  download(key: string): Promise<Blob>;

  upload(params: MediaParams): Promise<any>;
}
