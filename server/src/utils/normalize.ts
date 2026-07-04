export function normalizeProduct(product: any): any {
  if (!product) return null;
  return {
    id: product.id,
    barcode: product.barcode,
    name: product.name,
    company: product.company,
    category: product.category,
    location: product.location,
    distributor_id: product.distributorId ?? null,
    sale_price: product.salePrice ?? 0,
    purchase_price: product.purchasePrice ?? 0,
    markup_percent: product.markupPercent ?? 20,
    stock_qty: product.stockQty ?? 0,
    expiry: product.expiry ?? null,
    active: product.active ?? 1,
    created_at: product.createdAt?.toISOString?.() ?? product.createdAt,
    prices: product.prices?.map((p: any) => ({
      id: p.id,
      productId: p.productId,
      label: p.label,
      purchasePrice: p.purchasePrice,
      salePrice: p.salePrice,
    })) ?? [],
  };
}

export function normalizeProductList(products: any[]): any[] {
  return products.map(normalizeProduct);
}
