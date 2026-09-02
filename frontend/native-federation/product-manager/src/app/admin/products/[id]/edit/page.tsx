import { ProductEditScreen } from '@/features/products/components/product-edit-screen';

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProductEditScreen productId={id} />;
}
