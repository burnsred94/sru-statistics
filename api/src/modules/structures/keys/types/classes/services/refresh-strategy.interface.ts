export interface IRefreshStrategy {
  refresh(keywords?: string): void;
  send(): void;
}
