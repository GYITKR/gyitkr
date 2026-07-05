export type PortfolioItem = {
  id: string;
  url: string;
  pathname: string;
  title: string;
  category: string;
  width: number;
  height: number;
  order: number;
  createdAt: string;
};
export type Manifest = { items: PortfolioItem[] };
