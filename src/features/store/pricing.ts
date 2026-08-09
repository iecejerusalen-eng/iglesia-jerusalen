import type { Product, ProductPriceTier, ProductVariant } from '../../types';

export const getProductBasePrice = (product: Product, variant?: ProductVariant | null) => {
  const regularPrice = Number(product.price) || 0;
  const salePrice = product.discount_price != null && Number(product.discount_price) < regularPrice
    ? Number(product.discount_price)
    : regularPrice;
  return salePrice + (Number(variant?.price_adjustment) || 0);
};

export const getPriceTiers = (product: Product): ProductPriceTier[] => {
  const tiers = product.metadata?.price_tiers;
  if (!Array.isArray(tiers)) return [];

  return tiers
    .filter((tier) => Number.isInteger(tier.min_quantity) && tier.min_quantity > 1 && tier.unit_price >= 0)
    .sort((a, b) => a.min_quantity - b.min_quantity);
};

export const getUnitPrice = (
  product: Product,
  quantity: number,
  variant?: ProductVariant | null,
) => {
  const basePrice = getProductBasePrice(product, variant);
  const matchingTier = getPriceTiers(product)
    .filter((tier) => quantity >= tier.min_quantity)
    .at(-1);

  return matchingTier ? Math.min(basePrice, Number(matchingTier.unit_price)) : basePrice;
};

export const getLineSubtotal = (
  product: Product,
  quantity: number,
  variant?: ProductVariant | null,
) => getUnitPrice(product, quantity, variant) * quantity;

export const getLineTax = (
  product: Product,
  quantity: number,
  variant?: ProductVariant | null,
) => getLineSubtotal(product, quantity, variant) * ((Number(product.tax_rate) || 0) / 100);

export const getProductImages = (product: Product, variant?: ProductVariant | null) => {
  const mediaUrls = product.metadata?.media
    ?.map((item) => item.url)
    .filter((url): url is string => Boolean(url)) || [];
  const candidates = [
    variant?.cloudinary_image_url,
    product.cover_image_url,
    product.thumbnail_url,
    product.image_url,
    ...mediaUrls,
  ].filter((url): url is string => Boolean(url));

  return [...new Set(candidates)];
};
