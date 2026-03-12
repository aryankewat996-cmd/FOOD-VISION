export interface OFFProduct {
  product_name: string;
  image_url?: string;
  ingredients_text?: string;
  nutriments?: {
    energy_100g?: number;
    sugars_100g?: number;
    fat_100g?: number;
    proteins_100g?: number;
    sodium_100g?: number;
  };
  nova_group?: number;
}

export async function getProductByBarcode(barcode: string): Promise<OFFProduct | null> {
  try {
    const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
    const data = await response.json();
    if (data.status === 1) {
      return data.product;
    }
    return null;
  } catch (error) {
    console.error("Open Food Facts error:", error);
    return null;
  }
}
