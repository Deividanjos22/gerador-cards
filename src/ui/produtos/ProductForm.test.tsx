import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ProductForm } from './ProductForm';
import { type Product } from '../../domain/product';
import { searchProductImages } from '../../utils/cloudinary';

vi.mock('../../utils/cloudinary', () => ({
  searchProductImages: vi.fn(),
  uploadProductImage: vi.fn(),
}));

const picanha: Product = {
  id: 'p1',
  nome: 'Picanha',
  precos: { matriz: { preco: 89.9, cv: 85 } },
  unidade: 'KG',
  categoria: 'Bovinos',
  ativo: true,
};

function renderForm(opts: { product?: Product | null } = {}) {
  const onSave = vi.fn();
  const onCancel = vi.fn();
  render(
    <ProductForm
      product={opts.product === undefined ? null : opts.product}
      onSave={onSave}
      onCancel={onCancel}
    />,
  );
  return { onSave, onCancel };
}

describe('ProductForm', () => {
  it('cria um novo produto com preço da loja Matriz', async () => {
    const user = userEvent.setup();
    const { onSave } = renderForm();

    await user.type(screen.getByLabelText(/nome/i), 'Picanha');
    const preco = screen.getAllByLabelText('Preço (R$)')[0];
    await user.clear(preco);
    await user.type(preco, '89,90');
    const unidade = screen.getByLabelText(/unidade/i);
    await user.clear(unidade);
    await user.type(unidade, 'kg');
    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        nome: 'Picanha',
        precos: { matriz: { preco: 89.9 } },
        unidade: 'KG',
      }),
    );
  });

  it('edita um produto mantendo os valores existentes', async () => {
    const user = userEvent.setup();
    const { onSave } = renderForm({ product: picanha });

    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        nome: 'Picanha',
        precos: { matriz: { preco: 89.9, cv: 85 } },
        unidade: 'KG',
      }),
    );
  });

  it('chama onCancel ao cancelar', async () => {
    const user = userEvent.setup();
    const { onCancel } = renderForm({ product: picanha });

    await user.type(screen.getByLabelText(/categoria/i), 'c');
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('mostra o erro retornado quando a busca de imagens falha', async () => {
    const user = userEvent.setup();
    vi.mocked(searchProductImages).mockRejectedValueOnce(
      new Error('This project does not have the access to Custom Search JSON API.'),
    );
    renderForm();

    await user.type(screen.getByPlaceholderText('Buscar imagem...'), 'Arroz');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'This project does not have the access to Custom Search JSON API.',
    );
  });
});