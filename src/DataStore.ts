export type LinkParams = Record<string, string | number>;
export type SearchSort = { [param: string]: 'asc' | 'desc' };
export type SearchFieldType = 'number' | 'string' | 'datetime';
export type SearchField = string | { [name: string]: SearchFieldType };
export type MediaParams = LinkParams & { name: string; type: string };

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
  filter?: any;
  searchValue?: string | number;
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

  findAll(options?: FindOptions): Promise<T[]>;

  exists(options: any): Promise<boolean>;

  insert(data: T): Promise<any>;

  update(data: T): Promise<any>;

  remove(key: string): Promise<void>;

  link(params: LinkParams): void;

  allMedia(key: string): Promise<any[]>;

  getMedia(key: string, name: string): Promise<Blob>;

  putMedia(key: string, data: Blob, params: MediaParams): Promise<any>;

  removeMedia(key: string, name: string): Promise<void>;
}
