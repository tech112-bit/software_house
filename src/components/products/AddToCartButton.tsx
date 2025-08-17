'use client';

import { useCart } from '@/context/CartContext';
import { useState } from 'react';

interface Product {
  id: string;
  name: string;
  price: number;
}

interface AddToCartButtonProps {
  product: Product;
}

export default function AddToCartButton({ product }: AddToCartButtonProps) {
  const { addToCart } = useCart();
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = () => {
    addToCart(product);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <button
      onClick={handleAddToCart}
      className={`w-full px-6 py-3 rounded-lg font-medium text-lg transition-all duration-200 ${
        isAdded
          ? 'bg-green-500 text-white'
          : 'bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg'
      }`}
      disabled={isAdded}
    >
      {isAdded ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          Added to Cart
        </span>
      ) : (
        <span className="flex items-center justify-center gap-2">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5 6m0 0h9"
            />
          </svg>
          Add to Cart
        </span>
      )}
    </button>
  );
}
