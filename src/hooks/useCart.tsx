import {
  createContext,
  ReactNode,
  useContext,
  useState,
  useEffect
} from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  useEffect(() => {
    localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
  }, [cart]);

  const addProduct = async (productId: number) => {
    try {
      const {
        data: [productData]
      } = await api.get<Product[]>('products', {
        params: { id: productId }
      });

      const product = cart.find(product => product.id === productId);

      if (product) {
        const { id, amount } = product;

        return updateProductAmount({ productId: id, amount: amount + 1 });
      }

      const newProduct = { ...productData, amount: 1 };

      setCart([...cart, newProduct]);
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const filteredCart = cart.filter(product => product.id !== productId);

      setCart(filteredCart);
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount
  }: UpdateProductAmount) => {
    try {
      const {
        data: [productStock]
      } = await api.get<Stock[]>('stock', {
        params: { id: productId }
      });

      const productIsAvailableInStock = productStock.amount > amount;

      if (!productIsAvailableInStock) {
        toast.error('Quantidade solicitada fora de estoque');

        return;
      }

      const updatedAmountCartProduct = cart.map(product => {
        return product.id === productId ? { ...product, amount } : product;
      });

      setCart(updatedAmountCartProduct);
    } catch {
      // TODO
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
