export interface IPaginationResponse {
  [x: string]:
    | number
    | unknown[]
    | {
        page: number;
        total: number;
        page_size: number;
      };
  meta: {
    page: number;
    total: number;
    page_size: number;
  };
  count: number;
}
