export interface Restaurant {
  id: string; // ID do usuário dono (Firebase Auth UID)
  name: string;
  email: string;
  whatsapp: string;
  logoUrl?: string;
  slug: string; // Nome na URL (ex: restaurante-do-joao)
  createdAt: any;
}