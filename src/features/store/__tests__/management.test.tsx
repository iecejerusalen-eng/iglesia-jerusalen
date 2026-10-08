import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ProductList from '../components/ProductList';
import OrderManager from '../components/OrderManager';
import { product } from './fixtures';
import type { Order } from '../../../types';

const actions = { onOpenCreate: vi.fn(), onEdit: vi.fn(), onDelete: vi.fn() };
describe('Gestión de comercio', () => {
  it('filtra por SKU y calcula stock desde variantes', () => {
    render(<ProductList products={[{ ...product, sku: 'GUI-01', stock: 100, product_variants: [{ color_name: 'Azul', color_hex: '', size: 'M', cloudinary_image_url: '', stock: 0, price_adjustment: 0 }] }]} {...actions} />);
    fireEvent.change(screen.getByLabelText('Buscar productos por nombre, SKU o categoría'), { target: { value: 'gui-01' } });
    fireEvent.change(screen.getByLabelText('Filtrar publicación y stock'), { target: { value: 'out' } });
    expect(screen.getByText('Guía de oración')).toBeInTheDocument();
    expect(screen.getByText('0 unidades')).toBeInTheDocument();
  });
  it('limita cada página y oculta acciones para acceso de consulta', () => {
    const products = Array.from({ length: 13 }, (_, index) => ({ ...product, id: `${index}`, name: `Producto ${index}` }));
    render(<ProductList products={products} canEdit={false} {...actions} />);
    expect(screen.getAllByRole('article')).toHaveLength(12);
    expect(screen.queryByText('Nuevo producto')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Editar/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Siguiente'));
    expect(screen.getAllByRole('article')).toHaveLength(1);
  });
  it('muestra comprobantes del checkout y bloquea cambios sin permiso', () => {
    const order: Order = { id: 'order-1', user_id: null, customer_name: 'Cliente', customer_email: 'test@example.com', total: 10, status: 'pending_payment', ecommerce_payment_method: 'transfer', payment_receipt_url: 'https://example.com/receipt.pdf', created_at: '2026-01-01' };
    render(<OrderManager orders={[order]} canEdit={false} selectedOrder={order} setSelectedOrder={vi.fn()} actionLoading={false} onUpdateOrderStatus={vi.fn()} onCancelOrder={vi.fn()} onApproveTransfer={vi.fn()} onOpenShippingOverride={vi.fn()} onOpenRefundModal={vi.fn()} />);
    expect(screen.getByRole('link', { name: 'Ver Completo' })).toHaveAttribute('href', order.payment_receipt_url);
    expect(screen.getByRole('button', { name: 'Aprobar Pago' })).toBeDisabled();
  });
});
