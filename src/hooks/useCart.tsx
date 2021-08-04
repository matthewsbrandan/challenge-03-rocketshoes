import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
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

  // useEffect(() => {
  //   localStorage.setItem('@RocketShoes:cart',JSON.stringify(cart));
  // }, [cart]);

  const addProduct = async (productId: number) => {
    try {
      const { data } = await api.get<Stock>(`stock/${productId}`);

      const indexProductInCart = cart.findIndex(product => product.id === productId);
      if(indexProductInCart > -1){
        
        if(cart[indexProductInCart].amount+1 > data.amount){
          toast.error("Quantidade solicitada fora de estoque");
          return;
        }

        let temp = cart;
        temp[indexProductInCart].amount++;
        setCart([...temp]);
        localStorage.setItem('@RocketShoes:cart',JSON.stringify([...temp]));
      }
      else await api.get(`products/${productId}`).then(product => {
        setCart([...cart, {
          ...product.data,
          amount: 1
        }])
        localStorage.setItem('@RocketShoes:cart',JSON.stringify([...cart, {
          ...product.data,
          amount: 1
        }]));
      });
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      if(cart.find(product => product.id === productId)){
        setCart(
          old => [...old.filter(product => product.id !== productId)]
        );
        localStorage.setItem('@RocketShoes:cart',JSON.stringify([
          ...cart.filter(product => product.id !== productId)
        ]));
      }else{
        toast.error("Erro na remoção do produto");  
      }
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if(amount < 1) return;
      const indexProduct = cart.findIndex(product => product.id === productId);
      if(indexProduct === -1){
        toast.error("Erro na alteração de quantidade do produto");
        return;
      }
      let temp = cart;
      if(cart[indexProduct].amount >  amount){
        temp[indexProduct].amount = amount;
        setCart([...temp]);
        localStorage.setItem('@RocketShoes:cart',JSON.stringify([...temp]));
      }
      else{
        try {
          const { data } = await api.get<Stock>(`stock/${productId}`);
    
          const indexProductInCart = cart.findIndex(product => product.id === productId);
          if(indexProductInCart > -1){
            
            if(cart[indexProductInCart].amount+1 > data.amount){
              toast.error("Quantidade solicitada fora de estoque");
              return;
            }
    
            let temp = cart;
            temp[indexProductInCart].amount++;
            setCart([...temp]);
            localStorage.setItem('@RocketShoes:cart',JSON.stringify([...temp]));
          }
          else toast.error("Erro na alteração de quantidade do produto");
        } catch {
          toast.error("Erro na alteração de quantidade do produto");
        }
      }
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
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
