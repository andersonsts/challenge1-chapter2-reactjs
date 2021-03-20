import { createContext, ReactNode, useContext, useState } from 'react';
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

  const addProduct = async (productId: number) => {
    try {
      const existInCart = cart.find(product => product.id === productId);

      if(!existInCart) {
        toast.error('Erro na adição do produto')
      }

      if(existInCart) {
        const { data: productStock } = await api.get<Stock>(`stock/${existInCart.id}`)
        const possibleAmount = existInCart.amount + 1;

        if(possibleAmount < productStock.amount) {
          toast.error('Quantidade solicitada fora de estoque')
          return;
        }

        const updatedCart = cart.map(product => product.id === existInCart.id ? { ...product, amount: product.amount + 1 } : product)
        setCart(updatedCart)
        const updatedCartFormatted = JSON.stringify(updatedCart)
        localStorage.setItem('@RocketShoes:cart', updatedCartFormatted)
      } else {
        const { data } = await api.get('/products');
        const findedProduct = data.find((productFromApi: Omit<Product, 'amount'>) => productFromApi.id === productId)

        const updatedCart = [...cart, { ...findedProduct, amount: 1 } ]
        setCart(updatedCart)
        const updatedCartFormatted = JSON.stringify(updatedCart)
        localStorage.setItem('@RocketShoes:cart', updatedCartFormatted)
      }
    } catch {
      // toast
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const findedProduct = cart.find(product => product.id === productId)

      if(!findedProduct) {
        toast.error('Erro na remoção do produto')
        return;
      }

      const updatedCart = cart.filter(product => product.id !== productId)
      setCart(updatedCart)
      const updatedCartFormatted = JSON.stringify(updatedCart)
      localStorage.setItem('@RocketShoes:cart', updatedCartFormatted)
    } catch {

    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const findedProduct = cart.find(product => product.id === productId);

      if(!findedProduct) {
        toast.error('Erro na alteração de quantidade do produto')
        return;
      }

      if(amount < 1) return;
      
      // const possibleAmount = findedProduct.amount + 1;
     
      // // if(possibleAmount < productStock.amount) {
      // //   toast.error('Quantidade solicitada fora de estoque')
      // //   return;
      // // }

      if(findedProduct.amount < amount) {
        const { data: productStock } = await api.get<Stock>(`stock/${findedProduct.id}`)
        
        if(productStock.amount < amount) {
          toast.error('Quantidade solicitada fora de estoque')
          return;
        }
      } 

      const updatedCart = cart.map(product => product.id === findedProduct.id ? { ...product, amount } : product)
      setCart(updatedCart)
      
      const updatedCartFormatted = JSON.stringify(updatedCart)
      localStorage.setItem('@RocketShoes:cart', updatedCartFormatted)
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
