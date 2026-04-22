export interface Anuncio {
  id: number;
  title: string;
  content: string;
  isActive: boolean;
  publishedAt: string;
}

export interface CreateAnuncioDto {
  title: string;
  content: string;
  isActive?: boolean;
}

export interface UpdateAnuncioDto {
  title?: string;
  content?: string;
  isActive?: boolean;
}

